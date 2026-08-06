import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { formatWeeklyEventsMessage } from '~~/lib/line/formatWeeklyEventsMessage'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

export const WEEKLY_LINE_PUSH_CRON = '0 2 * * *'

export interface WeeklyLinePushConfig {
  lineChannelAccessToken: string
  lineGroupId: string
}

export interface WeeklyLinePushResult {
  eventCount: number
}

export async function sendWeeklyLinePush({
  lineGroupId,
  lineChannelAccessToken
}: WeeklyLinePushConfig): Promise<WeeklyLinePushResult> {
  if (!lineGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const weeklyEvents = await getWeeklyEvents()
  const weekRange = getTaipeiWeekRange()
  const message = formatWeeklyEventsMessage({
    weekStart: weekRange.start,
    weekEnd: weekRange.end,
    events: weeklyEvents
  })

  await pushLineTextMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: lineGroupId,
    text: message
  })

  return {
    eventCount: weeklyEvents.length
  }
}
