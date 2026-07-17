import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { shouldRetainCalendarEventByTimeStatus, shouldRetainEventByTimeStatus } from '~~/lib/event-status'
import type { BaseEventItem, EventItem, EventTimeStatus } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

export const TAIPEI_TIMEZONE = 'Asia/Taipei'

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i

export interface EventTimeEvaluation {
  reason: string | null
  timeStatus: EventTimeStatus
}

interface NormalizedEventTime {
  isDateOnly: boolean
  reason: string | null
  value: string | null
}

export function isRegularClass(event: Pick<BaseEventItem, 'eventType' | 'recurring'>) {
  return event.eventType === 'class' || event.recurring
}

function parseRawNotionDateTime(value: string, boundary: 'start' | 'end'): Dayjs {
  if (DATE_ONLY_PATTERN.test(value)) {
    const time = boundary === 'end' ? '23:59:59.999' : '00:00:00.000'
    return dayjs.tz(`${value} ${time}`, 'YYYY-MM-DD HH:mm:ss.SSS', TAIPEI_TIMEZONE)
  }

  if (TIMEZONE_SUFFIX_PATTERN.test(value)) {
    return dayjs(value)
  }

  return dayjs.tz(value, TAIPEI_TIMEZONE)
}

function parseStoredEventTime(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

export function normalizeNotionDateTime(value: string | null, boundary: 'start' | 'end'): NormalizedEventTime {
  if (!value) {
    return {
      isDateOnly: false,
      reason: null,
      value: null
    }
  }

  const parsed = parseRawNotionDateTime(value, boundary)

  if (!parsed.isValid()) {
    return {
      isDateOnly: DATE_ONLY_PATTERN.test(value),
      reason: `${boundary === 'start' ? 'Start Time' : 'End Time'} is not a valid date`,
      value: null
    }
  }

  return {
    isDateOnly: DATE_ONLY_PATTERN.test(value),
    reason: null,
    value: parsed.toISOString()
  }
}

export function evaluateEventTime(event: Pick<BaseEventItem, 'eventType' | 'recurring' | 'startTime' | 'endTime'>, now = dayjs()): EventTimeEvaluation {
  if (!event.startTime && !event.endTime && isRegularClass(event)) {
    return {
      reason: null,
      timeStatus: 'unscheduled'
    }
  }

  const startTime = parseStoredEventTime(event.startTime)

  if (!startTime) {
    return {
      reason: 'missing or invalid Start Time',
      timeStatus: 'invalid'
    }
  }

  const endTime = parseStoredEventTime(event.endTime)

  if (event.endTime && !endTime) {
    return {
      reason: 'invalid End Time',
      timeStatus: 'invalid'
    }
  }

  if (endTime && endTime.isBefore(startTime)) {
    return {
      reason: 'End Time is earlier than Start Time',
      timeStatus: 'invalid'
    }
  }

  const nowInTaipei = now.tz(TAIPEI_TIMEZONE)
  const startInTaipei = startTime.tz(TAIPEI_TIMEZONE)

  if (!endTime) {
    if (nowInTaipei.isBefore(startInTaipei)) {
      return {
        reason: null,
        timeStatus: 'upcoming'
      }
    }

    return {
      reason: null,
      timeStatus: nowInTaipei.isSame(startInTaipei, 'day') ? 'ongoing' : 'ended'
    }
  }

  const endInTaipei = endTime.tz(TAIPEI_TIMEZONE)

  if (nowInTaipei.isBefore(startInTaipei)) {
    return {
      reason: null,
      timeStatus: 'upcoming'
    }
  }

  if (nowInTaipei.isAfter(endInTaipei)) {
    return {
      reason: null,
      timeStatus: 'ended'
    }
  }

  return {
    reason: null,
    timeStatus: 'ongoing'
  }
}

export function withEventTimeStatus<T extends BaseEventItem>(event: T, now = dayjs()): T & { timeStatus: EventTimeStatus } {
  const { timeStatus } = evaluateEventTime(event, now)

  return {
    ...event,
    timeStatus
  }
}

export function shouldDisplayPublicEvent(event: Pick<EventItem, 'timeStatus'>) {
  return shouldRetainEventByTimeStatus(event)
}

export function shouldDisplayCalendarEvent(event: Pick<EventItem, 'timeStatus'>) {
  return shouldRetainCalendarEventByTimeStatus(event)
}

function compareByStartTime(a: Pick<EventItem, 'startTime'>, b: Pick<EventItem, 'startTime'>) {
  const aStart = a.startTime ?? ''
  const bStart = b.startTime ?? ''
  return aStart.localeCompare(bStart)
}

function compareByName(a: Pick<EventItem, 'name'>, b: Pick<EventItem, 'name'>) {
  return a.name.localeCompare(b.name)
}

function compareByStableIdentity(a: Pick<EventItem, 'id' | 'slug'>, b: Pick<EventItem, 'id' | 'slug'>) {
  const aIdentity = a.slug || a.id
  const bIdentity = b.slug || b.id
  return aIdentity.localeCompare(bIdentity)
}

function compareByOrganizer(a: Pick<BaseEventItem, 'organizer'>, b: Pick<BaseEventItem, 'organizer'>) {
  return (a.organizer || '').localeCompare(b.organizer || '')
}

function compareByWeekdayOrder(a: Pick<BaseEventItem, 'weekdayOrder'>, b: Pick<BaseEventItem, 'weekdayOrder'>) {
  const aOrder = a.weekdayOrder
  const bOrder = b.weekdayOrder

  if (aOrder === null && bOrder === null) {
    return 0
  }

  if (aOrder === null) {
    return 1
  }

  if (bOrder === null) {
    return -1
  }

  return aOrder - bOrder
}

export function compareEventsByDisplayPriority(a: EventItem, b: EventItem) {
  const statusPriority: Record<EventTimeStatus, number> = {
    ongoing: 0,
    upcoming: 1,
    unscheduled: 2,
    ended: 3,
    invalid: 4
  }

  const statusCompare = statusPriority[a.timeStatus] - statusPriority[b.timeStatus]

  if (statusCompare !== 0) {
    return statusCompare
  }

  const startCompare = compareByStartTime(a, b)

  if (startCompare !== 0) {
    return startCompare
  }

  const nameCompare = compareByName(a, b)

  if (nameCompare !== 0) {
    return nameCompare
  }

  return compareByStableIdentity(a, b)
}

export function sortEventsByDisplayPriority(events: readonly EventItem[]) {
  return [...events].sort(compareEventsByDisplayPriority)
}

export function compareRegularClasses(a: BaseEventItem, b: BaseEventItem) {
  const weekdayCompare = compareByWeekdayOrder(a, b)

  if (weekdayCompare !== 0) {
    return weekdayCompare
  }

  const organizerCompare = compareByOrganizer(a, b)

  if (organizerCompare !== 0) {
    return organizerCompare
  }

  const nameCompare = compareByName(a, b)

  if (nameCompare !== 0) {
    return nameCompare
  }

  return compareByStableIdentity(a, b)
}

export function sortRegularClasses<T extends BaseEventItem>(events: readonly T[]) {
  return [...events].sort(compareRegularClasses)
}
