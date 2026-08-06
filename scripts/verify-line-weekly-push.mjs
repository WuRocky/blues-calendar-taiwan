import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import jitiFactory from 'jiti'

dayjs.extend(utc)
dayjs.extend(timezone)

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const { selectWeeklyEvents, getTaipeiWeekRange } = jiti('../lib/events/weeklyEvents.ts')
const { formatWeeklyEventsMessage } = jiti('../lib/line/formatWeeklyEventsMessage.ts')
const { verifyJobAuthorization } = jiti('../lib/line/verifyJobAuthorization.ts')

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

const now = dayjs.tz('2026-08-06 12:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Taipei')
const weekRange = getTaipeiWeekRange(now)

const events = [
  makeEvent({ id: 'weekly-class', slug: 'weekly-class', eventType: 'class', name: 'Blues 初級課', startTime: '2026-08-05T12:00:00.000Z', endTime: '2026-08-05T14:00:00.000Z', venueName: 'Space Mew', venueUrl: 'https://example.com/venue', registrationUrl: 'https://example.com/register', timeStatus: 'ongoing' }),
  makeEvent({ id: 'cross-week', slug: 'cross-week', eventType: 'social', name: 'Taipei Blues Social', startTime: '2026-08-02T16:00:00.000Z', endTime: '2026-08-08T15:00:00.000Z', venueName: 'Dance Hall', registrationUrl: '   ', timeStatus: 'ongoing' }),
  makeEvent({ id: 'ended-last-week', slug: 'ended-last-week', eventType: 'event', name: 'Past Event', startTime: '2026-07-31T12:00:00.000Z', endTime: '2026-08-02T12:00:00.000Z', timeStatus: 'ended' }),
  makeEvent({ id: 'next-week', slug: 'next-week', eventType: 'workshop', name: 'Next Week Workshop', startTime: '2026-08-10T12:00:00.000Z', endTime: '2026-08-10T14:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent({ id: 'pending', slug: 'pending', status: 'Pending', name: 'Pending Event', startTime: '2026-08-08T12:00:00.000Z', endTime: '2026-08-08T14:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent({ id: 'no-end', slug: 'no-end', eventType: 'social', name: 'No End Social', startTime: '2026-08-09T11:30:00.000Z', endTime: null, venueName: '', venueUrl: 'https://example.com/no-end-venue', registrationUrl: 'notaurl', timeStatus: 'upcoming' }),
  makeEvent({ id: 'unscheduled', slug: 'unscheduled', eventType: 'class', recurring: true, startTime: null, endTime: null, timeStatus: 'unscheduled' }),
  makeEvent({ id: 'invalid', slug: 'invalid', eventType: 'event', startTime: null, endTime: null, timeStatus: 'invalid' })
]

const weeklyEvents = selectWeeklyEvents(events, now)
assert.deepEqual(weeklyEvents.map(event => event.id), ['cross-week', 'weekly-class', 'no-end'])

const noEventsMessage = formatWeeklyEventsMessage({
  weekStart: weekRange.start,
  weekEnd: weekRange.end,
  events: []
})
assert.equal(noEventsMessage, '本週暫無 Blues 活動 💙')

const weeklyMessage = formatWeeklyEventsMessage({
  weekStart: weekRange.start,
  weekEnd: weekRange.end,
  events: weeklyEvents
})

assert.match(weeklyMessage, /^💙 本週 Blues 活動/)
assert.match(weeklyMessage, /8\/3（一）－8\/9（日）/)
assert.match(weeklyMessage, /8\/5（三） 20:00/)
assert.match(weeklyMessage, /【Class】Blues 初級課/)
assert.match(weeklyMessage, /📍 Space Mew/)
assert.match(weeklyMessage, /地點：https:\/\/example\.com\/venue/)
assert.match(weeklyMessage, /🔗 活動連結\nhttps:\/\/example\.com\/register/)
assert.match(weeklyMessage, /📍 地點\nhttps:\/\/example\.com\/no-end-venue/)
assert.match(weeklyMessage, /【Social】No End Social/)
assert.doesNotMatch(weeklyMessage, /https:\/\/example\.com\/events\/weekly-class/)
assert.doesNotMatch(weeklyMessage, /https:\/\/example\.com\/events\/no-end/)
assert.doesNotMatch(weeklyMessage, /完整活動：/)
assert.doesNotMatch(weeklyMessage, /notaurl/)
assert.doesNotMatch(weeklyMessage, /undefined|null/)

assert.equal(verifyJobAuthorization({
  authorization: 'Bearer weekly-secret',
  lineJobSecret: 'weekly-secret'
}), true)
assert.equal(verifyJobAuthorization({
  authorization: 'Bearer wrong-secret',
  lineJobSecret: 'weekly-secret'
}), false)
assert.equal(verifyJobAuthorization({
  authorization: undefined,
  lineJobSecret: 'weekly-secret'
}), false)

console.log('verify-line-weekly-push: ok')
