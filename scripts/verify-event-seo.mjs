import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, { alias: { '~~': projectRoot } })
const {
  buildEventJsonLd,
  buildEventSeoDescription,
  buildEventSeoTitle,
  buildLocaleAlternates,
  buildLocalizedEventUrl,
  cleanSeoDescription,
  resolveSeoImage
} = jiti('../lib/event-seo.ts')

function makeEvent(overrides = {}) {
  return {
    id: 'event',
    slug: 'taipei-blues-social',
    name: '台北 Blues Social',
    status: 'Published',
    eventStatus: 'scheduled',
    eventType: 'social',
    summary: '活動摘要優先。',
    description: '很長的完整說明。',
    startTime: '2026-08-01T11:00:00.000Z',
    endTime: '2026-08-01T14:00:00.000Z',
    startTimeIsDateOnly: false,
    endTimeIsDateOnly: false,
    venueName: 'Dance Hall',
    venueUrl: '',
    address: 'Taipei',
    city: '台北',
    organizer: 'Blues TW',
    weekday: null,
    weekdayOrder: null,
    price: '',
    level: '',
    registrationUrl: '',
    coverImageUrl: '',
    recurring: false,
    recurringText: '',
    published: true,
    timeStatus: 'upcoming',
    ...overrides
  }
}

const siteUrl = 'https://blues.example'
const scheduled = makeEvent()
assert.equal(buildEventSeoTitle(scheduled, 'zh-TW'), '台北 Blues Social｜Blues Calendar Taiwan')
assert.equal(buildEventSeoDescription(scheduled, 'zh-TW'), '活動摘要優先。')
assert.equal(buildLocalizedEventUrl(siteUrl, 'en', scheduled.slug), 'https://blues.example/en/events/taipei-blues-social')
assert.equal(resolveSeoImage(siteUrl, 'https://images.example/cover.jpg'), 'https://images.example/cover.jpg')
assert.equal(resolveSeoImage(siteUrl, 'bad url'), 'https://blues.example/bad%20url')
assert.equal(resolveSeoImage(siteUrl, 'http://images.example/cover.jpg'), 'https://blues.example/images/og-default.png')
assert.equal(resolveSeoImage(siteUrl, ''), 'https://blues.example/images/og-default.png')
assert.equal(cleanSeoDescription(`第一行\n第二行 ${'字'.repeat(180)}`).length <= 160, true)

const fallback = makeEvent({ summary: '', description: '', eventType: 'class', city: '台中', organizer: 'ABC' })
assert.equal(buildEventSeoDescription(fallback, 'zh-TW'), 'Blues 課程・台中・ABC')

const cancelled = makeEvent({ eventStatus: 'cancelled' })
assert.match(buildEventSeoTitle(cancelled, 'zh-TW'), /^【已取消】/)
assert.equal(buildEventJsonLd(cancelled, siteUrl, 'zh-TW').eventStatus, 'https://schema.org/EventCancelled')

const postponed = makeEvent({ eventStatus: 'postponed' })
assert.match(buildEventSeoTitle(postponed, 'zh-TW'), /^【延期】/)
assert.equal(buildEventJsonLd(postponed, siteUrl, 'zh-TW').eventStatus, 'https://schema.org/EventPostponed')
assert.equal(buildEventJsonLd(scheduled, siteUrl, 'zh-TW').eventStatus, 'https://schema.org/EventScheduled')
assert.match(buildEventJsonLd(scheduled, siteUrl, 'zh-TW').startDate, /\+08:00$/)

const dateOnly = makeEvent({
  startTime: '2026-07-31T16:00:00.000Z',
  endTime: '2026-08-01T15:59:59.999Z',
  startTimeIsDateOnly: true,
  endTimeIsDateOnly: true
})
assert.equal(buildEventJsonLd(dateOnly, siteUrl, 'zh-TW').startDate, '2026-08-01')
assert.equal(buildEventJsonLd(makeEvent({ startTime: null, endTime: null, timeStatus: 'unscheduled', recurring: true }), siteUrl, 'zh-TW'), null)
assert.equal(buildLocaleAlternates(siteUrl, '/calendar').length, 4)
assert.equal(buildLocaleAlternates('', '/calendar').length, 0)

console.log('verify-event-seo: ok')
