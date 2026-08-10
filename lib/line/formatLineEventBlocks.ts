import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

function getWeekdayLabel(value: Dayjs) {
  return WEEKDAY_LABELS[value.day()] ?? ''
}

export function formatWeekRangeLine(start: Dayjs, end: Dayjs) {
  return `${start.format('M/D')}（${getWeekdayLabel(start)}）－${end.format('M/D')}（${getWeekdayLabel(end)}）`
}

export function formatWeekRangeInline(start: Dayjs, end: Dayjs) {
  return `${start.format('M/D')}(${getWeekdayLabel(start)}) ～ ${end.format('M/D')}(${getWeekdayLabel(end)})`
}

export function formatDailyRangeLine(value: Dayjs) {
  return `${value.format('M/D')}（${getWeekdayLabel(value)}）`
}

export function getEventTypeLabel(eventType: string) {
  const normalized = eventType.toLowerCase()

  if (normalized === 'class') return 'Class'
  if (normalized === 'social' || normalized === 'open-floor') return 'Social'
  if (normalized === 'practice') return 'Practice'
  if (normalized === 'workshop') return 'Workshop'
  if (normalized === 'event' || normalized === 'party' || normalized === 'festival') return 'Event'
  return 'Other'
}

export function getValidHttpUrl(value: string) {
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

export function formatEventHeaderLine(event: Pick<EventItem, 'startTime' | 'startTimeIsDateOnly'>, mode: 'weekly' | 'daily') {
  if (!event.startTime) {
    return ''
  }

  const start = dayjs(event.startTime).tz(TAIPEI_TIMEZONE)

  if (mode === 'daily') {
    return event.startTimeIsDateOnly ? '' : start.format('HH:mm')
  }

  const base = `${start.format('M/D')}（${getWeekdayLabel(start)}）`
  return event.startTimeIsDateOnly ? base : `${base} ${start.format('HH:mm')}`
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

export function formatLineEventBlock(event: EventItem, mode: 'weekly' | 'daily') {
  const lines = [
    formatEventHeaderLine(event, mode),
    `【${getEventTypeLabel(event.eventType)}】${event.name}`,
    ...formatVenueLines(event),
    ...formatRegistrationLines(event)
  ].filter(Boolean)

  return lines.join('\n')
}
