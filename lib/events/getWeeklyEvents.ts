import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getTaipeiWeekRange, selectWeeklyEvents } from '~~/lib/events/weeklyEvents'
import { getPublishedEventItems } from '~~/lib/notion'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function getWeeklyEvents(now: Dayjs = dayjs()) {
  const publishedEvents = await getPublishedEventItems()
  return selectWeeklyEvents(publishedEvents, now)
}
