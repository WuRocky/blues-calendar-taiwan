import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
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

function getValidHttpUrl(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function formatEventStartLine(event: Pick<EventItem, 'startTime'>) {
  if (!event.startTime) {
    return ''
  }

  const start = dayjs(event.startTime).tz(TAIPEI_TIMEZONE)
  const base = `${start.format('M/D')}（${getWeekdayLabel(start)}）`
  return event.startTime ? `${base}${event.startTime ? ` ${start.format('HH:mm')}` : ''}` : base
}

function formatVenueLines(event: Pick<EventItem, 'venueName' | 'venueUrl'>) {
  const venueName = event.venueName.trim()
  const venueUrl = getValidHttpUrl(event.venueUrl)

  if (venueName && venueUrl) {
    return [`📍 ${venueName}`, `地點：${venueUrl}`]
  }

  if (venueName) {
    return [`📍 ${venueName}`]
  }

  if (venueUrl) {
    return ['📍 地點', venueUrl]
  }

  return []
}

function formatRegistrationLines(event: Pick<EventItem, 'registrationUrl'>) {
  const registrationUrl = getValidHttpUrl(event.registrationUrl)

  return registrationUrl ? ['🔗 活動連結', registrationUrl] : []
}

function formatEventBlock(event: EventItem) {
  const lines = [
    formatEventStartLine(event),
    `【${getEventTypeLabel(event.eventType)}】${event.name}`,
    ...formatVenueLines(event),
    ...formatRegistrationLines(event)
  ].filter(Boolean)

  return lines.join('\n')
}

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
  if (!events.length) {
    return '本週暫無 Blues 活動 💙'
  }

  const header = [
    '💙 本週 Blues 活動',
    formatWeekRangeLine(weekStart.tz(TAIPEI_TIMEZONE), weekEnd.tz(TAIPEI_TIMEZONE))
  ].join('\n')

  const blocks = events.map(event => formatEventBlock(event)).filter(Boolean)
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
