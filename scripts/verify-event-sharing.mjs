import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const {
  buildEventShareText,
  buildEventShareTitle,
  buildEventShareUrl,
  buildLineShareUrl
} = jiti('../lib/event-sharing.ts')

const siteUrl = 'https://blues.example.com/'

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || overrides.slug || 'event',
    slug: overrides.slug || overrides.id || 'event',
    name: overrides.name || 'Event',
    status: 'Published',
    eventStatus: 'scheduled',
    eventType: 'event',
    summary: '',
    description: '',
    startTime: '2026-08-08T11:30:00.000Z',
    endTime: '2026-08-08T14:00:00.000Z',
    startTimeIsDateOnly: false,
    endTimeIsDateOnly: false,
    venueName: 'Space Mew',
    venueUrl: '',
    address: '',
    city: '',
    organizer: '',
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

const timedEvent = makeEvent({
  slug: 'taipei-blues-social',
  name: '台北 Blues Social',
  startTime: '2026-08-08T11:30:00.000Z',
  endTime: '2026-08-08T14:00:00.000Z',
  venueName: 'Space Mew'
})

assert.equal(buildEventShareTitle(timedEvent), '台北 Blues Social')
assert.equal(buildEventShareUrl(timedEvent, siteUrl), 'https://blues.example.com/events/taipei-blues-social')

const timedShareText = buildEventShareText(timedEvent, siteUrl)
assert.equal(
  timedShareText,
  [
    '台北 Blues Social',
    '2026/08/08（六）19:30–22:00',
    'Space Mew',
    'https://blues.example.com/events/taipei-blues-social'
  ].join('\n')
)

const timedLineShareUrl = buildLineShareUrl(timedEvent, siteUrl)
const parsedLineUrl = new URL(timedLineShareUrl)
assert.equal(parsedLineUrl.origin + parsedLineUrl.pathname, 'https://social-plugins.line.me/lineit/share')
assert.equal(parsedLineUrl.searchParams.get('text'), timedShareText)
assert.match(timedLineShareUrl, /%E5%8F%B0%E5%8C%97/)
assert.match(timedLineShareUrl, /https%3A%2F%2Fblues\.example\.com%2Fevents%2Ftaipei-blues-social/)

const recurringEvent = makeEvent({
  slug: 'weekly-class',
  name: '每週常態課',
  eventType: 'class',
  startTime: null,
  endTime: null,
  weekday: '週三',
  recurringText: '每週三 19:30 開課',
  venueName: 'Dance Lab'
})

assert.equal(
  buildEventShareText(recurringEvent, siteUrl),
  [
    '每週常態課',
    '週三 每週三 19:30 開課',
    'Dance Lab',
    'https://blues.example.com/events/weekly-class'
  ].join('\n')
)

const minimalEvent = makeEvent({
  slug: 'minimal',
  name: '只有網址',
  startTime: null,
  endTime: null,
  venueName: '',
  address: '',
  weekday: null,
  recurringText: ''
})

assert.equal(
  buildEventShareText(minimalEvent, siteUrl),
  [
    '只有網址',
    'https://blues.example.com/events/minimal'
  ].join('\n')
)

const addressFallbackEvent = makeEvent({
  slug: 'special-chars',
  name: '中文 & 特殊字元 / 活動',
  venueName: '',
  address: '台北市大安區和平東路'
})

assert.match(buildEventShareText(addressFallbackEvent, siteUrl) || '', /台北市大安區和平東路/)

assert.equal(buildEventShareUrl(timedEvent, 'not-a-valid-url'), null)
assert.equal(buildEventShareText(timedEvent, 'not-a-valid-url'), null)
assert.equal(buildLineShareUrl(timedEvent, 'not-a-valid-url'), null)
assert.equal(buildEventShareUrl(makeEvent({ slug: '' }), siteUrl), null)

console.log('verify-event-sharing: ok')
