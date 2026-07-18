import { buildEventDetailUrl, resolveSiteUrl } from '~~/lib/event-calendar'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { EventItem, EventStatus, EventType } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

export const SITE_NAME = 'Blues Calendar Taiwan'
export const DEFAULT_OG_IMAGE_PATH = '/images/og-default.png'
export const SEO_LOCALES = ['zh-TW', 'en', 'ja', 'ko'] as const
export type SeoLocale = typeof SEO_LOCALES[number]

const LOCALE_PATH_PREFIX: Record<SeoLocale, string> = {
  'zh-TW': '',
  en: '/en',
  ja: '/ja',
  ko: '/ko'
}

const OG_LOCALE: Record<SeoLocale, string> = {
  'zh-TW': 'zh_TW',
  en: 'en_US',
  ja: 'ja_JP',
  ko: 'ko_KR'
}

const STATUS_COPY: Record<SeoLocale, Record<Exclude<EventStatus, 'scheduled'>, { prefix: string, description: string }>> = {
  'zh-TW': {
    cancelled: { prefix: '【已取消】', description: '此活動已取消。' },
    postponed: { prefix: '【延期】', description: '此活動已延期。' }
  },
  en: {
    cancelled: { prefix: '[Cancelled] ', description: 'This event has been cancelled.' },
    postponed: { prefix: '[Postponed] ', description: 'This event has been postponed.' }
  },
  ja: {
    cancelled: { prefix: '【中止】', description: 'このイベントは中止になりました。' },
    postponed: { prefix: '【延期】', description: 'このイベントは延期になりました。' }
  },
  ko: {
    cancelled: { prefix: '【취소】', description: '이 행사는 취소되었습니다.' },
    postponed: { prefix: '【연기】', description: '이 행사는 연기되었습니다.' }
  }
}

const TYPE_LABELS: Record<SeoLocale, Record<EventType, string>> = {
  'zh-TW': { class: 'Blues 課程', workshop: 'Blues Workshop', social: 'Blues Social', 'open-floor': 'Blues Social', party: 'Blues 舞會', festival: 'Blues Festival', event: 'Blues 活動', other: 'Blues 活動' },
  en: { class: 'Blues class', workshop: 'Blues workshop', social: 'Blues social', 'open-floor': 'Blues social', party: 'Blues party', festival: 'Blues festival', event: 'Blues event', other: 'Blues event' },
  ja: { class: 'Blues クラス', workshop: 'Blues ワークショップ', social: 'Blues ソーシャル', 'open-floor': 'Blues ソーシャル', party: 'Blues パーティー', festival: 'Blues フェスティバル', event: 'Blues イベント', other: 'Blues イベント' },
  ko: { class: 'Blues 수업', workshop: 'Blues 워크숍', social: 'Blues 소셜', 'open-floor': 'Blues 소셜', party: 'Blues 파티', festival: 'Blues 페스티벌', event: 'Blues 행사', other: 'Blues 행사' }
}

export function normalizeSeoLocale(locale: string): SeoLocale {
  return SEO_LOCALES.includes(locale as SeoLocale) ? locale as SeoLocale : 'zh-TW'
}

export function cleanSeoDescription(value: string, maxLength = 160) {
  const cleaned = value.replace(/\s+/g, ' ').replace(/\b(?:undefined|null)\b/gi, '').trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`
}

export function buildLocalizedUrl(siteUrl: string, locale: string, path = '/') {
  const base = resolveSiteUrl(siteUrl)
  if (!base) return null
  const normalizedLocale = normalizeSeoLocale(locale)
  const normalizedPath = path === '/' ? '' : `/${path.replace(/^\/+|\/+$/g, '')}`
  return `${base}${LOCALE_PATH_PREFIX[normalizedLocale]}${normalizedPath || '/'}`
}

export function buildLocaleAlternates(siteUrl: string, path = '/') {
  return SEO_LOCALES.flatMap((locale) => {
    const href = buildLocalizedUrl(siteUrl, locale, path)
    return href ? [{ hreflang: locale, href }] : []
  })
}

export function getOgLocale(locale: string) {
  return OG_LOCALE[normalizeSeoLocale(locale)]
}

export function buildEventSeoTitle(event: Pick<EventItem, 'name' | 'eventStatus'>, locale: string) {
  const normalizedLocale = normalizeSeoLocale(locale)
  const prefix = event.eventStatus === 'scheduled' ? '' : STATUS_COPY[normalizedLocale][event.eventStatus].prefix
  return `${prefix}${event.name}｜${SITE_NAME}`
}

export function buildEventSeoDescription(event: Pick<EventItem, 'summary' | 'description' | 'eventType' | 'city' | 'organizer' | 'eventStatus'>, locale: string) {
  const normalizedLocale = normalizeSeoLocale(locale)
  const fallbackParts = [TYPE_LABELS[normalizedLocale][event.eventType], event.city, event.organizer].filter(Boolean)
  const base = cleanSeoDescription(event.summary || event.description || fallbackParts.join('・'))
  const status = event.eventStatus === 'scheduled' ? '' : STATUS_COPY[normalizedLocale][event.eventStatus].description
  return cleanSeoDescription([status, base].filter(Boolean).join(' '))
}

export function resolveSeoImage(siteUrl: string, coverImageUrl: string) {
  const fallback = buildAbsoluteAssetUrl(siteUrl, DEFAULT_OG_IMAGE_PATH)
  const value = coverImageUrl.trim()
  if (!value) return fallback
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' ? parsed.toString() : fallback
  }
  catch {
    return buildAbsoluteAssetUrl(siteUrl, value) ?? fallback
  }
}

function buildAbsoluteAssetUrl(siteUrl: string, path: string) {
  const base = resolveSiteUrl(siteUrl)
  if (!base) return null
  try {
    return new URL(path, `${base}/`).toString()
  }
  catch {
    return null
  }
}

export function buildLocalizedEventUrl(siteUrl: string, locale: string, slug: string) {
  const defaultUrl = buildEventDetailUrl(siteUrl, slug)
  if (normalizeSeoLocale(locale) === 'zh-TW') return resolveSiteUrl(siteUrl) ? defaultUrl : null
  return buildLocalizedUrl(siteUrl, locale, `/events/${slug}`)
}

export function buildEventJsonLd(event: EventItem, siteUrl: string, locale: string) {
  if (!event.startTime || event.timeStatus === 'invalid' || event.timeStatus === 'unscheduled') return null
  const url = buildLocalizedEventUrl(siteUrl, locale, event.slug)
  if (!url) return null

  const formatSchemaDate = (value: string, dateOnly: boolean) => dateOnly
    ? dayjs(value).tz('Asia/Taipei').format('YYYY-MM-DD')
    : dayjs(value).tz('Asia/Taipei').format('YYYY-MM-DDTHH:mm:ssZ')
  const startDate = formatSchemaDate(event.startTime, event.startTimeIsDateOnly)
  const endDate = event.endTime
    ? formatSchemaDate(event.endTime, event.endTimeIsDateOnly)
    : undefined
  const location = event.venueName || event.address || event.city
    ? {
        '@type': 'Place',
        ...(event.venueName ? { name: event.venueName } : {}),
        ...(event.address || event.city ? { address: [event.address, event.city].filter(Boolean).join(', ') } : {})
      }
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: buildEventSeoDescription(event, locale),
    startDate,
    ...(endDate ? { endDate } : {}),
    eventStatus: `https://schema.org/${event.eventStatus === 'cancelled' ? 'EventCancelled' : event.eventStatus === 'postponed' ? 'EventPostponed' : 'EventScheduled'}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url,
    ...(location ? { location } : {}),
    ...(event.organizer ? { organizer: { '@type': 'Organization', name: event.organizer } } : {}),
    ...(resolveSeoImage(siteUrl, event.coverImageUrl) ? { image: [resolveSeoImage(siteUrl, event.coverImageUrl)] } : {})
  }
}

export function isValidPublicSitemapEvent(event: Pick<EventItem, 'slug' | 'published' | 'eventStatus' | 'timeStatus'>) {
  return event.published
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug)
    && ['scheduled', 'cancelled', 'postponed'].includes(event.eventStatus)
    && event.timeStatus !== 'invalid'
}
