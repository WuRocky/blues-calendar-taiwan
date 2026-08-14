import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'

dayjs.extend(utc)
dayjs.extend(timezone)

export const PUBLIC_EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const GENERIC_SLUG_BASES = new Set([
  'blues',
  'class',
  'event',
  'other',
  'party',
  'practice',
  'social',
  'workshop'
])

const MIN_SLUG_BASE_LENGTH = 5
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i

export interface EventSlugSource {
  fallbackId?: string
  name: string
  startTime?: string | null
}

function normalizeAsciiText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeSlugBase(value: string) {
  return value
    .replace(/&/g, ' ')
    .replace(/@/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseSlugDate(value: string) {
  if (DATE_ONLY_PATTERN.test(value)) {
    const parsedDate = dayjs.tz(value, 'YYYY-MM-DD', TAIPEI_TIMEZONE)
    return parsedDate.isValid() ? parsedDate : null
  }

  if (TIMEZONE_SUFFIX_PATTERN.test(value)) {
    const parsedDate = dayjs(value)
    return parsedDate.isValid() ? parsedDate.tz(TAIPEI_TIMEZONE) : null
  }

  const parsedDate = dayjs.tz(value, TAIPEI_TIMEZONE)
  return parsedDate.isValid() ? parsedDate : null
}

function buildFallbackBase(fallbackId?: string) {
  const normalizedId = normalizeSlugBase(normalizeAsciiText(fallbackId || '').toLowerCase())
  return normalizedId ? `event-${normalizedId}` : 'event'
}

function getFallbackIdSegment(fallbackId?: string) {
  return normalizeSlugBase(normalizeAsciiText(fallbackId || '').toLowerCase())
}

function needsDateFallback(slugifiedName: string) {
  return !slugifiedName
    || slugifiedName.length < MIN_SLUG_BASE_LENGTH
    || GENERIC_SLUG_BASES.has(slugifiedName)
}

export function isValidPublicEventSlug(value: string) {
  return PUBLIC_EVENT_SLUG_PATTERN.test(value.trim())
}

export function slugifyEventName(name: string) {
  const normalizedName = normalizeAsciiText(name).toLowerCase()
  return normalizeSlugBase(normalizedName)
}

export function getEventSlugDate(startTime?: string | null) {
  if (!startTime) {
    return null
  }

  const parsedDate = parseSlugDate(startTime)
  return parsedDate ? parsedDate.format('YYYY-MM-DD') : null
}

export function buildEventSlugBase({ fallbackId, name, startTime }: EventSlugSource) {
  const slugifiedName = slugifyEventName(name)
  const dateSegment = getEventSlugDate(startTime)

  if (needsDateFallback(slugifiedName)) {
    const fallbackIdSegment = getFallbackIdSegment(fallbackId)

    if (dateSegment) {
      const fallbackBase = slugifiedName || 'event'
      return `${fallbackBase}-${dateSegment}`
    }

    if (slugifiedName && fallbackIdSegment) {
      return `${slugifiedName}-${fallbackIdSegment}`
    }

    return slugifiedName || buildFallbackBase(fallbackId)
  }

  return slugifiedName
}

export function generateUniqueEventSlug(
  source: EventSlugSource,
  existingSlugs: ReadonlySet<string>
) {
  const normalizedExistingSlugs = new Set(
    [...existingSlugs]
      .map(slug => slug.trim().toLowerCase())
      .filter(Boolean)
  )

  const slugifiedName = slugifyEventName(source.name)
  const dateSegment = getEventSlugDate(source.startTime)
  const baseSlug = buildEventSlugBase(source)
  const candidates = new Set<string>()

  if (!needsDateFallback(slugifiedName) && slugifiedName && slugifiedName !== baseSlug) {
    candidates.add(slugifiedName)
  }

  candidates.add(baseSlug)

  if (!needsDateFallback(slugifiedName) && slugifiedName && dateSegment) {
    candidates.add(`${slugifiedName}-${dateSegment}`)
  }

  const orderedCandidates = [...candidates]
    .map(candidate => candidate.trim().toLowerCase())
    .filter(candidate => isValidPublicEventSlug(candidate))

  for (const candidate of orderedCandidates) {
    if (!normalizedExistingSlugs.has(candidate)) {
      return candidate
    }
  }

  const suffixBase = orderedCandidates[orderedCandidates.length - 1] || buildFallbackBase(source.fallbackId)
  let suffix = 2

  while (true) {
    const candidate = `${suffixBase}-${suffix}`

    if (!normalizedExistingSlugs.has(candidate)) {
      return candidate
    }

    suffix += 1
  }
}
