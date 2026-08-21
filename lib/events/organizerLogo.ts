import { resolveSiteUrl } from '~~/lib/event-calendar'

const ORGANIZER_LOGO_FILE_PATHS = {
  Blues20: '/organizer-logos/blues20.png',
  'find-your-blues': '/organizer-logos/find-your-blues.png',
  TapLife: '/organizer-logos/taplife.png'
} as const

type OrganizerLogoName = keyof typeof ORGANIZER_LOGO_FILE_PATHS

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

  return (Object.entries(ORGANIZER_LOGO_FILE_PATHS) as Array<[OrganizerLogoName, string]>)
    .filter(([organizerName]) => searchValue.includes(organizerName.toLowerCase()))
    .map(([organizerName, path]) => ({
      organizer: organizerName,
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
