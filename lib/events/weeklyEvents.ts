import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getEventTimeRangeInTaipei, TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface TaipeiWeekRange {
  start: Dayjs
  end: Dayjs
}

export interface TaipeiDateRange {
  start: Dayjs
  end: Dayjs
}

export type WeeklyEventQueryMode =
  | 'full-week'
  | 'remaining-week'

export function getTaipeiWeekRange(now: Dayjs = dayjs()): TaipeiWeekRange {
  const current = now.tz(TAIPEI_TIMEZONE)
  const mondayOffset = (current.day() + 6) % 7
  const start = current.startOf('day').subtract(mondayOffset, 'day')

  return {
    start,
    end: start.add(6, 'day').endOf('day')
  }
}

export function getNextTaipeiWeekRange(now: Dayjs = dayjs()): TaipeiWeekRange {
  const currentWeek = getTaipeiWeekRange(now)
  const start = currentWeek.start.add(7, 'day')

  return {
    start,
    end: start.add(6, 'day').endOf('day')
  }
}

export function getTaipeiDayRange(now: Dayjs = dayjs()): TaipeiDateRange {
  const current = now.tz(TAIPEI_TIMEZONE)

  return {
    start: current.startOf('day'),
    end: current.endOf('day')
  }
}

export function parseTaipeiDateInput(value: string) {
  const normalized = value.trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null
  }

  const parsed = dayjs.tz(normalized, 'YYYY-MM-DD', TAIPEI_TIMEZONE)
  return parsed.isValid() && parsed.format('YYYY-MM-DD') === normalized ? parsed : null
}

function compareWeeklyEvents(a: EventItem, b: EventItem) {
  const startCompare = (a.startTime ?? '').localeCompare(b.startTime ?? '')

  if (startCompare !== 0) {
    return startCompare
  }

  const nameCompare = a.name.localeCompare(b.name)

  if (nameCompare !== 0) {
    return nameCompare
  }

  return (a.slug || a.id).localeCompare(b.slug || b.id)
}

function selectBaseWeeklyEvents(events: readonly EventItem[]) {
  return [...events]
    .filter(event => event.status.toLowerCase() === 'published')
    .filter(event => event.eventStatus !== 'cancelled')
    .filter(event => event.timeStatus !== 'invalid')
    .filter(event => event.timeStatus !== 'unscheduled')
}

export function selectEventsInRange(events: readonly EventItem[], range: TaipeiDateRange) {
  return selectBaseWeeklyEvents(events)
    .filter((event) => {
      const eventRange = getEventTimeRangeInTaipei(event)
      return Boolean(eventRange
        && !eventRange.start.isAfter(range.end)
        && !eventRange.end.isBefore(range.start))
    })
    .sort(compareWeeklyEvents)
}

export function selectRemainingWeeklyEvents(events: readonly EventItem[], now: Dayjs = dayjs()) {
  const nowInTaipei = now.tz(TAIPEI_TIMEZONE)
  const range = getTaipeiWeekRange(nowInTaipei)

  return selectBaseWeeklyEvents(events)
    .filter((event) => {
      const eventRange = getEventTimeRangeInTaipei(event)

      if (!eventRange || eventRange.start.isAfter(range.end)) {
        return false
      }

      if (event.endTime) {
        return !eventRange.end.isBefore(nowInTaipei)
      }

      return !eventRange.start.isBefore(nowInTaipei)
    })
    .sort(compareWeeklyEvents)
}

export function selectWeeklyEvents(
  events: readonly EventItem[],
  now: Dayjs = dayjs(),
  mode: WeeklyEventQueryMode = 'full-week'
) {
  if (mode === 'remaining-week') {
    return selectRemainingWeeklyEvents(events, now)
  }

  return selectEventsInRange(events, getTaipeiWeekRange(now))
}

export function selectNextWeeklyEvents(events: readonly EventItem[], now: Dayjs = dayjs()) {
  return selectEventsInRange(events, getNextTaipeiWeekRange(now))
}

export function selectDailyEvents(events: readonly EventItem[], now: Dayjs = dayjs()) {
  return selectEventsInRange(events, getTaipeiDayRange(now))
}
