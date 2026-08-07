import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { formatDailyRangeLine, formatLineEventBlock } from '~~/lib/line/formatLineEventBlocks'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const MAX_LINE_TEXT_LENGTH = 5000

export interface FormatDailyEventsMessageParams {
  date: Dayjs
  events: readonly EventItem[]
}

export function formatDailyEventsMessage({
  date,
  events
}: FormatDailyEventsMessageParams) {
  const header = `💙 今天的 Blues 活動｜${formatDailyRangeLine(date.tz(TAIPEI_TIMEZONE))}`

  if (!events.length) {
    return header
  }

  const blocks = events.map(event => formatLineEventBlock(event, 'daily')).filter(Boolean)
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
