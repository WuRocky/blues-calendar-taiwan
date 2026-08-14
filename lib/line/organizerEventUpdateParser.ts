import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'

dayjs.extend(utc)
dayjs.extend(timezone)

const ORGANIZER_UPDATE_COMMAND = '修改活動'
const FIELD_KEY_MAP = {
  '活動': 'eventName',
  '日期': 'eventDate',
  '開始時間': 'startTime',
  '結束時間': 'endTime',
  '場地': 'venueName',
  '費用': 'price'
} as const

type FieldKey = keyof typeof FIELD_KEY_MAP
type ParsedFieldKey = typeof FIELD_KEY_MAP[FieldKey]

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/
const FULL_DATE_PATTERN = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/
const MONTH_DAY_PATTERN = /^(\d{1,2})[/-](\d{1,2})$/

export interface OrganizerEventUpdateFields {
  endTime?: string
  price?: string
  startTime?: string
  venueName?: string
}

export interface ParsedOrganizerEventUpdateCommand {
  eventDate: Dayjs
  eventName: string
  fields: OrganizerEventUpdateFields
}

export interface OrganizerEventUpdateParseError {
  reason: string
}

function normalizeMultilineCommand(command: string) {
  return command
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
}

function inferYear(month: number, day: number, now: Dayjs) {
  const currentYear = now.year()
  const candidate = dayjs.tz(
    `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    'YYYY-MM-DD',
    TAIPEI_TIMEZONE
  )

  if (!candidate.isValid()) {
    return null
  }

  const pastDifference = now.startOf('day').diff(candidate.startOf('day'), 'day')

  if (pastDifference > 180) {
    return currentYear + 1
  }

  return currentYear
}

function parseEventDate(value: string, now = dayjs().tz(TAIPEI_TIMEZONE)) {
  const normalizedValue = value.trim()
  let parsedDate: Dayjs | null = null

  const fullDateMatch = normalizedValue.match(FULL_DATE_PATTERN)

  if (fullDateMatch) {
    const yearText = fullDateMatch[1]
    const monthText = fullDateMatch[2]
    const dayText = fullDateMatch[3]

    if (!yearText || !monthText || !dayText) {
      return null
    }

    parsedDate = dayjs.tz(`${yearText}-${monthText.padStart(2, '0')}-${dayText.padStart(2, '0')}`, 'YYYY-MM-DD', TAIPEI_TIMEZONE)
  } else {
    const monthDayMatch = normalizedValue.match(MONTH_DAY_PATTERN)

    if (!monthDayMatch) {
      return null
    }

    const month = Number(monthDayMatch[1])
    const day = Number(monthDayMatch[2])
    const inferredYear = inferYear(month, day, now)

    if (!inferredYear) {
      return null
    }

    parsedDate = dayjs.tz(`${inferredYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, 'YYYY-MM-DD', TAIPEI_TIMEZONE)
  }

  return parsedDate && parsedDate.isValid() ? parsedDate.startOf('day') : null
}

function parseOrganizerFieldLine(line: string) {
  const match = line.match(/^([^:：]+)\s*[:：]\s*(.+)$/)

  if (!match) {
    return null
  }

  const rawKey = match[1]
  const rawValue = match[2]

  if (!rawKey || !rawValue) {
    return null
  }

  const key = rawKey.trim() as FieldKey
  const value = rawValue.trim()

  if (!value || !(key in FIELD_KEY_MAP)) {
    return null
  }

  return {
    key: FIELD_KEY_MAP[key],
    value
  } satisfies { key: ParsedFieldKey, value: string }
}

function parseTimeValue(value: string) {
  return TIME_PATTERN.test(value.trim()) ? value.trim() : null
}

export function isOrganizerUpdateCommand(command: string) {
  const [firstLine] = normalizeMultilineCommand(command)
  return firstLine === ORGANIZER_UPDATE_COMMAND
}

export function parseOrganizerEventUpdateCommand(
  command: string,
  now = dayjs().tz(TAIPEI_TIMEZONE)
): ParsedOrganizerEventUpdateCommand | OrganizerEventUpdateParseError {
  const lines = normalizeMultilineCommand(command)
  const [firstLine] = lines

  if (firstLine !== ORGANIZER_UPDATE_COMMAND) {
    return {
      reason: 'unsupported command'
    }
  }

  const parsedFields = lines
    .slice(1)
    .map(parseOrganizerFieldLine)
    .filter((field): field is { key: ParsedFieldKey, value: string } => Boolean(field))

  const eventName = parsedFields.find(field => field.key === 'eventName')?.value ?? ''
  const eventDateValue = parsedFields.find(field => field.key === 'eventDate')?.value ?? ''
  const parsedDate = parseEventDate(eventDateValue, now)

  if (!eventName) {
    return {
      reason: 'missing event name'
    }
  }

  if (!parsedDate) {
    return {
      reason: 'invalid event date'
    }
  }

  const fields: OrganizerEventUpdateFields = {}

  for (const field of parsedFields) {
    switch (field.key) {
      case 'startTime':
      case 'endTime': {
        const parsedTime = parseTimeValue(field.value)

        if (!parsedTime) {
          return {
            reason: `invalid ${field.key}`
          }
        }

        fields[field.key] = parsedTime
        break
      }
      case 'venueName':
      case 'price':
        fields[field.key] = field.value
        break
      default:
        break
    }
  }

  if (Object.keys(fields).length === 0) {
    return {
      reason: 'missing update fields'
    }
  }

  return {
    eventDate: parsedDate,
    eventName,
    fields
  }
}
