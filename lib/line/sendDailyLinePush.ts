import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getDailyEvents } from '~~/lib/events/getDailyEvents'
import { getTaipeiDayRange } from '~~/lib/events/weeklyEvents'
import { formatDailyEventsMessage } from '~~/lib/line/formatDailyEventsMessage'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface DailyLinePushConfig {
  lineChannelAccessToken: string
  linePublicGroupId: string
  now?: Dayjs
}

export interface DailyLinePushResult {
  eventCount: number
  skipped: boolean
}

export async function sendDailyLinePush({
  linePublicGroupId,
  lineChannelAccessToken,
  now = dayjs()
}: DailyLinePushConfig): Promise<DailyLinePushResult> {
  if (!linePublicGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const dailyEvents = await getDailyEvents(now)

  if (dailyEvents.length === 0) {
    return {
      eventCount: 0,
      skipped: true
    }
  }

  const dayRange = getTaipeiDayRange(now)
  const message = formatDailyEventsMessage({
    date: dayRange.start,
    events: dailyEvents
  })

  await pushLineTextMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: linePublicGroupId,
    text: message
  })

  return {
    eventCount: dailyEvents.length,
    skipped: false
  }
}
