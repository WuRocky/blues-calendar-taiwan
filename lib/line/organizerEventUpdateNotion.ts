import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { Client } from '@notionhq/client'
import type { QueryDataSourceResponse } from '@notionhq/client/build/src/api-endpoints/data-sources'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { createNotionClient, getEventsDataSourceId, resolveNotionConnectionConfig, type NotionConnectionConfig, type NotionRuntimeConfig } from '~~/lib/notion-connection'
import { collectPaginatedNotionResults } from '~~/lib/notion-pagination'
import type { OrganizerEventUpdateFields } from '~~/lib/line/organizerEventUpdateParser'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface OrganizerEditableEvent {
  endTime: string | null
  eventStatus: string
  name: string
  pageId: string
  price: string
  publishStatus: string
  startTime: string | null
  venueName: string
}

export interface OrganizerEventUpdatePatch {
  endTime?: string
  price?: string
  startTime?: string
  venueName?: string
}

interface EventPageSummary extends OrganizerEditableEvent {}

function getProperty(page: { properties?: Record<string, unknown> }, name: string) {
  return page.properties?.[name]
}

function getTitle(page: { properties?: Record<string, unknown> }, name: string) {
  const property = getProperty(page, name)

  if (!property || typeof property !== 'object' || property === null || !('title' in property)) {
    return ''
  }

  const title = Reflect.get(property, 'title')

  if (!Array.isArray(title)) {
    return ''
  }

  return title.map((item) => {
    if (!item || typeof item !== 'object') {
      return ''
    }

    const plainText = Reflect.get(item, 'plain_text')
    return typeof plainText === 'string' ? plainText : ''
  }).join('')
}

function getRichText(page: { properties?: Record<string, unknown> }, name: string) {
  const property = getProperty(page, name)

  if (!property || typeof property !== 'object' || property === null || !('rich_text' in property)) {
    return ''
  }

  const richText = Reflect.get(property, 'rich_text')

  if (!Array.isArray(richText)) {
    return ''
  }

  return richText.map((item) => {
    if (!item || typeof item !== 'object') {
      return ''
    }

    const plainText = Reflect.get(item, 'plain_text')
    return typeof plainText === 'string' ? plainText : ''
  }).join('')
}

function getSelect(page: { properties?: Record<string, unknown> }, name: string) {
  const property = getProperty(page, name)

  if (!property || typeof property !== 'object' || property === null || !('select' in property)) {
    return ''
  }

  const select = Reflect.get(property, 'select')

  if (!select || typeof select !== 'object') {
    return ''
  }

  const nameValue = Reflect.get(select, 'name')
  return typeof nameValue === 'string' ? nameValue : ''
}

function getDate(page: { properties?: Record<string, unknown> }, name: string) {
  const property = getProperty(page, name)

  if (!property || typeof property !== 'object' || property === null || !('date' in property)) {
    return null
  }

  const dateValue = Reflect.get(property, 'date')

  if (!dateValue || typeof dateValue !== 'object') {
    return null
  }

  const start = Reflect.get(dateValue, 'start')
  return typeof start === 'string' ? start : null
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function parseStoredEventDate(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.tz(TAIPEI_TIMEZONE) : null
}

function formatTimeValue(baseDate: Dayjs, timeValue: string) {
  const [rawHours, rawMinutes] = timeValue.split(':')
  const hours = Number(rawHours)
  const minutes = Number(rawMinutes)
  return baseDate.hour(hours).minute(minutes).second(0).millisecond(0)
}

function buildRichTextProperty(value: string) {
  return {
    rich_text: [
      {
        type: 'text' as const,
        text: {
          content: value
        }
      }
    ]
  }
}

async function listEditableEventPages(client: Client, dataSourceId: string) {
  const pages = await collectPaginatedNotionResults(
    async (startCursor): Promise<QueryDataSourceResponse> => {
      return client.dataSources.query({
        data_source_id: dataSourceId,
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
      scope: 'organizer event search'
    }
  )

  return pages.flatMap((page) => {
    if (!page || typeof page !== 'object' || !('id' in page) || !('properties' in page)) {
      return []
    }

    const pageId = Reflect.get(page, 'id')

    if (typeof pageId !== 'string') {
      return []
    }

    const eventPage = page as { id: string, properties?: Record<string, unknown> }
    const publishStatus = getSelect(eventPage, 'Publish Status')

    if (!['Pending', 'Published'].includes(publishStatus)) {
      return []
    }

    return [{
      endTime: getDate(eventPage, 'End Time'),
      eventStatus: getSelect(eventPage, 'Event Status') || 'Scheduled',
      name: getTitle(eventPage, 'Name') || 'Untitled Event',
      pageId,
      price: getRichText(eventPage, 'Price'),
      publishStatus,
      startTime: getDate(eventPage, 'Start Time'),
      venueName: getRichText(eventPage, 'Venue Name')
    } satisfies EventPageSummary]
  })
}

export async function findOrganizerEventsByNameAndDate(
  eventName: string,
  eventDate: Dayjs,
  runtimeConfig?: NotionRuntimeConfig,
  overrides?: Partial<NotionConnectionConfig>
) {
  const config = resolveNotionConnectionConfig(runtimeConfig, overrides)

  if (!config.notionToken) {
    throw new Error('Missing NOTION_TOKEN')
  }

  if (!config.notionEventsDatabaseId) {
    throw new Error('Missing NOTION_EVENTS_DATABASE_ID')
  }

  const client = createNotionClient(config.notionToken)
  const dataSourceId = await getEventsDataSourceId(client, config.notionEventsDatabaseId)
  const pages = await listEditableEventPages(client, dataSourceId)
  const normalizedTargetName = normalizeName(eventName)

  return pages.filter((page) => {
    const eventStart = parseStoredEventDate(page.startTime)

    if (!eventStart) {
      return false
    }

    return normalizeName(page.name) === normalizedTargetName
      && eventStart.isSame(eventDate, 'day')
  })
}

export function buildOrganizerEventUpdatePatch(
  event: OrganizerEditableEvent,
  eventDate: Dayjs,
  fields: OrganizerEventUpdateFields
): OrganizerEventUpdatePatch {
  const patch: OrganizerEventUpdatePatch = {}
  const baseEventDate = eventDate.tz(TAIPEI_TIMEZONE)
  const existingStart = parseStoredEventDate(event.startTime) ?? baseEventDate
  const currentStart = fields.startTime ? formatTimeValue(baseEventDate, fields.startTime) : existingStart

  if (fields.startTime) {
    patch.startTime = currentStart.toISOString()
  }

  if (fields.endTime) {
    let nextEndTime = formatTimeValue(baseEventDate, fields.endTime)

    if (!nextEndTime.isAfter(currentStart)) {
      nextEndTime = nextEndTime.add(1, 'day')
    }

    patch.endTime = nextEndTime.toISOString()
  }

  if (fields.venueName) {
    patch.venueName = fields.venueName
  }

  if (fields.price) {
    patch.price = fields.price
  }

  return patch
}

export async function applyOrganizerEventUpdate(
  pageId: string,
  patch: OrganizerEventUpdatePatch,
  runtimeConfig?: NotionRuntimeConfig,
  overrides?: Partial<NotionConnectionConfig>
) {
  const config = resolveNotionConnectionConfig(runtimeConfig, overrides)

  if (!config.notionToken) {
    throw new Error('Missing NOTION_TOKEN')
  }

  const client = createNotionClient(config.notionToken)
  type UpdatePageParameters = Parameters<Client['pages']['update']>[0]
  type UpdatePageProperties = NonNullable<UpdatePageParameters['properties']>
  const properties: UpdatePageProperties = {}

  if (patch.startTime) {
    properties['Start Time'] = {
      date: {
        start: patch.startTime
      }
    }
  }

  if (patch.endTime) {
    properties['End Time'] = {
      date: {
        start: patch.endTime
      }
    }
  }

  if (patch.venueName !== undefined) {
    properties['Venue Name'] = buildRichTextProperty(patch.venueName)
  }

  if (patch.price !== undefined) {
    properties['Price'] = buildRichTextProperty(patch.price)
  }

  await client.pages.update({
    page_id: pageId,
    properties
  })
}
