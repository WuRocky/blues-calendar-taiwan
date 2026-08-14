import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { selectWeeklyEvents, type WeeklyEventQueryMode } from '~~/lib/events/weeklyEvents'
import type { NotionConnectionConfig } from '~~/lib/notion-connection'
import { getPublishedEventItems } from '~~/lib/notion'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface GetWeeklyEventsOptions {
  mode?: WeeklyEventQueryMode
}

export async function getWeeklyEvents(
  now: Dayjs = dayjs(),
  notionConfig?: Partial<NotionConnectionConfig>,
  options: GetWeeklyEventsOptions = {}
) {
  const publishedEvents = await getPublishedEventItems(notionConfig)
  return selectWeeklyEvents(publishedEvents, now, options.mode)
}
