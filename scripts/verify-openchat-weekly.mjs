import assert from 'node:assert/strict'
import fs from 'node:fs'
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

const { formatWeeklyOpenChatFeed } = jiti('../lib/openchat/formatWeeklyOpenChatFeed.ts')

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
    startTime: '2026-08-28T12:00:00.000Z',
    endTime: '2026-08-28T15:00:00.000Z',
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

const weekStart = dayjs.tz('2026-08-24 00:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Taipei')
const weekEnd = dayjs.tz('2026-08-30 23:59:59', 'YYYY-MM-DD HH:mm:ss', 'Asia/Taipei')
const siteUrl = 'https://blues-calendar-taiwan.example.com/'
const lineAddFriendUrl = 'https://line.me/R/ti/p/@blues-calendar'

const feed = formatWeeklyOpenChatFeed({
  weekStart,
  weekEnd,
  periodLabel: '本週',
  siteUrl,
  lineAddFriendUrl,
  events: [
    makeEvent({
      id: 'social-1',
      slug: 'taplife-social',
      name: 'TapLife 藍調時刻',
      venueName: 'TapLife',
      address: 'Taipei City',
      organizer: 'TapLife',
      registrationUrl: 'https://example.com/register',
      venueUrl: 'https://maps.example.com/taplife'
    }),
    makeEvent({
      id: 'workshop-1',
      slug: 'fyb-workshop',
      name: 'Find Your Blues Workshop',
      eventType: 'workshop',
      startTime: '2026-09-20T12:00:00.000Z',
      endTime: '2026-09-20T15:00:00.000Z',
      organizer: 'find-your-blues & Guest',
      venueName: 'Studio',
      registrationUrl: '',
      address: 'Kaohsiung'
    }),
    makeEvent({
      id: 'cross-day',
      slug: 'festival-cross-day',
      name: 'Festival Weekend',
      eventType: 'event',
      startTime: '2026-09-18T12:00:00.000Z',
      endTime: '2026-09-20T15:00:00.000Z',
      organizer: 'Blues20'
    })
  ]
})

assert.equal(feed.shouldPublish, true)
assert.equal(feed.publishDate, '2026-08-24')
assert.equal(feed.messageId, 'weekly-2026-08-24')
assert.equal(feed.week.label, '8/24（一）～ 8/30（日）')
assert.equal(feed.eventCount, 3)
assert.equal(feed.events[0].eventUrl, 'https://example.com/register')
assert.equal(feed.events[0].mapUrl, 'https://maps.example.com/taplife')
assert.equal(feed.events[0].organizerLogo, '/organizer-logos/taplife.png')
assert.equal(feed.events[1].eventUrl, 'https://blues-calendar-taiwan.example.com/events/fyb-workshop')
assert.equal(feed.events[1].organizerLogo, '/organizer-logos/find-your-blues.png')
assert.equal(feed.events[2].organizerLogo, '/organizer-logos/blues20.png')
assert.match(feed.text, /💙 本週 Blues 活動/)
assert.match(feed.text, /本週共 3 場活動/)
assert.match(feed.text, /🎵 TapLife 藍調時刻/)
assert.match(feed.text, /🎓 Find Your Blues Workshop/)
assert.match(feed.text, /💙 Festival Weekend/)
assert.match(feed.text, /👉 https:\/\/line\.me\/R\/ti\/p\/@blues-calendar/)
assert.doesNotMatch(feed.text, /undefined|null/)
assert.match(feed.text, /9\/18（五）20:00–9\/20（日）23:00/)

const noEventsFeed = formatWeeklyOpenChatFeed({
  weekStart,
  weekEnd,
  events: [],
  periodLabel: '本週',
  siteUrl,
  lineAddFriendUrl: ''
})

assert.equal(noEventsFeed.shouldPublish, false)
assert.equal(noEventsFeed.eventCount, 0)
assert.equal(noEventsFeed.text, '')

const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
assert.match(envExample, /^NUXT_PUBLIC_LINE_ADD_FRIEND_URL=/m)
assert.match(envExample, /^NUXT_OPENCHAT_JOB_SECRET=/m)

const routeSource = fs.readFileSync(new URL('../server/api/openchat/weekly.get.ts', import.meta.url), 'utf8')
assert.match(routeSource, /authorization/)
assert.match(routeSource, /openchatJobSecret/)

console.log('verify-openchat-weekly: ok')
