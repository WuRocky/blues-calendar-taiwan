import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { formatLineEventBlock, formatWeekRangeLine } from '~~/lib/line/formatLineEventBlocks'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const MAX_LINE_TEXT_LENGTH = 5000

export interface FormatWeeklyEventsMessageParams {
  events: readonly EventItem[]
  weekEnd: Dayjs
  weekStart: Dayjs
}

export function formatWeeklyEventsMessage({
  weekStart,
  weekEnd,
  events
}: FormatWeeklyEventsMessageParams) {
  const header = [
    '💙 本週 Blues 活動',
    formatWeekRangeLine(weekStart.tz(TAIPEI_TIMEZONE), weekEnd.tz(TAIPEI_TIMEZONE))
  ].join('\n')

  if (!events.length) {
    return [header, '本週暫無 Blues 活動 💙'].join('\n\n')
  }

  const blocks = events.map(event => formatLineEventBlock(event, 'weekly')).filter(Boolean)
  const messageParts = [header]

  for (const block of blocks) {
    const candidate = [...messageParts, block].join('\n\n')

    if (candidate.length > MAX_LINE_TEXT_LENGTH) {
      break
    }

    messageParts.push(block)
  }

  return messageParts.join('\n\n')
}
