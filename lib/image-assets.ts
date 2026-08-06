import type { EventItem, EventType } from '~~/types/event'

/** Internal editorial-image registry. Never render this metadata in the UI. */
export type LocalImageAsset = {
  src: string
  source: 'Pexels'
  sourceUrl: string
  photographer: 'Verify from source page before publication'
  usage: string
  altKey: string
}

const pexelsAsset = (src: string, photoId: string, usage: string, altKey: string): LocalImageAsset => ({
  src,
  source: 'Pexels',
  sourceUrl: `https://www.pexels.com/zh-tw/photo/${photoId}/`,
  photographer: 'Verify from source page before publication',
  usage,
  altKey
})

export const imageAssets = {
  heroTaipei101: pexelsAsset('/images/hero/taipei-101-community.jpg', '15775559', 'Homepage hero', 'home.heroImageAlt'),
  heroTaipei101Candidate: pexelsAsset('', '15586115', 'Hero candidate only; not rendered', 'home.heroImageAlt'),
  class: pexelsAsset('/images/fallbacks/blues-community-soft.jpg', '20502259', 'Class category and fallback', 'images.classAlt'),
  classBackup: pexelsAsset('/images/content/taiwan-blues-community.jpg', '17376950', 'Class backup', 'images.classAlt'),
  event: pexelsAsset('/images/fallbacks/taipei-community.jpg', '29021850', 'Event category and fallback', 'images.eventAlt'),
  eventBackup: pexelsAsset('/images/categories/other-kaohsiung-backup.jpg', '9151506', 'Event backup', 'images.eventAlt'),
  workshop: pexelsAsset('/images/categories/workshop-dance.jpg', '3877830', 'Workshop category and fallback', 'images.workshopAlt'),
  workshopBackup: pexelsAsset('/images/categories/workshop-dance-backup.jpg', '1717924', 'Workshop backup', 'images.workshopAlt'),
  social: pexelsAsset('/images/categories/social-community.jpg', '31094991', 'Social category and fallback', 'images.socialAlt'),
  socialBackup: pexelsAsset('/images/categories/social-community-backup.jpg', '17486964', 'Social backup', 'images.socialAlt'),
  other: pexelsAsset('/images/categories/other-taipei.jpg', '11446883', 'Other category fallback', 'images.otherAlt'),
  otherKaohsiungBackup: pexelsAsset('/images/categories/other-kaohsiung-backup.jpg', '9151506', 'Other category backup', 'images.otherAlt'),
  communityFallback: pexelsAsset('/images/fallbacks/blues-community.jpg', '17951254', 'Universal event fallback', 'images.fallbackAlt'),
  communitySoftFallback: pexelsAsset('/images/fallbacks/blues-community-soft.jpg', '20502259', 'Soft universal fallback', 'images.fallbackAlt'),
  taipeiFallback: pexelsAsset('/images/fallbacks/taipei-community.jpg', '29021850', 'Taipei and all-events backup', 'images.taipeiAlt'),
  communityContent: pexelsAsset('/images/content/taiwan-blues-community.jpg', '17376950', 'Editorial community content', 'images.communityAlt')
} as const

const socialImagePool = [
  imageAssets.socialBackup,
  imageAssets.social,
  imageAssets.workshopBackup,
  imageAssets.communityFallback,
  imageAssets.other,
  imageAssets.otherKaohsiungBackup
] as const

const ALLOWED_IMAGE_PROTOCOLS = new Set(['https:', 'http:'])
const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com'])

export function getCategoryImage(key: string) {
  if (key === 'class') return imageAssets.class.src
  if (key === 'event') return imageAssets.event.src
  if (key === 'workshop') return imageAssets.workshop.src
  if (key === 'social') return imageAssets.social.src
  return imageAssets.communityFallback.src
}

function stableHash(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

export function getEventFallbackImage(eventType: EventType | string, stableId = '') {
  const type = eventType.toLowerCase()
  if (type === 'class') return imageAssets.class
  if (type === 'workshop') return imageAssets.workshop
  if (type === 'social' || type === 'open-floor') return socialImagePool[stableHash(stableId) % socialImagePool.length]!
  if (type === 'other') return imageAssets.other
  if (type === 'event' || type === 'party' || type === 'festival') return imageAssets.event
  return imageAssets.communityFallback
}

export function isValidEventCoverImageUrl(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return false
  }

  try {
    const url = new URL(normalized)

    if (!ALLOWED_IMAGE_PROTOCOLS.has(url.protocol)) {
      return false
    }

    if (INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function getEventImage(eventItem: Pick<EventItem, 'coverImageUrl' | 'eventType' | 'slug' | 'id'>) {
  const coverImageUrl = eventItem.coverImageUrl?.trim()
  return isValidEventCoverImageUrl(coverImageUrl)
    ? { src: coverImageUrl, isFallback: false }
    : { ...getEventFallbackImage(eventItem.eventType, eventItem.slug || eventItem.id), isFallback: true }
}
