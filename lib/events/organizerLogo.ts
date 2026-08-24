import { resolveSiteUrl } from '~~/lib/event-calendar'

const ORGANIZER_LOGO_SOURCES = [
  {
    aliases: ['blues20'],
    organizer: 'Blues20',
    path: '/organizer-logos/blues20.png'
  },
  {
    aliases: ['find-your-blues', 'find your blues'],
    organizer: 'find-your-blues',
    path: '/organizer-logos/find-your-blues.png'
  },
  {
    aliases: ['taplife'],
    organizer: 'TapLife',
    path: '/organizer-logos/taplife.png'
  }
] as const

type OrganizerLogoName = typeof ORGANIZER_LOGO_SOURCES[number]['organizer']

export interface OrganizerLogoMatch {
  organizer: OrganizerLogoName
  path: string
}

function normalizeOrganizerName(organizer: string | null | undefined) {
  return typeof organizer === 'string' ? organizer.trim() : ''
}

function getOrganizerSearchValue(organizer: string | null | undefined) {
  return normalizeOrganizerName(organizer).toLowerCase()
}

function getOrganizerLogoMatches(organizer: string | null | undefined): OrganizerLogoMatch[] {
  const searchValue = getOrganizerSearchValue(organizer)

  if (!searchValue) {
    return []
  }

  return ORGANIZER_LOGO_SOURCES
    .filter(({ aliases }) => aliases.some(alias => searchValue.includes(alias)))
    .map(({ organizer, path }) => ({
      organizer,
      path
    }))
}

export function getOrganizerLogos(organizer: string | null | undefined) {
  return getOrganizerLogoMatches(organizer)
}

export function getOrganizerLogoUrls(organizer: string | null | undefined, siteUrl: string) {
  const normalizedSiteUrl = resolveSiteUrl(siteUrl)

  if (!normalizedSiteUrl) {
    return []
  }

  return getOrganizerLogoMatches(organizer).map((logo) => ({
    ...logo,
    url: `${normalizedSiteUrl}${logo.path}`
  }))
}

export function getOrganizerLogoPath(organizer: string | null | undefined) {
  return getOrganizerLogoMatches(organizer)[0]?.path ?? null
}

export function getOrganizerLogoUrl(organizer: string | null | undefined, siteUrl: string) {
  return getOrganizerLogoUrls(organizer, siteUrl)[0]?.url ?? null
}
