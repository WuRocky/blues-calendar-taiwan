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

export function getTaipeiWeekRange(now: Dayjs = dayjs()): TaipeiWeekRange {
  const current = now.tz(TAIPEI_TIMEZONE)
  const mondayOffset = (current.day() + 6) % 7
  const start = current.startOf('day').subtract(mondayOffset, 'day')

  return {
    start,
    end: start.add(6, 'day').endOf('day')
  }
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

export function selectWeeklyEvents(events: readonly EventItem[], now: Dayjs = dayjs()) {
  const { start: weekStart, end: weekEnd } = getTaipeiWeekRange(now)

  return [...events]
    .filter(event => event.status.toLowerCase() === 'published')
    .filter(event => event.timeStatus !== 'invalid')
    .filter(event => event.timeStatus !== 'unscheduled')
    .filter((event) => {
      const eventRange = getEventTimeRangeInTaipei(event)
      return Boolean(eventRange
        && !eventRange.start.isAfter(weekEnd)
        && !eventRange.end.isBefore(weekStart))
    })
    .sort(compareWeeklyEvents)
}
