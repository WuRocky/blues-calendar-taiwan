import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { buildEventDetailUrl, resolveSiteUrl } from '~~/lib/event-calendar'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const MAX_LINE_TEXT_LENGTH = 5000
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

function getWeekdayLabel(value: Dayjs) {
  return WEEKDAY_LABELS[value.day()] ?? ''
}

function getEventTypeLabel(eventType: string) {
  const normalized = eventType.toLowerCase()

  if (normalized === 'class') return 'Class'
  if (normalized === 'social' || normalized === 'open-floor') return 'Social'
  if (normalized === 'workshop') return 'Workshop'
  if (normalized === 'event' || normalized === 'party' || normalized === 'festival') return 'Event'
  return 'Other'
}

function formatWeekRangeLine(start: Dayjs, end: Dayjs) {
  return `${start.format('M/D')}（${getWeekdayLabel(start)}）－${end.format('M/D')}（${getWeekdayLabel(end)}）`
}

function formatEventStartLine(event: Pick<EventItem, 'startTime'>) {
  if (!event.startTime) {
    return ''
  }

  const start = dayjs(event.startTime).tz(TAIPEI_TIMEZONE)
  const base = `${start.format('M/D')}（${getWeekdayLabel(start)}）`
  return event.startTime ? `${base}${event.startTime ? ` ${start.format('HH:mm')}` : ''}` : base
}

function formatEventBlock(event: EventItem, siteUrl: string) {
  const lines = [
    formatEventStartLine(event),
    `【${getEventTypeLabel(event.eventType)}】${event.name}`,
    event.venueName ? `📍 ${event.venueName}` : '',
    event.slug ? `🔗 ${buildEventDetailUrl(siteUrl, event.slug)}` : ''
  ].filter(Boolean)

  return lines.join('\n')
}

export interface FormatWeeklyEventsMessageParams {
  events: readonly EventItem[]
  siteUrl: string
  weekEnd: Dayjs
  weekStart: Dayjs
}

export function formatWeeklyEventsMessage({
  weekStart,
  weekEnd,
  events,
  siteUrl
}: FormatWeeklyEventsMessageParams) {
  const resolvedSiteUrl = resolveSiteUrl(siteUrl)

  if (!events.length) {
    return '本週暫無 Blues 活動 💙'
  }

  const header = [
    '💙 本週 Blues 活動',
    formatWeekRangeLine(weekStart.tz(TAIPEI_TIMEZONE), weekEnd.tz(TAIPEI_TIMEZONE))
  ].join('\n')

  const footer = resolvedSiteUrl ? `完整活動：\n${resolvedSiteUrl}/events` : ''
  const blocks = events.map(event => formatEventBlock(event, siteUrl)).filter(Boolean)
  const messageParts = [header]
  const reservedFooterLength = footer ? footer.length + 2 : 0

  for (const block of blocks) {
    const candidate = [...messageParts, block].join('\n\n')

    if (candidate.length + reservedFooterLength > MAX_LINE_TEXT_LENGTH) {
      break
    }

    messageParts.push(block)
  }

  if (footer) {
    messageParts.push(footer)
  }

  return messageParts.join('\n\n')
}
