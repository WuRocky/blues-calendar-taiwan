import type { Client } from '@notionhq/client'
import type { QueryDataSourceResponse } from '@notionhq/client/build/src/api-endpoints/data-sources'
import { generateUniqueEventSlug } from '~~/lib/events/eventSlug'
import { createNotionClient, getEventsDataSourceId, resolveNotionConnectionConfig, type NotionConnectionConfig, type NotionRuntimeConfig } from '~~/lib/notion-connection'
import { collectPaginatedNotionResults } from '~~/lib/notion-pagination'

interface EventSlugBackfillPage {
  currentSlug: string
  name: string
  pageId: string
  startTime: string | null
}

export interface EventSlugBackfillChange {
  name: string
  pageId: string
  slug: string
}

export interface EnsureMissingEventSlugsOptions {
  dryRun?: boolean
  notionConfig?: Partial<NotionConnectionConfig>
  runtimeConfig?: NotionRuntimeConfig
}

export interface EnsureMissingEventSlugsResult {
  dryRun: boolean
  existingSlugCount: number
  foundMissingSlugCount: number
  skippedExistingCount: number
  updated: EventSlugBackfillChange[]
}

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

function normalizeStoredSlug(value: string) {
  return value.trim().toLowerCase()
}

function isRateLimitedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code = Reflect.get(error, 'code')

  if (code === 'rate_limited') {
    return true
  }

  const message = Reflect.get(error, 'message')
  return typeof message === 'string' && message.toLowerCase().includes('rate limit')
}

function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function updateEventSlug(client: Client, pageId: string, slug: string, attempt = 1): Promise<void> {
  try {
    await client.pages.update({
      page_id: pageId,
      properties: {
        Slug: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: slug
              }
            }
          ]
        }
      }
    })
  } catch (error) {
    if (attempt < 4 && isRateLimitedError(error)) {
      await sleep(attempt * 1000)
      return updateEventSlug(client, pageId, slug, attempt + 1)
    }

    throw error
  }
}

async function listEventPagesForSlugMaintenance(client: Client, dataSourceId: string) {
  const results = await collectPaginatedNotionResults(
    async (startCursor): Promise<QueryDataSourceResponse> => {
      return client.dataSources.query({
        data_source_id: dataSourceId,
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'ascending'
          }
        ],
        start_cursor: startCursor ?? undefined,
        page_size: 100
      })
    },
    {
      scope: 'event slug maintenance'
    }
  )

  return results.flatMap((page) => {
    if (!page || typeof page !== 'object' || !('id' in page) || !('properties' in page)) {
      return []
    }

    const pageId = Reflect.get(page, 'id')

    if (typeof pageId !== 'string') {
      return []
    }

    const eventPage = page as { id: string, properties?: Record<string, unknown> }

    return [{
      currentSlug: getRichText(eventPage, 'Slug'),
      name: getTitle(eventPage, 'Name') || 'Untitled Event',
      pageId,
      startTime: getDate(eventPage, 'Start Time')
    }]
  })
}

export async function ensureMissingEventSlugs(options: EnsureMissingEventSlugsOptions = {}): Promise<EnsureMissingEventSlugsResult> {
  const config = resolveNotionConnectionConfig(options.runtimeConfig, options.notionConfig)

  if (!config.notionToken) {
    throw new Error('Missing NOTION_TOKEN')
  }

  if (!config.notionEventsDatabaseId) {
    throw new Error('Missing NOTION_EVENTS_DATABASE_ID')
  }

  const client = createNotionClient(config.notionToken)
  const dataSourceId = await getEventsDataSourceId(client, config.notionEventsDatabaseId)
  const pages = await listEventPagesForSlugMaintenance(client, dataSourceId)
  const existingSlugs = new Set(
    pages
      .map(page => normalizeStoredSlug(page.currentSlug))
      .filter(Boolean)
  )

  const updated: EventSlugBackfillChange[] = []

  for (const page of pages) {
    if (page.currentSlug.trim()) {
      continue
    }

    const generatedSlug = generateUniqueEventSlug({
      fallbackId: page.pageId,
      name: page.name,
      startTime: page.startTime
    }, existingSlugs)

    existingSlugs.add(generatedSlug)
    updated.push({
      name: page.name,
      pageId: page.pageId,
      slug: generatedSlug
    })
  }

  if (!options.dryRun) {
    for (const change of updated) {
      await updateEventSlug(client, change.pageId, change.slug)
    }
  }

  return {
    dryRun: Boolean(options.dryRun),
    existingSlugCount: pages.length - updated.length,
    foundMissingSlugCount: updated.length,
    skippedExistingCount: pages.length - updated.length,
    updated
  }
}
