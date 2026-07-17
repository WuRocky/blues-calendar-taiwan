import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { buildEventDetailUrl, resolveSiteUrl } from '~~/lib/event-calendar'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const LINE_SHARE_BASE_URL = 'https://social-plugins.line.me/lineit/share'
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function formatDateWithWeekday(value: string) {
  const date = dayjs(value).tz(TAIPEI_TIMEZONE)
  return `${date.format('YYYY/MM/DD')}（${WEEKDAY_LABELS[date.day()] || ''}）`
}

function formatTime(value: string) {
  return dayjs(value).tz(TAIPEI_TIMEZONE).format('HH:mm')
}

function formatEventShareDateLine(event: Pick<EventItem, 'startTime' | 'endTime' | 'startTimeIsDateOnly' | 'endTimeIsDateOnly' | 'weekday' | 'recurringText'>) {
  if (!event.startTime) {
    const lines = [event.weekday?.trim() || '', event.recurringText?.trim() || ''].filter(Boolean)
    return lines.join(' ')
  }

  const start = dayjs(event.startTime)

  if (!start.isValid()) {
    return ''
  }

  if (!event.endTime) {
    if (event.startTimeIsDateOnly) {
      return formatDateWithWeekday(event.startTime)
    }

    return `${formatDateWithWeekday(event.startTime)} ${formatTime(event.startTime)}`
  }

  const end = dayjs(event.endTime)

  if (!end.isValid()) {
    return ''
  }

  if (event.startTimeIsDateOnly || event.endTimeIsDateOnly) {
    const startLabel = formatDateWithWeekday(event.startTime)
    const endLabel = formatDateWithWeekday(event.endTime)

    return startLabel === endLabel ? startLabel : `${startLabel}–${endLabel}`
  }

  const startDateLabel = formatDateWithWeekday(event.startTime)
  const endDateLabel = formatDateWithWeekday(event.endTime)
  const startTimeLabel = formatTime(event.startTime)
  const endTimeLabel = formatTime(event.endTime)

  if (startDateLabel === endDateLabel) {
    return `${startDateLabel}${startTimeLabel}–${endTimeLabel}`
  }

  return `${startDateLabel} ${startTimeLabel}–${endDateLabel} ${endTimeLabel}`
}

function getPrimaryVenueLine(event: Pick<EventItem, 'venueName' | 'address'>) {
  return event.venueName.trim() || event.address.trim()
}

export function buildEventShareUrl(event: Pick<EventItem, 'slug'>, siteUrl: string) {
  if (!event.slug.trim()) {
    return null
  }

  if (!resolveSiteUrl(siteUrl)) {
    return null
  }

  return buildEventDetailUrl(siteUrl, event.slug)
}

export function buildEventShareTitle(event: Pick<EventItem, 'name'>) {
  return event.name.trim()
}

export function buildEventShareText(event: Pick<EventItem, 'name' | 'startTime' | 'endTime' | 'startTimeIsDateOnly' | 'endTimeIsDateOnly' | 'weekday' | 'recurringText' | 'venueName' | 'address' | 'slug'>, siteUrl: string) {
  const shareUrl = buildEventShareUrl(event, siteUrl)

  if (!shareUrl) {
    return null
  }

  const lines = [
    buildEventShareTitle(event),
    formatEventShareDateLine(event),
    getPrimaryVenueLine(event),
    shareUrl
  ].filter(Boolean)

  return lines.join('\n')
}

export function buildLineShareUrl(event: Pick<EventItem, 'name' | 'startTime' | 'endTime' | 'startTimeIsDateOnly' | 'endTimeIsDateOnly' | 'weekday' | 'recurringText' | 'venueName' | 'address' | 'slug'>, siteUrl: string) {
  const shareText = buildEventShareText(event, siteUrl)

  if (!shareText) {
    return null
  }

  return `${LINE_SHARE_BASE_URL}?text=${encodeURIComponent(shareText)}`
}
