import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { resolveSiteUrl } from '~~/lib/event-calendar'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { getOrganizerLogoPath } from '~~/lib/events/organizerLogo'
import type { EventItem, EventType } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface OpenChatWeeklyEvent {
  address: string | null
  city: string | null
  dateLabel: string
  end: string | null
  eventType: string
  eventUrl: string | null
  isAllDay: boolean
  mapUrl: string | null
  name: string
  organizer: string | null
  organizerLogo: string | null
  start: string
  summary: string | null
  timeLabel: string | null
  venue: string | null
}

export interface OpenChatWeeklyFeed {
  eventCount: number
  events: OpenChatWeeklyEvent[]
  messageId: string
  publishDate: string
  shouldPublish: boolean
  text: string
  upcomingWorkshopCount: number
  upcomingWorkshops: OpenChatWeeklyEvent[]
  week: {
    end: string
    label: string
    start: string
  }
}

export interface FormatWeeklyOpenChatFeedOptions {
  events: readonly EventItem[]
  lineAddFriendUrl?: string
  periodLabel?: string
  siteUrl?: string
  upcomingWorkshops?: readonly EventItem[]
  weekEnd: Dayjs
  weekStart: Dayjs
}

const EVENT_TYPE_EMOJIS: Partial<Record<EventType, string>> = {
  class: '📚',
  event: '💙',
  social: '🎵',
  workshop: '🎓'
}

function formatWeekday(day: Dayjs) {
  return day.format('dd')
    .replace('Mo', '一')
    .replace('Tu', '二')
    .replace('We', '三')
    .replace('Th', '四')
    .replace('Fr', '五')
    .replace('Sa', '六')
    .replace('Su', '日')
}

function formatWeekLabel(day: Dayjs) {
  return `${day.format('M/D')}（${formatWeekday(day)}）`
}

export function formatOpenChatWeekRange(start: Dayjs, end: Dayjs) {
  return `${formatWeekLabel(start)}～ ${formatWeekLabel(end)}`
}

function formatTaipeiDateTime(value: string) {
  return dayjs(value).tz(TAIPEI_TIMEZONE)
}

function formatEventTypeEmoji(eventType: EventType) {
  return EVENT_TYPE_EMOJIS[eventType] ?? '📅'
}

function getValidHttpUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  }
  catch {
    return null
  }
}

function buildEventDetailUrl(siteUrl: string, slug: string) {
  const baseUrl = resolveSiteUrl(siteUrl)

  if (!baseUrl) {
    return null
  }

  const hostname = new URL(baseUrl).hostname.toLowerCase()

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return null
  }

  return `${baseUrl}/events/${slug}`
}

function buildOpenChatEventUrl(event: EventItem, siteUrl?: string) {
  const registrationUrl = getValidHttpUrl(event.registrationUrl)

  if (registrationUrl) {
    return registrationUrl
  }

  return event.slug && siteUrl ? buildEventDetailUrl(siteUrl, event.slug) : null
}

function buildOpenChatMapUrl(event: EventItem) {
  const venueUrl = getValidHttpUrl(event.venueUrl)

  if (venueUrl) {
    return venueUrl
  }

  if (!event.address.trim()) {
    return null
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address.trim())}`
}

function formatOpenChatTimeLabel(start: Dayjs, end: Dayjs | null, isAllDay: boolean) {
  if (isAllDay) {
    return null
  }

  if (!end) {
    return start.format('HH:mm')
  }

  if (start.isSame(end, 'day')) {
    return `${start.format('HH:mm')}–${end.format('HH:mm')}`
  }

  return `${start.format('HH:mm')}–${formatWeekLabel(end)} ${end.format('HH:mm')}`
}

function formatTextDateTime(start: Dayjs, end: Dayjs | null, isAllDay: boolean) {
  if (isAllDay) {
    return formatWeekLabel(start)
  }

  if (!end) {
    return `${formatWeekLabel(start)}${start.format('HH:mm')}`
  }

  if (start.isSame(end, 'day')) {
    return `${formatWeekLabel(start)}${start.format('HH:mm')}–${end.format('HH:mm')}`
  }

  return `${formatWeekLabel(start)}${start.format('HH:mm')}–${formatWeekLabel(end)}${end.format('HH:mm')}`
}

function toTaipeiIso(value: Dayjs) {
  return value.tz(TAIPEI_TIMEZONE).format('YYYY-MM-DDTHH:mm:ssZ')
}

function normalizeTextValue(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function formatEventTypeLabel(eventType: EventType) {
  return eventType.charAt(0).toUpperCase() + eventType.slice(1)
}

function buildOpenChatEvent(event: EventItem, siteUrl?: string): OpenChatWeeklyEvent {
  const start = formatTaipeiDateTime(event.startTime || '')
  const end = event.endTime ? formatTaipeiDateTime(event.endTime) : null
  const isAllDay = event.startTimeIsDateOnly || event.endTimeIsDateOnly

  return {
    name: event.name,
    eventType: formatEventTypeLabel(event.eventType),
    start: toTaipeiIso(start),
    end: end ? toTaipeiIso(end) : null,
    dateLabel: formatWeekLabel(start),
    timeLabel: formatOpenChatTimeLabel(start, end, isAllDay),
    isAllDay,
    organizer: normalizeTextValue(event.organizer),
    venue: normalizeTextValue(event.venueName),
    address: normalizeTextValue(event.address),
    city: normalizeTextValue(event.city),
    eventUrl: buildOpenChatEventUrl(event, siteUrl),
    mapUrl: buildOpenChatMapUrl(event),
    organizerLogo: getOrganizerLogoPath(event.organizer),
    summary: normalizeTextValue(event.summary)
  }
}

function buildOpenChatText(
  events: readonly OpenChatWeeklyEvent[],
  upcomingWorkshops: readonly OpenChatWeeklyEvent[],
  periodLabel: string,
  weekLabel: string,
  lineAddFriendUrl?: string
) {
  if (events.length === 0 && upcomingWorkshops.length === 0) {
    return ''
  }

  const lines: string[] = [`💙 ${periodLabel} Blues 活動`, weekLabel]

  if (events.length > 0) {
    lines.push(`本週共 ${events.length} 場活動`)
  } else {
    lines.push('本週目前沒有活動')
  }

  for (const event of events) {
    const icon = formatEventTypeEmoji(event.eventType.toLowerCase() as EventType)

    lines.push('')
    lines.push(
      formatTextDateTime(
        dayjs(event.start),
        event.end ? dayjs(event.end) : null,
        event.isAllDay
      )
    )
    lines.push(`${icon} ${event.name}`)

    if (event.organizer) {
      lines.push(`👤 ${event.organizer}`)
    }

    if (event.venue) {
      lines.push(`📍 ${event.venue}`)
    }

    if (event.eventUrl) {
      lines.push('🔗 活動資訊：')
      lines.push(event.eventUrl)
    }
  }

  if (upcomingWorkshops.length > 0) {
    lines.push('')
    lines.push('📌 近期 Workshop')

    for (const event of upcomingWorkshops) {
      const icon = formatEventTypeEmoji(event.eventType.toLowerCase() as EventType)

      lines.push('')
      lines.push(
        formatTextDateTime(
          dayjs(event.start),
          event.end ? dayjs(event.end) : null,
          event.isAllDay
        )
      )
      lines.push(`${icon} ${event.name}`)

      if (event.organizer) {
        lines.push(`👤 ${event.organizer}`)
      }

      if (event.venue) {
        lines.push(`📍 ${event.venue}`)
      }

      if (event.eventUrl) {
        lines.push('🔗 活動資訊：')
        lines.push(event.eventUrl)
      }
    }
  }

  lines.push('')
  lines.push('活動時間、地點與內容如有異動，')
  lines.push('請以活動主辦單位最新公告為準。')

  const addFriendUrl = getValidHttpUrl(lineAddFriendUrl)

  if (addFriendUrl) {
    lines.push('')
    lines.push('💙 想隨時查看最新台灣 Blues 活動？')
    lines.push('加入 Blues Calendar TW')
    lines.push('')
    lines.push(`👉 ${addFriendUrl}`)
    lines.push('')
    lines.push('加入後輸入「本週活動」，')
    lines.push('即可查看完整活動資訊。')
  }

  return lines.join('\n')
}

export function formatWeeklyOpenChatFeed({
  weekStart,
  weekEnd,
  events,
  siteUrl,
  lineAddFriendUrl,
  upcomingWorkshops = [],
  periodLabel = '本週'
}: FormatWeeklyOpenChatFeedOptions): OpenChatWeeklyFeed {
  const mappedEvents = events.map((event) => buildOpenChatEvent(event, siteUrl))
  const mappedUpcomingWorkshops = upcomingWorkshops.map((event) => buildOpenChatEvent(event, siteUrl))
  const publishDate = weekStart.format('YYYY-MM-DD')
  const weekLabel = formatOpenChatWeekRange(weekStart, weekEnd)

  return {
    shouldPublish: mappedEvents.length > 0 || mappedUpcomingWorkshops.length > 0,
    publishDate,
    messageId: `weekly-${publishDate}`,
    week: {
      start: publishDate,
      end: weekEnd.format('YYYY-MM-DD'),
      label: weekLabel
    },
    eventCount: mappedEvents.length,
    events: mappedEvents,
    upcomingWorkshopCount: mappedUpcomingWorkshops.length,
    upcomingWorkshops: mappedUpcomingWorkshops,
    text: buildOpenChatText(
      mappedEvents,
      mappedUpcomingWorkshops,
      periodLabel,
      weekLabel,
      lineAddFriendUrl
    )
  }
}
