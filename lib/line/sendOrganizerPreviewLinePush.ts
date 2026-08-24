import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { NotionConnectionConfig } from '~~/lib/notion-connection'
import { sendWeeklyLinePush } from '~~/lib/line/sendWeeklyLinePush'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface OrganizerPreviewLinePushConfig {
  lineChannelAccessToken: string
  lineOrganizerGroupId: string
  notionConfig?: Partial<NotionConnectionConfig>
  now?: Dayjs
  siteUrl?: string
}

export interface OrganizerPreviewLinePushResult {
  eventCount: number
}

export async function sendOrganizerPreviewLinePush({
  lineOrganizerGroupId,
  lineChannelAccessToken,
  notionConfig,
  now = dayjs(),
  siteUrl
}: OrganizerPreviewLinePushConfig): Promise<OrganizerPreviewLinePushResult> {
  if (!lineOrganizerGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const result = await sendWeeklyLinePush({
    lineChannelAccessToken,
    lineGroupId: lineOrganizerGroupId,
    mode: 'next-week',
    notionConfig,
    now,
    siteUrl
  })

  return {
    eventCount: result.eventCount
  }
}
