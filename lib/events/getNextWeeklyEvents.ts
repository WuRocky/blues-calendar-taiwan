import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { selectNextWeeklyEvents } from '~~/lib/events/weeklyEvents'
import { getPublishedEventItems } from '~~/lib/notion'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function getNextWeeklyEvents(now: Dayjs = dayjs()) {
  const publishedEvents = await getPublishedEventItems()
  return selectNextWeeklyEvents(publishedEvents, now)
}
