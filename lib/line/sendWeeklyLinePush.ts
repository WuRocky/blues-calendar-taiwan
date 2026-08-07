import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { formatWeeklyEventsMessage } from '~~/lib/line/formatWeeklyEventsMessage'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface WeeklyLinePushConfig {
  lineChannelAccessToken: string
  linePublicGroupId: string
  now?: Dayjs
}

export interface WeeklyLinePushResult {
  eventCount: number
}

export async function sendWeeklyLinePush({
  linePublicGroupId,
  lineChannelAccessToken,
  now = dayjs()
}: WeeklyLinePushConfig): Promise<WeeklyLinePushResult> {
  if (!linePublicGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const weeklyEvents = await getWeeklyEvents(now)
  const weekRange = getTaipeiWeekRange(now)
  const message = formatWeeklyEventsMessage({
    weekStart: weekRange.start,
    weekEnd: weekRange.end,
    events: weeklyEvents
  })

  await pushLineTextMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: linePublicGroupId,
    text: message
  })

  return {
    eventCount: weeklyEvents.length
  }
}
