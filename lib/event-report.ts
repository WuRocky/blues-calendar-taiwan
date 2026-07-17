import { buildEventDetailUrl, resolveSiteUrl } from '~~/lib/event-calendar'
import type { EventItem } from '~~/types/event'

const TALLY_HOST_PATTERN = /(^|\.)tally\.so$/i
const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface TallyFormUrlResolution {
  url: string | null
  warningReason: string | null
}

export function resolveTallyFormUrl(formUrl: string) {
  const trimmed = formUrl.trim()

  if (!trimmed) {
    return {
      url: null,
      warningReason: 'missing form URL'
    } satisfies TallyFormUrlResolution
  }

  try {
    const parsed = new URL(trimmed)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        url: null,
        warningReason: 'form URL must use http or https'
      } satisfies TallyFormUrlResolution
    }

    if (!TALLY_HOST_PATTERN.test(parsed.hostname)) {
      return {
        url: null,
        warningReason: 'form URL must use tally.so'
      } satisfies TallyFormUrlResolution
    }

    if (!parsed.pathname.startsWith('/r/')) {
      return {
        url: null,
        warningReason: 'form URL must target a Tally response form'
      } satisfies TallyFormUrlResolution
    }

    return {
      url: parsed.toString(),
      warningReason: null
    } satisfies TallyFormUrlResolution
  }
  catch {
    return {
      url: null,
      warningReason: 'form URL is not a valid absolute URL'
    } satisfies TallyFormUrlResolution
  }
}

function isValidPublicSlug(slug: string) {
  return PUBLIC_SLUG_PATTERN.test(slug.trim())
}

export function buildEventReportUrl(event: Pick<EventItem, 'name' | 'slug'>, formUrl: string, siteUrl: string) {
  const resolvedFormUrl = resolveTallyFormUrl(formUrl)

  if (!resolvedFormUrl.url) {
    return null
  }

  const slug = event.slug.trim()

  if (!isValidPublicSlug(slug)) {
    return null
  }

  if (!resolveSiteUrl(siteUrl)) {
    return null
  }

  const reportUrl = new URL(resolvedFormUrl.url)
  const eventUrl = buildEventDetailUrl(siteUrl, slug)

  reportUrl.searchParams.set('eventName', event.name.trim())
  reportUrl.searchParams.set('eventSlug', slug)
  reportUrl.searchParams.set('eventUrl', eventUrl)

  return reportUrl.toString()
}
