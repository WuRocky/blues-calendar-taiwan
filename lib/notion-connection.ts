import { Client, isFullDatabase } from '@notionhq/client'

export interface NotionConnectionConfig {
  token?: string
  databaseId?: string
  notionEventsDatabaseId: string
  notionToken: string
}

export interface NotionRuntimeConfig {
  notionEventsDatabaseId?: string
  notionToken?: string
}

export function resolveNotionConnectionConfig(
  runtimeConfig?: NotionRuntimeConfig,
  overrides?: Partial<NotionConnectionConfig>
): NotionConnectionConfig {
  const notionToken = overrides?.notionToken || overrides?.token || runtimeConfig?.notionToken || ''
  const notionEventsDatabaseId = overrides?.notionEventsDatabaseId || overrides?.databaseId || runtimeConfig?.notionEventsDatabaseId || ''

  return {
    notionToken,
    notionEventsDatabaseId
  }
}

export function createNotionClient(notionToken: string) {
  return new Client({
    auth: notionToken
  })
}

export async function getEventsDataSourceId(client: Client, databaseId: string) {
  const database = await client.databases.retrieve({
    database_id: databaseId
  })

  if (!isFullDatabase(database)) {
    throw new Error(`Unexpected partial Notion database response for: ${databaseId}`)
  }

  const dataSourceId = database.data_sources?.[0]?.id

  if (!dataSourceId) {
    throw new Error(`No data source found for Notion database: ${databaseId}`)
  }

  return dataSourceId
}
