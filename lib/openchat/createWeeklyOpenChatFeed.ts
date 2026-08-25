import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getWeeklyMessagePresentation } from '~~/lib/events/weeklyPresentation'
import type { NotionConnectionConfig } from '~~/lib/notion-connection'
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
  const events = await getWeeklyEvents(now, options.notionConfig, {
    mode: 'remaining-week'
  })

  return formatWeeklyOpenChatFeed({
    weekStart: presentation.weekStart,
    weekEnd: presentation.weekEnd,
    events,
    siteUrl: options.siteUrl,
    lineAddFriendUrl: options.lineAddFriendUrl,
    periodLabel: presentation.periodLabel
  })
}
