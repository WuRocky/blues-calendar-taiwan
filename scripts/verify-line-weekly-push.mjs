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

const {
  selectWeeklyEvents,
  selectRemainingWeeklyEvents,
  selectNextWeeklyEvents,
  selectDailyEvents,
  getTaipeiWeekRange,
  getNextTaipeiWeekRange,
  getTaipeiDayRange,
  parseTaipeiDateInput
} = jiti('../lib/events/weeklyEvents.ts')
const { formatWeeklyEventsFlexMessage } = jiti('../lib/line/formatWeeklyEventsFlexMessage.ts')
const { formatOrganizerPreviewMessage } = jiti('../lib/line/formatOrganizerPreviewMessage.ts')
const { formatDailyEventsMessage } = jiti('../lib/line/formatDailyEventsMessage.ts')
const { verifyJobAuthorization } = jiti('../lib/line/verifyJobAuthorization.ts')
const { resolveLinePushDate } = jiti('../lib/line/resolveLinePushDate.ts')
const { getOrganizerLogoPath, getOrganizerLogoUrl } = jiti('../lib/events/organizerLogo.ts')

const testPushApi = fs.readFileSync(new URL('../server/api/line/test-push.post.ts', import.meta.url), 'utf8')
const weeklyPushApi = fs.readFileSync(new URL('../server/api/line/weekly-push.post.ts', import.meta.url), 'utf8')
const organizerPreviewApi = fs.readFileSync(new URL('../server/api/line/organizer-preview.post.ts', import.meta.url), 'utf8')
const dailyPushApi = fs.readFileSync(new URL('../server/api/line/daily-push.post.ts', import.meta.url), 'utf8')
const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
const wranglerConfig = fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
const cronPlugin = fs.readFileSync(new URL('../server/plugins/line-cron-test.ts', import.meta.url), 'utf8')

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

const now = dayjs.tz('2026-08-06 12:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Taipei')
const weekRange = getTaipeiWeekRange(now)
const nextWeekRange = getNextTaipeiWeekRange(now)
const dayRange = getTaipeiDayRange(now)
const siteUrl = 'https://blues-calendar-taiwan.example.com/'

const events = [
  makeEvent({ id: 'weekly-class', slug: 'weekly-class', eventType: 'class', name: 'Blues 初級課', startTime: '2026-08-05T12:00:00.000Z', endTime: '2026-08-05T14:00:00.000Z', venueName: 'Space Mew', venueUrl: 'https://example.com/venue', registrationUrl: 'https://example.com/register', timeStatus: 'ongoing', organizer: 'Blues20' }),
  makeEvent({ id: 'cross-week', slug: 'cross-week', eventType: 'social', name: 'Taipei Blues Social', startTime: '2026-08-02T16:00:00.000Z', endTime: '2026-08-08T15:00:00.000Z', venueName: 'Dance Hall', registrationUrl: '   ', timeStatus: 'ongoing', organizer: 'TapLife' }),
  makeEvent({ id: 'cross-next-week', slug: 'cross-next-week', eventType: 'social', name: 'Next Week Overlap', startTime: '2026-08-09T16:00:00.000Z', endTime: '2026-08-11T15:00:00.000Z', venueUrl: 'https://example.com/next-week-venue', registrationUrl: 'https://example.com/next-week-register', timeStatus: 'upcoming' }),
  makeEvent({ id: 'ended-last-week', slug: 'ended-last-week', eventType: 'event', name: 'Past Event', startTime: '2026-07-31T12:00:00.000Z', endTime: '2026-08-02T12:00:00.000Z', timeStatus: 'ended' }),
  makeEvent({ id: 'next-week', slug: 'next-week', eventType: 'workshop', name: 'Next Week Workshop', startTime: '2026-08-10T12:00:00.000Z', endTime: '2026-08-10T14:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent({ id: 'pending', slug: 'pending', status: 'Pending', name: 'Pending Event', startTime: '2026-08-08T12:00:00.000Z', endTime: '2026-08-08T14:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent({ id: 'no-end', slug: 'no-end', eventType: 'social', name: 'No End Social', startTime: '2026-08-09T11:30:00.000Z', endTime: null, venueName: '', venueUrl: 'https://example.com/no-end-venue', registrationUrl: 'notaurl', timeStatus: 'upcoming', organizer: 'find-your-blues' }),
  makeEvent({ id: 'today-event', slug: 'today-event', eventType: 'social', name: 'Today Event', startTime: '2026-08-06T12:00:00.000Z', endTime: '2026-08-06T14:00:00.000Z', venueName: 'Today Venue', venueUrl: 'http://example.com/today-venue', registrationUrl: 'https://example.com/today-register', timeStatus: 'ongoing' }),
  makeEvent({ id: 'today-cross-day', slug: 'today-cross-day', eventType: 'event', name: 'Today Cross Day', startTime: '2026-08-05T16:30:00.000Z', endTime: '2026-08-06T01:00:00.000Z', venueName: 'Late Venue', timeStatus: 'ongoing' }),
  makeEvent({ id: 'unscheduled', slug: 'unscheduled', eventType: 'class', recurring: true, startTime: null, endTime: null, timeStatus: 'unscheduled' }),
  makeEvent({ id: 'invalid', slug: 'invalid', eventType: 'event', startTime: null, endTime: null, timeStatus: 'invalid' }),
  makeEvent({ id: 'cancelled', slug: 'cancelled', eventType: 'social', eventStatus: 'cancelled', startTime: '2026-08-08T12:00:00.000Z', endTime: '2026-08-08T14:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent({ id: 'ended-yesterday', slug: 'ended-yesterday', eventType: 'social', name: 'Ended Yesterday', startTime: '2026-08-05T12:00:00.000Z', endTime: '2026-08-05T14:00:00.000Z', timeStatus: 'ended' }),
  makeEvent({ id: 'no-end-past-today', slug: 'no-end-past-today', eventType: 'social', name: 'No End Past Today', startTime: '2026-08-06T02:00:00.000Z', endTime: null, timeStatus: 'ongoing' })
]

const weeklyEvents = selectWeeklyEvents(events, now)
assert.deepEqual(weeklyEvents.map(event => event.id), ['cross-week', 'weekly-class', 'ended-yesterday', 'today-cross-day', 'no-end-past-today', 'today-event', 'no-end'])
const remainingWeeklyEvents = selectRemainingWeeklyEvents(events, now)
assert.deepEqual(remainingWeeklyEvents.map(event => event.id), ['cross-week', 'today-event', 'no-end'])
const nextWeeklyEvents = selectNextWeeklyEvents(events, now)
assert.deepEqual(nextWeeklyEvents.map(event => event.id), ['cross-next-week', 'next-week'])
const dailyEvents = selectDailyEvents(events, now)
assert.deepEqual(dailyEvents.map(event => event.id), ['cross-week', 'today-cross-day', 'no-end-past-today', 'today-event'])
assert.equal(weekRange.start.format('YYYY-MM-DD HH:mm:ss'), '2026-08-03 00:00:00')
assert.equal(weekRange.end.format('YYYY-MM-DD HH:mm:ss'), '2026-08-09 23:59:59')
assert.equal(nextWeekRange.start.format('YYYY-MM-DD HH:mm:ss'), '2026-08-10 00:00:00')
assert.equal(nextWeekRange.end.format('YYYY-MM-DD HH:mm:ss'), '2026-08-16 23:59:59')
assert.equal(dayRange.start.format('YYYY-MM-DD HH:mm:ss'), '2026-08-06 00:00:00')
assert.equal(dayRange.end.format('YYYY-MM-DD HH:mm:ss'), '2026-08-06 23:59:59')

const noEventsMessage = formatWeeklyEventsFlexMessage({
  weekStart: weekRange.start,
  weekEnd: weekRange.end,
  events: [],
  siteUrl
})
assert.equal(noEventsMessage.type, 'flex')
assert.equal(noEventsMessage.altText, '本週 Blues 活動 8/3(一) ～ 8/9(日)，共 0 場活動')
assert.equal(noEventsMessage.contents.type, 'bubble')
assert.equal(noEventsMessage.contents.body.contents[0].text, '💙 本週 Blues 活動')
assert.equal(noEventsMessage.contents.body.contents[1].text, '8/3(一) ～ 8/9(日)')
assert.equal(noEventsMessage.contents.body.contents[2].text, '本週暫無 Blues 活動 💙')

const weeklyMessage = formatWeeklyEventsFlexMessage({
  weekStart: weekRange.start,
  weekEnd: weekRange.end,
  events: weeklyEvents,
  siteUrl
})

assert.equal(weeklyMessage.type, 'flex')
assert.equal(weeklyMessage.altText, '本週 Blues 活動 8/3(一) ～ 8/9(日)，共 7 場活動')
assert.equal(weeklyMessage.contents.type, 'carousel')
assert.equal(weeklyMessage.contents.contents.length, 8)
assert.equal(weeklyMessage.contents.contents[0].body.contents[0].text, '💙 本週 Blues 活動')
assert.equal(weeklyMessage.contents.contents[0].body.contents[1].text, '8/3(一) ～ 8/9(日)')
assert.equal(weeklyMessage.contents.contents[0].body.contents[2].text, '本週共 7 場活動')
assert.equal(weeklyMessage.contents.contents[0].body.contents[3].text, '(一) Taipei Blues Social')
assert.equal(weeklyMessage.contents.contents[0].body.contents[4].text, '(三) Blues 初級課')
assert.equal(weeklyMessage.contents.contents[0].body.contents[5].text, '(三) Ended Yesterday')
assert.equal(weeklyMessage.contents.contents[0].body.contents[6].text, '(四) Today Cross Day')
assert.equal(weeklyMessage.contents.contents[0].body.contents[7].text, '(四) No End Past Today')
assert.equal(weeklyMessage.contents.contents[0].body.contents[8].text, '(四) Today Event')
assert.equal(weeklyMessage.contents.contents[0].body.contents[9].text, '(日) No End Social')
assert.equal(weeklyMessage.contents.contents[1].body.contents[0].text, '8/3（一） 00:00')
assert.equal(weeklyMessage.contents.contents[1].body.contents[1].contents[0].text, 'SOCIAL')
assert.equal(weeklyMessage.contents.contents[1].body.contents[2].text, 'Taipei Blues Social')
assert.equal(weeklyMessage.contents.contents[1].body.contents[3].contents[0].url, 'https://blues-calendar-taiwan.example.com/organizer-logos/taplife.png')
assert.equal('cornerRadius' in weeklyMessage.contents.contents[1].body.contents[3].contents[0], false)
assert.equal(weeklyMessage.contents.contents[1].body.contents[3].contents[1].text, 'TapLife')
assert.equal(weeklyMessage.contents.contents[1].body.contents[4].text, '📍 Dance Hall')
assert.equal(weeklyMessage.contents.contents[2].body.contents[0].text, '8/5（三） 20:00')
assert.equal(weeklyMessage.contents.contents[2].body.contents[1].contents[0].text, 'CLASS')
assert.equal(weeklyMessage.contents.contents[2].body.contents[2].text, 'Blues 初級課')
assert.equal(weeklyMessage.contents.contents[2].body.contents[3].contents[0].url, 'https://blues-calendar-taiwan.example.com/organizer-logos/blues20.png')
assert.equal('cornerRadius' in weeklyMessage.contents.contents[2].body.contents[3].contents[0], false)
assert.equal(weeklyMessage.contents.contents[2].body.contents[3].contents[1].text, 'Blues20')
assert.equal(weeklyMessage.contents.contents[2].body.contents[4].text, '📍 Space Mew')
assert.equal(weeklyMessage.contents.contents[2].footer.layout, 'horizontal')
assert.equal(weeklyMessage.contents.contents[2].footer.contents[0].action.label, '查看地點')
assert.equal(weeklyMessage.contents.contents[2].footer.contents[0].action.uri, 'https://example.com/venue')
assert.equal(weeklyMessage.contents.contents[2].footer.contents[1].action.label, '活動資訊')
assert.equal(weeklyMessage.contents.contents[2].footer.contents[1].action.uri, 'https://example.com/register')
assert.equal(weeklyMessage.contents.contents[7].body.contents[0].text, '8/9（日） 19:30')
assert.equal(weeklyMessage.contents.contents[7].body.contents[1].contents[0].text, 'SOCIAL')
assert.equal(weeklyMessage.contents.contents[7].body.contents[2].text, 'No End Social')
assert.equal(weeklyMessage.contents.contents[7].body.contents[3].contents[0].url, 'https://blues-calendar-taiwan.example.com/organizer-logos/find-your-blues.png')
assert.equal('cornerRadius' in weeklyMessage.contents.contents[7].body.contents[3].contents[0], false)
assert.equal(weeklyMessage.contents.contents[7].body.contents[3].contents[1].text, 'find-your-blues')
assert.equal(weeklyMessage.contents.contents[7].body.contents.length, 4)
assert.equal(weeklyMessage.contents.contents[7].footer.layout, 'vertical')
assert.equal(weeklyMessage.contents.contents[7].footer.contents[0].action.label, '查看地點')
assert.equal(weeklyMessage.contents.contents[7].footer.contents[0].action.uri, 'https://example.com/no-end-venue')

assert.equal(getOrganizerLogoPath('Blues20'), '/organizer-logos/blues20.png')
assert.equal(getOrganizerLogoPath('find-your-blues'), '/organizer-logos/find-your-blues.png')
assert.equal(getOrganizerLogoPath('TapLife'), '/organizer-logos/taplife.png')
assert.equal(getOrganizerLogoPath(' Unknown Organizer '), null)
assert.equal(getOrganizerLogoPath(''), null)
assert.equal(getOrganizerLogoUrl('Blues20', siteUrl), 'https://blues-calendar-taiwan.example.com/organizer-logos/blues20.png')
assert.equal(getOrganizerLogoUrl('TapLife', 'https://blues-calendar-taiwan.example.com'), 'https://blues-calendar-taiwan.example.com/organizer-logos/taplife.png')
assert.equal(getOrganizerLogoUrl('Unknown Organizer', siteUrl), null)

const organizerMessage = formatOrganizerPreviewMessage({
  weekStart: nextWeekRange.start,
  weekEnd: nextWeekRange.end,
  events: nextWeeklyEvents
})
assert.match(organizerMessage, /^📋 下週 Blues 活動確認/)
assert.match(organizerMessage, /8\/10（一）－8\/16（日）/)
assert.match(organizerMessage, /請有活動的主辦人協助確認：/)
assert.match(organizerMessage, /【Workshop】Next Week Workshop/)
assert.match(organizerMessage, /請於週日前完成資料修正，週一將發送至公共群組。/)
assert.doesNotMatch(organizerMessage, /完整活動：|workers\.dev/)

const organizerEmptyMessage = formatOrganizerPreviewMessage({
  weekStart: nextWeekRange.start,
  weekEnd: nextWeekRange.end,
  events: []
})
assert.match(organizerEmptyMessage, /下週目前暫無 Blues 活動，請確認是否有尚未登錄的活動。/)
assert.match(organizerEmptyMessage, /請於週日前完成資料修正，週一將發送至公共群組。/)

const dailyMessage = formatDailyEventsMessage({
  date: dayRange.start,
  events: dailyEvents
})
assert.match(dailyMessage, /^💙 今天的 Blues 活動｜8\/6（四）/)
assert.match(dailyMessage, /\n\n00:00\n【Social】Taipei Blues Social/)
assert.match(dailyMessage, /\n\n00:30\n【Event】Today Cross Day/)
assert.match(dailyMessage, /\n\n20:00\n【Social】Today Event/)
assert.match(dailyMessage, /地點：http:\/\/example\.com\/today-venue/)
assert.match(dailyMessage, /🔗 活動連結\nhttps:\/\/example\.com\/today-register/)
assert.doesNotMatch(dailyMessage, /workers\.dev|完整活動：/)

assert.equal(parseTaipeiDateInput('2026-08-08')?.format('YYYY-MM-DD'), '2026-08-08')
assert.equal(parseTaipeiDateInput('2026-8-8'), null)
assert.equal(resolveLinePushDate('2026-08-08')?.tz('Asia/Taipei').format('YYYY-MM-DD'), '2026-08-08')
assert.equal(resolveLinePushDate(['2026-08-08']), null)
assert.equal(resolveLinePushDate('bad-date'), null)

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

assert.match(testPushApi, /targetId: config\.lineLegacyGroupId/)
assert.match(organizerPreviewApi, /lineOrganizerGroupId: config\.lineOrganizerGroupId/)
assert.match(weeklyPushApi, /lineGroupId: config\.lineGroupId/)
assert.match(weeklyPushApi, /mode: 'remaining-week'/)
assert.match(fs.readFileSync(new URL('../server/api/line/test-weekly-push.post.ts', import.meta.url), 'utf8'), /mode: 'remaining-week'/)
assert.match(fs.readFileSync(new URL('../server/api/line/legacy-weekly-push.post.ts', import.meta.url), 'utf8'), /mode: 'remaining-week'/)
assert.match(dailyPushApi, /linePublicGroupId: config\.linePublicGroupId/)
assert.match(organizerPreviewApi, /Invalid date query/)
assert.match(dailyPushApi, /Invalid date query/)
assert.match(envExample, /NUXT_LINE_GROUP_ID=\nNUXT_LINE_LEGACY_GROUP_ID=\nNUXT_LINE_LEGACY_CHANNEL_ACCESS_TOKEN=\nNUXT_LINE_LEGACY_CHANNEL_SECRET=/)
assert.match(wranglerConfig, /"\*\/15 \* \* \* \*"/)
assert.match(cronPlugin, /LINE weekly cron started/)
assert.match(cronPlugin, /getWeeklyEvents/)
assert.match(cronPlugin, /formatWeeklyEventsFlexMessage/)
assert.match(cronPlugin, /NUXT_LINE_PUBLIC_GROUP_ID/)
assert.match(cronPlugin, /EVENT_SLUGS_CRON_EXPRESSION/)

console.log('verify-line-weekly-push: ok')
