import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getTaipeiWeekRange, selectWeeklyEvents } from '~~/lib/events/weeklyEvents'
import { getPublishedEventItems, type NotionConnectionConfig } from '~~/lib/notion'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function getWeeklyEvents(
  now: Dayjs = dayjs(),
  notionConfig?: Partial<NotionConnectionConfig>
) {
  const publishedEvents = await getPublishedEventItems(notionConfig)
  return selectWeeklyEvents(publishedEvents, now)
}
