import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { formatWeeklyEventsFlexMessage } from '~~/lib/line/formatWeeklyEventsFlexMessage'
import { pushLineMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface WeeklyLinePushConfig {
  lineChannelAccessToken: string
  lineGroupId: string
  now?: Dayjs
}

export interface WeeklyLinePushResult {
  eventCount: number
}

export async function sendWeeklyLinePush({
  lineGroupId,
  lineChannelAccessToken,
  now = dayjs()
}: WeeklyLinePushConfig): Promise<WeeklyLinePushResult> {
  if (!lineGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const weeklyEvents = await getWeeklyEvents(now)
  const weekRange = getTaipeiWeekRange(now)
  const message = formatWeeklyEventsFlexMessage({
    weekStart: weekRange.start,
    weekEnd: weekRange.end,
    events: weeklyEvents
  })

  await pushLineMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: lineGroupId,
    messages: [message]
  })

  return {
    eventCount: weeklyEvents.length
  }
}
