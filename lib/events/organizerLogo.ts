import { resolveSiteUrl } from '~~/lib/event-calendar'

const ORGANIZER_LOGO_FILE_PATHS = {
  Blues20: '/organizer-logos/blues20.png',
  'find-your-blues': '/organizer-logos/find-your-blues.png',
  TapLife: '/organizer-logos/taplife.png'
} as const

type OrganizerLogoName = keyof typeof ORGANIZER_LOGO_FILE_PATHS

function normalizeOrganizerName(organizer: string | null | undefined) {
  return typeof organizer === 'string' ? organizer.trim() : ''
}

function isOrganizerLogoName(value: string): value is OrganizerLogoName {
  return value in ORGANIZER_LOGO_FILE_PATHS
}

export function getOrganizerLogoPath(organizer: string | null | undefined) {
  const normalizedOrganizer = normalizeOrganizerName(organizer)

  if (!normalizedOrganizer || !isOrganizerLogoName(normalizedOrganizer)) {
    return null
  }

  return ORGANIZER_LOGO_FILE_PATHS[normalizedOrganizer]
}

export function getOrganizerLogoUrl(organizer: string | null | undefined, siteUrl: string) {
  const path = getOrganizerLogoPath(organizer)
  const normalizedSiteUrl = resolveSiteUrl(siteUrl)

  if (!path || !normalizedSiteUrl) {
    return null
  }

  return `${normalizedSiteUrl}${path}`
}
