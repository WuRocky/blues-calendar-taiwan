import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { parseTaipeiDateInput } from '~~/lib/events/weeklyEvents'

dayjs.extend(utc)
dayjs.extend(timezone)

export function resolveLinePushDate(value: unknown) {
  if (Array.isArray(value)) {
    return null
  }

  if (!value) {
    return dayjs()
  }

  if (typeof value !== 'string') {
    return null
  }

  return parseTaipeiDateInput(value)
}
