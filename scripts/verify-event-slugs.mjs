import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const {
  buildEventSlugBase,
  generateUniqueEventSlug,
  isValidPublicEventSlug,
  slugifyEventName
} = jiti('../lib/events/eventSlug.ts')

assert.equal(slugifyEventName('Friday Blues Social'), 'friday-blues-social')
assert.equal(slugifyEventName('Blues & Jazz @ Taipei!'), 'blues-jazz-taipei')
assert.equal(buildEventSlugBase({
  name: '週三 Blues 初級班',
  startTime: '2026-09-02'
}), 'blues-2026-09-02')
assert.equal(buildEventSlugBase({
  name: '測試班',
  startTime: '2026-08-14'
}), 'event-2026-08-14')
assert.equal(generateUniqueEventSlug({
  name: 'Friday Blues Social',
  startTime: '2026-08-15'
}, new Set()), 'friday-blues-social')
assert.equal(generateUniqueEventSlug({
  name: 'Friday Blues Social',
  startTime: '2026-08-22'
}, new Set(['friday-blues-social'])), 'friday-blues-social-2026-08-22')
assert.equal(generateUniqueEventSlug({
  name: 'Friday Blues Social',
  startTime: '2026-08-22'
}, new Set(['friday-blues-social', 'friday-blues-social-2026-08-22'])), 'friday-blues-social-2026-08-22-2')
assert.equal(generateUniqueEventSlug({
  fallbackId: 'page-123',
  name: '測試班',
  startTime: null
}, new Set()), 'event-page-123')
assert.equal(isValidPublicEventSlug('wednesday-blues-beginner-rocky-julie'), true)
assert.equal(isValidPublicEventSlug('Wednesday Blues Beginner'), false)

console.log('verify-event-slugs: ok')
