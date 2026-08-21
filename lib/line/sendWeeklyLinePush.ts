import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { NotionConnectionConfig } from '~~/lib/notion-connection'
import type { WeeklyEventQueryMode } from '~~/lib/events/weeklyEvents'
import { createWeeklyLineFlexMessage } from '~~/lib/line/createWeeklyLineFlexMessage'
import { pushLineMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface WeeklyLinePushConfig {
  lineChannelAccessToken: string
  lineGroupId: string
  mode?: WeeklyEventQueryMode
  notionConfig?: Partial<NotionConnectionConfig>
  now?: Dayjs
  siteUrl?: string
}

export interface WeeklyLinePushResult {
  eventCount: number
}

export async function sendWeeklyLinePush({
  lineGroupId,
  lineChannelAccessToken,
  mode = 'remaining-week',
  notionConfig,
  now = dayjs(),
  siteUrl
}: WeeklyLinePushConfig): Promise<WeeklyLinePushResult> {
  if (!lineGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const { eventCount, message } = await createWeeklyLineFlexMessage(now, {
    mode,
    notionConfig,
    siteUrl
  })

  await pushLineMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: lineGroupId,
    messages: [message]
  })

  return {
    eventCount
  }
}
