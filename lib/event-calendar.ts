import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/render'
const ICS_PROD_ID = '-//Blues Calendar Taiwan//Events//EN'
const FALLBACK_SITE_URL = 'http://localhost:3000'

interface CalendarTimingTimed {
  kind: 'timed'
  end: Dayjs
  start: Dayjs
}

interface CalendarTimingAllDay {
  exclusiveEndDate: string
  kind: 'all-day'
  startDate: string
}

type CalendarTiming = CalendarTimingTimed | CalendarTimingAllDay

export function canAddEventToCalendar(event: Pick<EventItem, 'eventStatus' | 'timeStatus' | 'startTime'>) {
  if (event.eventStatus !== 'scheduled') {
    return false
  }

  if (event.timeStatus !== 'upcoming' && event.timeStatus !== 'ongoing') {
    return false
  }

  if (!event.startTime) {
    return false
  }

  return dayjs(event.startTime).isValid()
}

function getTaipeiDateString(value: string) {
  return dayjs(value).tz(TAIPEI_TIMEZONE).format('YYYYMMDD')
}

function getTaipeiExclusiveEndDate(value: string) {
  return dayjs(value).tz(TAIPEI_TIMEZONE).add(1, 'day').format('YYYYMMDD')
}

function getTimedDayEnd(value: string) {
  return dayjs(value)
    .tz(TAIPEI_TIMEZONE)
    .hour(23)
    .minute(59)
    .second(59)
    .millisecond(0)
}

function getCalendarTiming(event: Pick<EventItem, 'startTime' | 'endTime' | 'startTimeIsDateOnly' | 'endTimeIsDateOnly'>): CalendarTiming | null {
  if (!event.startTime) {
    return null
  }

  const start = dayjs(event.startTime)

  if (!start.isValid()) {
    return null
  }

  const shouldUseAllDay = event.startTimeIsDateOnly || event.endTimeIsDateOnly

  if (shouldUseAllDay) {
    return {
      kind: 'all-day',
      startDate: getTaipeiDateString(event.startTime),
      exclusiveEndDate: event.endTime ? getTaipeiExclusiveEndDate(event.endTime) : dayjs(event.startTime).tz(TAIPEI_TIMEZONE).add(1, 'day').format('YYYYMMDD')
    }
  }

  const end = event.endTime ? dayjs(event.endTime) : getTimedDayEnd(event.startTime)

  if (!end.isValid()) {
    return null
  }

  return {
    kind: 'timed',
    start,
    end
  }
}

function buildCalendarDescription(event: Pick<EventItem, 'summary' | 'organizer' | 'price' | 'registrationUrl'>, detailUrl: string) {
  const lines = [
    event.summary ? event.summary : '',
    event.organizer ? `Organizer: ${event.organizer}` : '',
    event.price ? `Price: ${event.price}` : '',
    event.registrationUrl ? `Registration: ${event.registrationUrl}` : '',
    detailUrl ? `Details: ${detailUrl}` : ''
  ].filter(Boolean)

  return lines.join('\n')
}

function buildCalendarLocation(event: Pick<EventItem, 'venueName' | 'address'>) {
  if (event.venueName && event.address) {
    return `${event.venueName}, ${event.address}`
  }

  if (event.address) {
    return event.address
  }

  if (event.venueName) {
    return event.venueName
  }

  return ''
}

function toGoogleCalendarDateTime(value: Dayjs) {
  return value.utc().format('YYYYMMDDTHHmmss[Z]')
}

function getStableEventUid(event: Pick<EventItem, 'id' | 'slug'>, siteUrl: string) {
  const hostname = new URL(normalizeSiteUrl(siteUrl)).hostname || 'localhost'
  return `${event.slug || event.id}@${hostname}`
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function foldIcsLine(line: string) {
  const maxLength = 75
  const chunks: string[] = []

  for (let index = 0; index < line.length; index += maxLength) {
    const chunk = line.slice(index, index + maxLength)
    chunks.push(index === 0 ? chunk : ` ${chunk}`)
  }

  return chunks.join('\r\n')
}

function toIcsDateTime(value: Dayjs) {
  return value.utc().format('YYYYMMDDTHHmmss[Z]')
}

export function resolveSiteUrl(siteUrl: string) {
  const trimmed = siteUrl.trim().replace(/\/+$/, '')

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '')
  }
  catch {
    return null
  }
}

function normalizeSiteUrl(siteUrl: string) {
  return resolveSiteUrl(siteUrl) ?? FALLBACK_SITE_URL
}

export function buildEventDetailUrl(siteUrl: string, slug: string) {
  return `${normalizeSiteUrl(siteUrl)}/events/${slug}`
}

export function buildGoogleCalendarUrl(event: EventItem, siteUrl: string) {
  if (!canAddEventToCalendar(event)) {
    return null
  }

  const timing = getCalendarTiming(event)

  if (!timing) {
    return null
  }

  const detailUrl = buildEventDetailUrl(siteUrl, event.slug)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    details: buildCalendarDescription(event, detailUrl),
    location: buildCalendarLocation(event)
  })

  if (timing.kind === 'all-day') {
    params.set('dates', `${timing.startDate}/${timing.exclusiveEndDate}`)
  }
  else {
    params.set('dates', `${toGoogleCalendarDateTime(timing.start)}/${toGoogleCalendarDateTime(timing.end)}`)
    params.set('ctz', TAIPEI_TIMEZONE)
  }

  return `${GOOGLE_CALENDAR_URL}?${params.toString()}`
}

export function buildIcsContent(event: EventItem, siteUrl: string, now = dayjs()) {
  if (!canAddEventToCalendar(event)) {
    return null
  }

  const timing = getCalendarTiming(event)

  if (!timing) {
    return null
  }

  const detailUrl = buildEventDetailUrl(siteUrl, event.slug)
  const description = buildCalendarDescription(event, detailUrl)
  const location = buildCalendarLocation(event)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${ICS_PROD_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${getStableEventUid(event, siteUrl)}`,
    `DTSTAMP:${toIcsDateTime(now)}`,
    timing.kind === 'all-day'
      ? `DTSTART;VALUE=DATE:${timing.startDate}`
      : `DTSTART:${toIcsDateTime(timing.start)}`,
    timing.kind === 'all-day'
      ? `DTEND;VALUE=DATE:${timing.exclusiveEndDate}`
      : `DTEND:${toIcsDateTime(timing.end)}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : '',
    location ? `LOCATION:${escapeIcsText(location)}` : '',
    detailUrl ? `URL:${detailUrl}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean)

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

export function getEventCalendarFilename(event: Pick<EventItem, 'slug'>) {
  const safeSlug = (event.slug || 'event').replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${safeSlug || 'event'}.ics`
}
