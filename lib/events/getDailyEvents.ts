import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { selectDailyEvents } from '~~/lib/events/weeklyEvents'
import { getPublishedEventItems } from '~~/lib/notion'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function getDailyEvents(now: Dayjs = dayjs()) {
  const publishedEvents = await getPublishedEventItems()
  return selectDailyEvents(publishedEvents, now)
}
