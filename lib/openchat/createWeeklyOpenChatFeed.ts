import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {
  selectPublishedWorkshopEvents,
  selectWeeklyEvents
} from '~~/lib/events/weeklyEvents'
import { getWeeklyMessagePresentation } from '~~/lib/events/weeklyPresentation'
import type { NotionConnectionConfig } from '~~/lib/notion-connection'
import { getPublishedEventItems } from '~~/lib/notion'
import {
  formatWeeklyOpenChatFeed,
  type OpenChatWeeklyFeed
} from '~~/lib/openchat/formatWeeklyOpenChatFeed'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface CreateWeeklyOpenChatFeedOptions {
  lineAddFriendUrl?: string
  notionConfig?: Partial<NotionConnectionConfig>
  now?: Dayjs
  siteUrl?: string
}

export async function createWeeklyOpenChatFeed(
  options: CreateWeeklyOpenChatFeedOptions = {}
): Promise<OpenChatWeeklyFeed> {
  const now = options.now ?? dayjs()
  const presentation = getWeeklyMessagePresentation(now, 'remaining-week')
  const publishedEvents = await getPublishedEventItems(options.notionConfig)
  const weeklyEvents = selectWeeklyEvents(publishedEvents, now, 'remaining-week')
  const weeklyEventIds = new Set(weeklyEvents.map(event => event.id))
  const upcomingWorkshops = selectPublishedWorkshopEvents(publishedEvents)
    .filter(event => !weeklyEventIds.has(event.id))

  return formatWeeklyOpenChatFeed({
    weekStart: presentation.weekStart,
    weekEnd: presentation.weekEnd,
    events: weeklyEvents,
    upcomingWorkshops,
    siteUrl: options.siteUrl,
    lineAddFriendUrl: options.lineAddFriendUrl,
    periodLabel: presentation.periodLabel
  })
}
