import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, { alias: { '~~': projectRoot } })
const { buildSitemapXml } = jiti('../lib/sitemap.ts')

function event(slug, overrides = {}) {
  return {
    slug,
    published: true,
    eventStatus: 'scheduled',
    timeStatus: 'upcoming',
    ...overrides
  }
}

const xml = buildSitemapXml('https://blues.example', [
  event('valid-event'),
  event('ended-event', { timeStatus: 'ended' }),
  event('Invalid Slug'),
  event('invalid-time', { timeStatus: 'invalid' }),
  event('draft-event', { published: false })
])

assert.match(xml, /https:\/\/blues\.example\/<\/loc>/)
assert.match(xml, /https:\/\/blues\.example\/calendar/)
assert.match(xml, /https:\/\/blues\.example\/events\/valid-event/)
assert.match(xml, /https:\/\/blues\.example\/events\/ended-event/)
assert.match(xml, /https:\/\/blues\.example\/en\/events\/valid-event/)
assert.match(xml, /hreflang="ja"/)
assert.doesNotMatch(xml, /Invalid Slug/)
assert.doesNotMatch(xml, /invalid-time/)
assert.doesNotMatch(xml, /draft-event/)
assert.equal(buildSitemapXml('', []).includes('localhost'), false)

console.log('verify-sitemap: ok')
