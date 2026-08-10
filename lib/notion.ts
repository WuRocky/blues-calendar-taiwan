import { createError, useRuntimeConfig } from '#imports'
import { Client, isFullDatabase } from '@notionhq/client'
import type { QueryDataSourceResponse } from '@notionhq/client/build/src/api-endpoints/data-sources'
import type { ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints/blocks'
import { z } from 'zod'
import { evaluateEventTime, normalizeNotionDateTime, shouldDisplayPublicEvent, sortEventsByDisplayPriority, withEventTimeStatus } from '~~/lib/event-time'
import { selectDatedHomeCalendarEvents } from '~~/lib/home-events'
import { normalizeEventStatus } from '~~/lib/event-status'
import { collectPaginatedNotionResults } from '~~/lib/notion-pagination'
import type { BaseEventItem, EventItem, EventStatus, EventType } from '~~/types/event'

const publicSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const EVENTS_CACHE_TTL_SECONDS = 300

export interface NotionConnectionConfig {
  token?: string
  databaseId?: string
  notionEventsDatabaseId: string
  notionToken: string
}

const eventSchema = z.object({
  id: z.string().default(''),
  slug: z.string().default(''),
  name: z.string().default('Untitled Event'),
  status: z.string().default('Draft'),
  eventStatus: z.enum(['scheduled', 'cancelled', 'postponed']).default('scheduled'),
  eventType: z.enum(['class', 'social', 'event', 'practice', 'open-floor', 'party', 'workshop', 'festival', 'other']).default('other'),
  summary: z.string().default(''),
  description: z.string().default(''),
  scheduleType: z.string().default(''),
  startTime: z.string().nullable().default(null),
  endTime: z.string().nullable().default(null),
  startTimeIsDateOnly: z.boolean().default(false),
  endTimeIsDateOnly: z.boolean().default(false),
  specificDates: z.string().default(''),
  venueName: z.string().default(''),
  venueUrl: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  country: z.string().default(''),
  organizer: z.string().default(''),
  weekday: z.string().nullable().default(null),
  weekdayOrder: z.number().nullable().default(null),
  price: z.string().default(''),
  level: z.string().default(''),
  registrationUrl: z.string().default(''),
  coverImageUrl: z.string().default(''),
  recurring: z.boolean().default(false),
  recurringText: z.string().default(''),
  published: z.boolean().default(false)
})

function resolveNotionConnectionConfig(overrides?: Partial<NotionConnectionConfig>): NotionConnectionConfig {
  const config = useRuntimeConfig()
  const notionToken = overrides?.notionToken || overrides?.token || config.notionToken || ''
  const notionEventsDatabaseId = overrides?.notionEventsDatabaseId || overrides?.databaseId || config.notionEventsDatabaseId || ''

  return {
    notionToken,
    notionEventsDatabaseId
  }
}

function getNotionClient(overrides?: Partial<NotionConnectionConfig>) {
  const config = resolveNotionConnectionConfig(overrides)

  if (!config.notionToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NOTION_TOKEN'
    })
  }

  return new Client({
    auth: config.notionToken
  })
}

function normalizeEventType(value: string): EventType {
  switch (value.toLowerCase()) {
    case 'class':
      return 'class'
    case 'event':
      return 'event'
    case 'practice':
      return 'practice'
    case 'social':
      return 'social'
    case 'open-floor':
    case 'party':
    case 'workshop':
    case 'festival':
      return value.toLowerCase() as EventType
    default:
      return 'other'
  }
}

function getProperty(page: any, name: string) {
  return page?.properties?.[name]
}

function getTitle(page: any, name: string) {
  const property = getProperty(page, name)
  return property?.title?.map((item: any) => item?.plain_text || '').join('') || ''
}

function getRichText(page: any, name: string) {
  const property = getProperty(page, name)
  return property?.rich_text?.map((item: any) => item?.plain_text || '').join('') || ''
}

function getSelect(page: any, name: string) {
  return getProperty(page, name)?.select?.name || ''
}

function getCheckbox(page: any, name: string) {
  return Boolean(getProperty(page, name)?.checkbox)
}

function getUrl(page: any, name: string) {
  return getProperty(page, name)?.url || ''
}

function getNumber(page: any, name: string) {
  const value = getProperty(page, name)?.number
  return typeof value === 'number' ? value : null
}

function getDate(page: any, name: string) {
  return getProperty(page, name)?.date?.start || null
}

function getFiles(page: any, name: string) {
  const file = getProperty(page, name)?.files?.[0]

  if (!file) {
    return ''
  }

  return file?.external?.url || file?.file?.url || ''
}

function getPlainTextProperty(page: any, name: string) {
  const property = getProperty(page, name)

  if (!property) {
    return ''
  }

  if (property.type === 'rich_text') {
    return getRichText(page, name)
  }

  if (property.type === 'title') {
    return getTitle(page, name)
  }

  if (property.type === 'number') {
    return property.number?.toString() || ''
  }

  if (property.type === 'select') {
    return property.select?.name || ''
  }

  if (property.type === 'url') {
    return property.url || ''
  }

  if (property.type === 'date') {
    return property.date?.start || ''
  }

  return property.plain_text || ''
}

function warnInvalidPublicEvent(page: any, reason: string, slug: string) {
  if (!import.meta.dev) {
    return
  }

  const pageId = typeof page?.id === 'string' ? page.id : 'unknown'
  const details = slug ? `slug="${slug}"` : 'slug=<empty>'

  console.warn(`[events] Skipping published event ${pageId}: ${reason} (${details})`)
}

function warnInvalidPublicEventTime(event: BaseEventItem, reason: string) {
  if (!import.meta.dev) {
    return
  }

  const identifier = event.slug || event.id || 'unknown'
  const eventName = event.name || 'Untitled Event'

  console.warn(`[events] Skipping published event ${identifier}: ${reason} (name="${eventName}")`)
}

function warnFallbackEventStatus(page: any, reason: string, rawValue: string) {
  if (!import.meta.dev) {
    return
  }

  const pageId = typeof page?.id === 'string' ? page.id : 'unknown'
  const eventName = getTitle(page, 'Name') || 'Untitled Event'
  const rawDetails = rawValue ? `raw="${rawValue}"` : 'raw=<empty>'

  console.warn(`[events] Falling back Event Status for ${pageId}: ${reason} (name="${eventName}", ${rawDetails})`)
}

interface MappedEventResult {
  event: BaseEventItem
  timeIssues: string[]
}

function logNotionCacheMiss(scope: 'events' | 'data-source') {
  if (!import.meta.dev) {
    return
  }

  console.info(`[events] Notion ${scope} cache miss`)
}

function mapEventStatus(page: any): EventStatus {
  const rawValue = getSelect(page, 'Event Status')
  const { eventStatus, warningReason } = normalizeEventStatus(rawValue)

  if (warningReason) {
    warnFallbackEventStatus(page, warningReason, rawValue)
  }

  return eventStatus
}

function getValidatedPublicSlug(page: any) {
  const slug = getRichText(page, 'Slug')

  if (!slug) {
    warnInvalidPublicEvent(page, 'missing Slug', slug)
    return null
  }

  const result = publicSlugSchema.safeParse(slug)

  if (!result.success) {
    warnInvalidPublicEvent(page, 'invalid Slug format', slug)
    return null
  }

  return result.data
}

async function getPageDescription(client: Client, pageId: string) {
  const results = await collectPaginatedNotionResults(
    async (startCursor): Promise<ListBlockChildrenResponse> => {
      return client.blocks.children.list({
        block_id: pageId,
        start_cursor: startCursor ?? undefined,
        page_size: 100
      })
    },
    {
      scope: `blocks for page ${pageId}`
    }
  )

  return results
    .map((block: any) => {
      const richText = block?.[block.type]?.rich_text
      if (!Array.isArray(richText)) {
        return ''
      }

      return richText.map((item: any) => item?.plain_text || '').join('')
    })
    .filter(Boolean)
    .join('\n')
}

async function getEventsDataSourceId(client: Client, databaseId: string) {
  const database = await client.databases.retrieve({
    database_id: databaseId
  })

  if (!isFullDatabase(database)) {
    throw createError({
      statusCode: 500,
      statusMessage: `Unexpected partial Notion database response for: ${databaseId}`
    })
  }

  const dataSourceId = database.data_sources?.[0]?.id

  if (!dataSourceId) {
    throw createError({
      statusCode: 500,
      statusMessage: `No data source found for Notion database: ${databaseId}`
    })
  }

  return dataSourceId
}

const getCachedEventsDataSourceId = defineCachedFunction(async (config: NotionConnectionConfig) => {
  logNotionCacheMiss('data-source')

  const client = getNotionClient(config)
  return getEventsDataSourceId(client, config.notionEventsDatabaseId)
}, {
  name: 'notion-events-data-source-id',
  group: 'notion',
  maxAge: EVENTS_CACHE_TTL_SECONDS,
  swr: false,
  getKey: (config: NotionConnectionConfig) => config.notionEventsDatabaseId
})

function mapNotionPageToEventResult(page: any, description = ''): MappedEventResult {
  const slug = getValidatedPublicSlug(page)

  if (!slug) {
    throw new Error('Invalid public slug')
  }

  const normalizedStartTime = normalizeNotionDateTime(getDate(page, 'Start Time'), 'start')
  const normalizedEndTime = normalizeNotionDateTime(getDate(page, 'End Time'), 'end')
  const publishStatus = getSelect(page, 'Publish Status') || 'Draft'
  const event = eventSchema.parse({
    id: page?.id || '',
    slug,
    name: getTitle(page, 'Name'),
    status: publishStatus,
    eventStatus: mapEventStatus(page),
    eventType: normalizeEventType(getSelect(page, 'Event Type') || 'other'),
    summary: getRichText(page, 'Summary'),
    description: description || getPlainTextProperty(page, 'Full Description'),
    scheduleType: getSelect(page, 'Schedule Type') || '',
    startTime: normalizedStartTime.value,
    endTime: normalizedEndTime.value,
    startTimeIsDateOnly: normalizedStartTime.isDateOnly,
    endTimeIsDateOnly: normalizedEndTime.isDateOnly,
    specificDates: getPlainTextProperty(page, 'Specific Dates'),
    venueName: getRichText(page, 'Venue Name'),
    venueUrl: getUrl(page, 'Venue URL'),
    address: getRichText(page, 'Address'),
    city: getSelect(page, 'City') || getRichText(page, 'City'),
    country: getSelect(page, 'Country') || getRichText(page, 'Country'),
    organizer: getRichText(page, 'Organizer'),
    weekday: getSelect(page, 'Weekday') || null,
    weekdayOrder: getNumber(page, 'Weekday Order'),
    price: getPlainTextProperty(page, 'Price'),
    level: getSelect(page, 'Level') || getPlainTextProperty(page, 'Level'),
    registrationUrl: getUrl(page, 'Registration URL'),
    coverImageUrl: getUrl(page, 'Cover Image URL'),
    recurring: getCheckbox(page, 'Recurring'),
    recurringText: getPlainTextProperty(page, 'Recurring Text'),
    published: publishStatus.toLowerCase() === 'published'
  })

  return {
    event: {
      ...event
    },
    timeIssues: [normalizedStartTime.reason, normalizedEndTime.reason].filter((reason): reason is string => Boolean(reason))
  }
}

function createEventItemWithTimeStatus(event: BaseEventItem, timeIssues: string[] = []): EventItem {
  if (timeIssues.length > 0) {
    return {
      ...event,
      timeStatus: 'invalid'
    }
  }

  return withEventTimeStatus(event)
}

export function mapNotionPageToEvent(page: any, description = ''): BaseEventItem {
  return mapNotionPageToEventResult(page, description).event
}

const getCachedPublishedEventSource = defineCachedFunction(async (config: NotionConnectionConfig) => {
  logNotionCacheMiss('events')

  const client = getNotionClient(config)
  const dataSourceId = await getCachedEventsDataSourceId(config)

  const results = await collectPaginatedNotionResults(
    async (startCursor): Promise<QueryDataSourceResponse> => {
      return client.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          property: 'Publish Status',
          select: {
            equals: 'Published'
          }
        },
        sorts: [
          {
            property: 'Start Time',
            direction: 'ascending'
          }
        ],
        start_cursor: startCursor ?? undefined,
        page_size: 100
      })
    },
    {
      scope: 'published events'
    }
  )

  return results.flatMap((page: any) => {
    try {
      return [mapNotionPageToEventResult(page)]
    }
    catch {
      return []
    }
  })
}, {
  name: 'notion-published-events-source',
  group: 'notion',
  maxAge: EVENTS_CACHE_TTL_SECONDS,
  swr: false,
  getKey: (config: NotionConnectionConfig) => config.notionEventsDatabaseId
})

export async function getPublishedEvents() {
  const events = await getPublishedEventItems()

  return sortEventsByDisplayPriority(events.flatMap((event) => {
    const { reason } = evaluateEventTime(event)

    if (!shouldDisplayPublicEvent(event)) {
      if (event.timeStatus === 'invalid') {
        warnInvalidPublicEventTime(event, reason || 'invalid event time')
      }

      return []
    }

    return [event]
  }))
}

export async function getPublishedEventItems(overrides?: Partial<NotionConnectionConfig>) {
  const config = resolveNotionConnectionConfig(overrides)

  if (!config.notionEventsDatabaseId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NOTION_EVENTS_DATABASE_ID'
    })
  }

  const publishedSource = await getCachedPublishedEventSource(config)
  return publishedSource.map(({ event, timeIssues }) =>
    createEventItemWithTimeStatus(event, timeIssues)
  )
}

export async function getHomeCalendarEvents() {
  const mappedEvents = await getPublishedEventItems()

  return sortEventsByDisplayPriority(selectDatedHomeCalendarEvents(mappedEvents))
}

export async function getSitemapEvents() {
  const config = resolveNotionConnectionConfig()

  if (!config.notionEventsDatabaseId) {
    return []
  }

  const publishedSource = await getCachedPublishedEventSource(config)

  return publishedSource.flatMap(({ event: mappedEvent, timeIssues }) => {
    const event = createEventItemWithTimeStatus(mappedEvent, timeIssues)
    return event.timeStatus === 'invalid' ? [] : [event]
  })
}

export async function getEventBySlug(slug: string) {
  const config = resolveNotionConnectionConfig()

  if (!config.notionEventsDatabaseId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NOTION_EVENTS_DATABASE_ID'
    })
  }

  const client = getNotionClient(config)
  const dataSourceId = await getCachedEventsDataSourceId(config)
  const response = await client.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: 'Publish Status',
          select: {
            equals: 'Published'
          }
        },
        {
          property: 'Slug',
          rich_text: {
            equals: slug
          }
        }
      ]
    },
    page_size: 1
  })

  const page = response.results?.[0]

  if (!page) {
    return null
  }

  const validatedSlug = getValidatedPublicSlug(page)

  if (!validatedSlug) {
    return null
  }

  const { event: mapped, timeIssues } = mapNotionPageToEventResult(page)
  const description = await getPageDescription(client, mapped.id)

  return createEventItemWithTimeStatus({
    ...mapped,
    description: description || mapped.description
  }, timeIssues)
}
