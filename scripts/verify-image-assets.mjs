import assert from 'node:assert/strict'
import fs from 'node:fs'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, { alias: { '~~': projectRoot } })
const { getCategoryImage, getEventFallbackImage, getEventImage, imageAssets, isValidEventCoverImageUrl } = jiti('../lib/image-assets.ts')
const calendarEventCard = fs.readFileSync(new URL('../app/components/CalendarEventCard.vue', import.meta.url), 'utf8')

assert.equal(getCategoryImage('class'), imageAssets.class.src)
assert.equal(getCategoryImage('event'), imageAssets.event.src)
assert.equal(getEventFallbackImage('class', 'weekly-class').src, imageAssets.class.src)
assert.equal(getEventFallbackImage('event', 'large-event').src, imageAssets.event.src)
assert.equal(getEventFallbackImage('unknown', 'unknown').src, imageAssets.communityFallback.src)

const socialFirst = getEventFallbackImage('social', 'taipei-social-night').src
assert.equal(getEventFallbackImage('social', 'taipei-social-night').src, socialFirst)
assert.equal(
  getEventImage({ coverImageUrl: '', eventType: 'social', slug: 'taipei-social-night', id: 'fallback-id' }).src,
  socialFirst
)
assert.equal(
  getEventImage({ coverImageUrl: 'https://example.com/cover.jpg', eventType: 'social', slug: 'taipei-social-night', id: 'fallback-id' }).src,
  'https://example.com/cover.jpg'
)
assert.equal(isValidEventCoverImageUrl('https://example.com/direct-image'), true)
assert.equal(isValidEventCoverImageUrl('http://example.com/direct-image'), true)
assert.equal(isValidEventCoverImageUrl('https://www.instagram.com/reel/DbpDufUxxPh/'), false)
assert.equal(isValidEventCoverImageUrl('not-a-url'), false)
assert.equal(
  getEventImage({ coverImageUrl: 'https://www.instagram.com/reel/DbpDufUxxPh/', eventType: 'social', slug: 'taipei-social-night', id: 'fallback-id' }).src,
  socialFirst
)
assert.match(calendarEventCard, /object-fit:cover/)
assert.match(calendarEventCard, /aspect-ratio:4\/3/)
assert.match(calendarEventCard, /loading="lazy"/)
assert.match(calendarEventCard, /handleImageError/)

Object.values(imageAssets)
  .filter(asset => asset.src)
  .forEach(asset => assert.ok(fs.existsSync(new URL(`../public${asset.src}`, import.meta.url))))

console.log('verify-image-assets: ok')
