import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import fs from 'node:fs'
import jitiFactory from 'jiti'

dayjs.extend(utc)
dayjs.extend(timezone)

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const { selectDailyEvents } = jiti('../lib/events/weeklyEvents.ts')
const { formatDailyEventsMessage } = jiti('../lib/line/formatDailyEventsMessage.ts')

const dailyPushApi = fs.readFileSync(new URL('../server/api/line/daily-push.post.ts', import.meta.url), 'utf8')
const cronPlugin = fs.readFileSync(new URL('../server/plugins/line-cron-test.ts', import.meta.url), 'utf8')
const wranglerConfig = fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || overrides.slug || 'event',
    slug: overrides.slug || overrides.id || 'event',
    name: overrides.name || 'Event',
    status: 'Published',
    eventStatus: 'scheduled',
    eventType: 'social',
    summary: '',
    description: '',
    scheduleType: 'Single',
    startTime: null,
    endTime: null,
    startTimeIsDateOnly: false,
    endTimeIsDateOnly: false,
    specificDates: '',
    venueName: '',
    venueUrl: '',
    address: '',
    city: '',
    country: '',
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

const now = dayjs.tz('2026-08-24 12:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Taipei')

const events = [
  makeEvent({
    id: 'same-day',
    slug: 'same-day',
    name: 'Same Day Event',
    startTime: '2026-08-24T12:00:00.000Z',
    endTime: '2026-08-24T14:00:00.000Z'
  }),
  makeEvent({
    id: 'cross-day',
    slug: 'cross-day',
    name: 'Cross Day Event',
    startTime: '2026-08-23T16:00:00.000Z',
    endTime: '2026-08-25T15:00:00.000Z',
    eventType: 'event'
  }),
  makeEvent({
    id: 'cancelled',
    slug: 'cancelled',
    name: 'Cancelled Event',
    startTime: '2026-08-24T10:00:00.000Z',
    endTime: '2026-08-24T12:00:00.000Z',
    eventStatus: 'cancelled'
  }),
  makeEvent({
    id: 'pending',
    slug: 'pending',
    name: 'Pending Event',
    startTime: '2026-08-24T09:00:00.000Z',
    endTime: '2026-08-24T10:00:00.000Z',
    status: 'Pending'
  }),
  makeEvent({
    id: 'next-day',
    slug: 'next-day',
    name: 'Next Day Event',
    startTime: '2026-08-25T12:00:00.000Z',
    endTime: '2026-08-25T14:00:00.000Z'
  })
]

assert.deepEqual(
  selectDailyEvents(events, now).map(event => event.id),
  ['cross-day', 'same-day']
)

const dailyMessage = formatDailyEventsMessage({
  date: now,
  events: selectDailyEvents(events, now)
})

assert.match(dailyMessage, /^💙 今天的 Blues 活動｜8\/24（一）/)
assert.match(dailyMessage, /【Event】Cross Day Event/)
assert.match(dailyMessage, /【Social】Same Day Event/)
assert.doesNotMatch(dailyMessage, /Cancelled Event|Pending Event|Next Day Event/)

assert.match(dailyPushApi, /lineChannelAccessToken: config\.lineChannelAccessToken/)
assert.match(dailyPushApi, /linePublicGroupId: config\.linePublicGroupId/)
assert.match(dailyPushApi, /No daily events to send/)
assert.match(dailyPushApi, /skipped: result\.skipped/)

assert.doesNotMatch(wranglerConfig, /"0 2 \* \* \*"/)
assert.match(cronPlugin, /const PRODUCTION_DAILY_CRON_EXPRESSION = '0 2 \* \* \*'/)
assert.match(cronPlugin, /LINE production daily cron started/)
assert.match(cronPlugin, /LINE production daily cron skipped: no daily events/)
assert.match(cronPlugin, /LINE production daily cron push sent/)

console.log('verify-line-public-daily: ok')
