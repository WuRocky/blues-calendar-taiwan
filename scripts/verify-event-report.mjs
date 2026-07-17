import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const {
  buildEventReportUrl,
  resolveTallyFormUrl
} = jiti('../lib/event-report.ts')

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
    startTime: null,
    endTime: null,
    startTimeIsDateOnly: false,
    endTimeIsDateOnly: false,
    venueName: '',
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

assert.deepEqual(resolveTallyFormUrl('https://tally.so/r/9qykLX'), {
  url: 'https://tally.so/r/9qykLX',
  warningReason: null
})

assert.deepEqual(resolveTallyFormUrl(''), {
  url: null,
  warningReason: 'missing form URL'
})

assert.deepEqual(resolveTallyFormUrl('https://example.com/form'), {
  url: null,
  warningReason: 'form URL must use tally.so'
})

assert.deepEqual(resolveTallyFormUrl('https://tally.so/forms/9qykLX'), {
  url: null,
  warningReason: 'form URL must target a Tally response form'
})

assert.deepEqual(resolveTallyFormUrl('not-a-url'), {
  url: null,
  warningReason: 'form URL is not a valid absolute URL'
})

const event = makeEvent({
  slug: 'taipei-blues-social',
  name: '台北 Blues Social & Jam / 測試（週六）'
})

const reportUrl = buildEventReportUrl(
  event,
  'https://tally.so/r/9qykLX?source=calendar',
  'https://blues.example.com/'
)

const parsedReportUrl = new URL(reportUrl)
assert.equal(parsedReportUrl.origin + parsedReportUrl.pathname, 'https://tally.so/r/9qykLX')
assert.equal(parsedReportUrl.searchParams.get('source'), 'calendar')
assert.equal(parsedReportUrl.searchParams.get('eventName'), '台北 Blues Social & Jam / 測試（週六）')
assert.equal(parsedReportUrl.searchParams.get('eventSlug'), 'taipei-blues-social')
assert.equal(parsedReportUrl.searchParams.get('eventUrl'), 'https://blues.example.com/events/taipei-blues-social')
assert.match(reportUrl, /%E5%8F%B0%E5%8C%97/)
assert.match(reportUrl, /https%3A%2F%2Fblues\.example\.com%2Fevents%2Ftaipei-blues-social/)

assert.equal(buildEventReportUrl(event, '', 'https://blues.example.com'), null)
assert.equal(buildEventReportUrl(event, 'https://example.com/form', 'https://blues.example.com'), null)
assert.equal(buildEventReportUrl(event, 'https://tally.so/r/9qykLX', '',), null)
assert.equal(buildEventReportUrl(event, 'https://tally.so/r/9qykLX', 'not-a-site-url'), null)
assert.equal(buildEventReportUrl(makeEvent({ slug: 'Bad Slug' }), 'https://tally.so/r/9qykLX', 'https://blues.example.com'), null)

console.log('verify-event-report: ok')
