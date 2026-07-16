import { createError, useRuntimeConfig } from '#imports'
import dayjs from 'dayjs'
import { Client } from '@notionhq/client'
import { z } from 'zod'
import type { EventItem, EventType } from '~~/types/event'

const eventSchema = z.object({
  id: z.string().default(''),
  slug: z.string().default(''),
  name: z.string().default('Untitled Event'),
  status: z.string().default('Draft'),
  eventType: z.enum(['class', 'social', 'event', 'open-floor', 'party', 'workshop', 'festival', 'other']).default('other'),
  summary: z.string().default(''),
  description: z.string().default(''),
  startTime: z.string().nullable().default(null),
  endTime: z.string().nullable().default(null),
  venueName: z.string().default(''),
  venueUrl: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  organizer: z.string().default(''),
  price: z.string().default(''),
  level: z.string().default(''),
  registrationUrl: z.string().default(''),
  coverImageUrl: z.string().default(''),
  recurring: z.boolean().default(false),
  recurringText: z.string().default(''),
  published: z.boolean().default(false)
})

function getNotionClient() {
  const config = useRuntimeConfig()

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

  return property.plain_text || ''
}

async function getPageDescription(client: Client, pageId: string) {
  try {
    const response = await client.blocks.children.list({
      block_id: pageId,
      page_size: 100
    })

    return response.results
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
  catch {
    return ''
  }
}

async function getEventsDataSourceId(client: Client, databaseId: string) {
  const database = await client.databases.retrieve({
    database_id: databaseId
  })

  const dataSourceId = database.data_sources?.[0]?.id

  if (!dataSourceId) {
    throw createError({
      statusCode: 500,
      statusMessage: `No data source found for Notion database: ${databaseId}`
    })
  }

  return dataSourceId
}

export function mapNotionPageToEvent(page: any, description = ''): EventItem {
  const startTime = getDate(page, 'Start Time')
  const endTime = getDate(page, 'End Time')
  const event = eventSchema.parse({
    id: page?.id || '',
    slug: getRichText(page, 'Slug'),
    name: getTitle(page, 'Name'),
    status: getSelect(page, 'Status') || 'Draft',
    eventType: normalizeEventType(getSelect(page, 'Event Type') || 'other'),
    summary: getRichText(page, 'Summary'),
    description: description || '',
    startTime,
    endTime,
    venueName: getRichText(page, 'Venue Name'),
    venueUrl: getUrl(page, 'Venue URL'),
    address: getRichText(page, 'Address'),
    city: getSelect(page, 'City') || getRichText(page, 'City'),
    organizer: getRichText(page, 'Organizer'),
    price: getPlainTextProperty(page, 'Price'),
    level: getSelect(page, 'Level') || getPlainTextProperty(page, 'Level'),
    registrationUrl: getUrl(page, 'Registration URL'),
    coverImageUrl: getUrl(page, 'Cover Image URL'),
    recurring: getCheckbox(page, 'Recurring'),
    recurringText: getPlainTextProperty(page, 'Recurring Text'),
    published: getSelect(page, 'Status').toLowerCase() === 'published'
  })

  return {
    ...event,
    slug: event.slug || page?.id || '',
    startTime: event.startTime ? dayjs(event.startTime).toISOString() : null,
    endTime: event.endTime ? dayjs(event.endTime).toISOString() : null
  }
}

export async function getPublishedEvents() {
  const config = useRuntimeConfig()

  if (!config.notionEventsDatabaseId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NOTION_EVENTS_DATABASE_ID'
    })
  }

  const client = getNotionClient()
  const dataSourceId = await getEventsDataSourceId(client, config.notionEventsDatabaseId)
  const response = await client.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: 'Status',
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
    page_size: 100
  })

  return response.results.map((page: any) => mapNotionPageToEvent(page))
}

export async function getEventBySlug(slug: string) {
  const config = useRuntimeConfig()

  if (!config.notionEventsDatabaseId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NOTION_EVENTS_DATABASE_ID'
    })
  }

  const client = getNotionClient()
  const dataSourceId = await getEventsDataSourceId(client, config.notionEventsDatabaseId)
  const response = await client.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: 'Status',
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

  const mapped = mapNotionPageToEvent(page)
  const description = await getPageDescription(client, mapped.id)

  return {
    ...mapped,
    description: description || mapped.description
  }
}
