import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {
  getNextTaipeiWeekRange,
  getTaipeiWeekRange,
  type WeeklyEventQueryMode
} from '~~/lib/events/weeklyEvents'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface WeeklyMessagePresentation {
  periodLabel: '本週' | '下週' | '近期'
  weekEnd: Dayjs
  weekStart: Dayjs
}

export function getWeeklyMessagePresentation(
  now: Dayjs,
  mode: WeeklyEventQueryMode
): WeeklyMessagePresentation {
  if (mode === 'next-week') {
    const range = getNextTaipeiWeekRange(now)

    return {
      periodLabel: '下週',
      weekStart: range.start,
      weekEnd: range.end
    }
  }

  if (mode === 'remaining-and-next-week') {
    const current = now.tz(TAIPEI_TIMEZONE)
    const nextWeekRange = getNextTaipeiWeekRange(current)

    return {
      periodLabel: '近期',
      weekStart: current.startOf('day'),
      weekEnd: nextWeekRange.end
    }
  }

  const range = getTaipeiWeekRange(now)

  return {
    periodLabel: '本週',
    weekStart: range.start,
    weekEnd: range.end
  }
}
