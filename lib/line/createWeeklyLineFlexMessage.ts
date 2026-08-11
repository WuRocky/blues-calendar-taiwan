import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { formatWeeklyEventsFlexMessage } from '~~/lib/line/formatWeeklyEventsFlexMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function createWeeklyLineFlexMessage(now: Dayjs = dayjs()) {
  const events = await getWeeklyEvents(now)
  const weekRange = getTaipeiWeekRange(now)
  const message = formatWeeklyEventsFlexMessage({
    weekStart: weekRange.start,
    weekEnd: weekRange.end,
    events
  })

  return {
    eventCount: events.length,
    message
  }
}
