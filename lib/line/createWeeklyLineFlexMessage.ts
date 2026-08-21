import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import type { NotionConnectionConfig } from '~~/lib/notion-connection'
import {
  getNextTaipeiWeekRange,
  getTaipeiWeekRange,
  type WeeklyEventQueryMode
} from '~~/lib/events/weeklyEvents'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { formatWeeklyEventsFlexMessage } from '~~/lib/line/formatWeeklyEventsFlexMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface CreateWeeklyLineFlexMessageOptions {
  mode?: WeeklyEventQueryMode
  notionConfig?: Partial<NotionConnectionConfig>
  siteUrl?: string
}

function getWeeklyMessagePresentation(now: Dayjs, mode: WeeklyEventQueryMode) {
  if (mode === 'next-week') {
    const range = getNextTaipeiWeekRange(now)

    return {
      periodLabel: '下週',
      weekStart: range.start,
      weekEnd: range.end
    }
  }

  if (mode === 'remaining-and-next-week') {
    const current = now.tz(TAIPEI_TIMEZONE)
    const nextWeekRange = getNextTaipeiWeekRange(current)

    return {
      periodLabel: '近期',
      weekStart: current.startOf('day'),
      weekEnd: nextWeekRange.end
    }
  }

  const range = getTaipeiWeekRange(now)

  return {
    periodLabel: '本週',
    weekStart: range.start,
    weekEnd: range.end
  }
}

export async function createWeeklyLineFlexMessage(
  now: Dayjs = dayjs(),
  options: CreateWeeklyLineFlexMessageOptions = {}
) {
  const mode = options.mode ?? 'remaining-week'
  const events = await getWeeklyEvents(now, options.notionConfig, {
    mode
  })
  const presentation = getWeeklyMessagePresentation(now, mode)
  const message = formatWeeklyEventsFlexMessage({
    weekStart: presentation.weekStart,
    weekEnd: presentation.weekEnd,
    events,
    siteUrl: options.siteUrl,
    periodLabel: presentation.periodLabel
  })

  return {
    eventCount: events.length,
    message
  }
}
