import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange, type WeeklyEventQueryMode } from '~~/lib/events/weeklyEvents'
import { formatWeeklyEventsFlexMessage } from '~~/lib/line/formatWeeklyEventsFlexMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface CreateWeeklyLineFlexMessageOptions {
  mode?: WeeklyEventQueryMode
  siteUrl?: string
}

export async function createWeeklyLineFlexMessage(
  now: Dayjs = dayjs(),
  options: CreateWeeklyLineFlexMessageOptions = {}
) {
  const events = await getWeeklyEvents(now, undefined, {
    mode: options.mode
  })
  const weekRange = getTaipeiWeekRange(now)
  const message = formatWeeklyEventsFlexMessage({
    weekStart: weekRange.start,
    weekEnd: weekRange.end,
    events,
    siteUrl: options.siteUrl
  })

  return {
    eventCount: events.length,
    message
  }
}
