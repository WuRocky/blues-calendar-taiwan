import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getEventTimeRangeInTaipei, shouldDisplayCalendarEvent, TAIPEI_TIMEZONE } from './event-time'
import type { EventItem } from '../types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface HomeWeekDay {
  key: string
  date: string
  events: EventItem[]
}

export function getTaipeiWeek(now: Dayjs = dayjs()) {
  const today = now.tz(TAIPEI_TIMEZONE)
  const mondayOffset = (today.day() + 6) % 7
  const start = today.startOf('day').subtract(mondayOffset, 'day')
  return { today, start, end: start.add(6, 'day').endOf('day') }
}

export function selectWeeklyCalendarEvents(events: readonly EventItem[], now: Dayjs = dayjs()) {
  const { start: weekStart, end: weekEnd } = getTaipeiWeek(now)

  return events.filter((event) => {
    if (event.timeStatus === 'invalid' || event.timeStatus === 'unscheduled') return false

    const eventRange = getEventTimeRangeInTaipei(event)
    return Boolean(eventRange
      && !eventRange.start.isAfter(weekEnd)
      && !eventRange.end.isBefore(weekStart))
  })
}

export function selectDatedHomeCalendarEvents(events: readonly EventItem[]) {
  return events.filter(event => event.timeStatus !== 'invalid'
    && event.timeStatus !== 'unscheduled'
    && Boolean(getEventTimeRangeInTaipei(event)))
}

export function buildHomeWeek(events: readonly EventItem[], now: Dayjs = dayjs()): HomeWeekDay[] {
  const { start, end } = getTaipeiWeek(now)
  const grouped = new Map<string, EventItem[]>()

  for (const event of selectWeeklyCalendarEvents(events, now)) {
    const eventRange = getEventTimeRangeInTaipei(event)!

    for (let index = 0; index < 7; index += 1) {
      const dayStart = start.add(index, 'day')
      const dayEnd = dayStart.endOf('day')
      if (eventRange.start.isAfter(dayEnd) || eventRange.end.isBefore(dayStart)) continue

      const key = dayStart.format('YYYY-MM-DD')
      grouped.set(key, [...(grouped.get(key) ?? []), event])
    }
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = start.add(index, 'day')
    const key = date.format('YYYY-MM-DD')
    return {
      key,
      date: date.toISOString(),
      events: [...(grouped.get(key) ?? [])].sort((a, b) =>
        (a.startTime ?? '').localeCompare(b.startTime ?? '') || a.name.localeCompare(b.name)
      )
    }
  })
}

export function getDefaultHomeDayKey(days: readonly HomeWeekDay[], now: Dayjs = dayjs()) {
  const todayKey = now.tz(TAIPEI_TIMEZONE).format('YYYY-MM-DD')
  return days.some(day => day.key === todayKey) ? todayKey : (days[0]?.key ?? '')
}

export function selectHighlightEvents(events: readonly EventItem[]) {
  return events
    .filter(event => shouldDisplayCalendarEvent(event))
    .filter(event => ['workshop', 'event'].includes(event.eventType.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.coverImageUrl)) - Number(Boolean(a.coverImageUrl))
      || (a.startTime ?? '').localeCompare(b.startTime ?? '')
      || a.name.localeCompare(b.name))
    .slice(0, 2)
}
