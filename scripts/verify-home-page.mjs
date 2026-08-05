import assert from 'node:assert/strict'
import fs from 'node:fs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import jitiFactory from 'jiti'

dayjs.extend(utc); dayjs.extend(timezone)
const home = fs.readFileSync(new URL('../app/pages/index.vue', import.meta.url), 'utf8')
const footer = fs.readFileSync(new URL('../app/components/AppFooter.vue', import.meta.url), 'utf8')
const helper = fs.readFileSync(new URL('../lib/home-events.ts', import.meta.url), 'utf8')
const week = fs.readFileSync(new URL('../app/components/WeeklyEventCalendar.vue', import.meta.url), 'utf8')
const notion = fs.readFileSync(new URL('../lib/notion.ts', import.meta.url), 'utf8')
const weeklyApi = fs.readFileSync(new URL('../server/api/weekly-calendar-events.get.ts', import.meta.url), 'utf8')
const localeFiles = ['zh-TW', 'en', 'ja', 'ko'].map(locale =>
  JSON.parse(fs.readFileSync(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
)
const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, { alias: { '~~': projectRoot } })
const { buildHomeWeek, selectDatedHomeCalendarEvents, selectWeeklyCalendarEvents } = jiti('../lib/home-events.ts')

function makeEvent(id, overrides = {}) {
  return {
    id,
    slug: id,
    name: id,
    status: 'Published',
    eventStatus: 'scheduled',
    eventType: 'event',
    summary: '',
    description: '',
    startTime: '2026-07-27T11:00:00.000Z',
    endTime: '2026-07-27T13:00:00.000Z',
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
    timeStatus: 'ended',
    ...overrides
  }
}

const now = dayjs.tz('2026-08-05 12:00', 'Asia/Taipei')
const fixtures = [
  makeEvent('monday-ongoing', { startTime: '2026-08-03T11:00:00.000Z', endTime: '2026-08-03T13:00:00.000Z', timeStatus: 'ongoing' }),
  makeEvent('wednesday-ongoing', { startTime: '2026-08-05T11:00:00.000Z', endTime: '2026-08-05T13:00:00.000Z', timeStatus: 'ongoing' }),
  makeEvent('friday-upcoming', { startTime: '2026-08-07T02:00:00.000Z', endTime: '2026-08-07T06:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('aug-8-featured', { slug: 'taplife-saturday-social-2026-08-08', name: 'TapLife Blues Social', startTime: '2026-08-08T12:00:00.000Z', endTime: '2026-08-08T15:00:00.000Z', timeStatus: 'upcoming', eventType: 'social' }),
  makeEvent('aug-8-date-only', { slug: 'taplife-saturday-social-date-only-2026-08-08', startTime: '2026-08-07T16:00:00.000Z', endTime: null, startTimeIsDateOnly: true, timeStatus: 'upcoming', eventType: 'social' }),
  makeEvent('aug-8-offset', { slug: 'taipei-timezone-2026-08-08', startTime: '2026-08-08T00:30:00.000Z', endTime: '2026-08-08T02:30:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('aug-8-hidden-1', { startTime: '2026-08-08T04:00:00.000Z', endTime: '2026-08-08T05:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('aug-8-hidden-2', { startTime: '2026-08-08T06:00:00.000Z', endTime: '2026-08-08T07:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('pending-hidden', { status: 'Pending', published: false, startTime: '2026-08-08T08:00:00.000Z', endTime: '2026-08-08T09:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('invalid-slug-hidden', { slug: 'TapLife-saturday-social-2026-08-08', startTime: '2026-08-08T10:00:00.000Z', endTime: '2026-08-08T11:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('invalid-end-before-start', { startTime: '2026-08-08T12:00:00.000Z', endTime: '2026-08-08T11:00:00.000Z', timeStatus: 'invalid' }),
  makeEvent('next-week', { startTime: '2026-08-10T02:00:00.000Z', endTime: '2026-08-10T04:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('last-week', { startTime: '2026-08-02T02:00:00.000Z', endTime: '2026-08-02T04:00:00.000Z', timeStatus: 'ended' }),
  makeEvent('previous-to-current-week', { startTime: '2026-08-02T12:00:00.000Z', endTime: '2026-08-03T04:00:00.000Z', timeStatus: 'ongoing' }),
  makeEvent('current-to-next-week', { startTime: '2026-08-09T12:00:00.000Z', endTime: '2026-08-10T04:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('invalid', { timeStatus: 'invalid' }),
  makeEvent('unscheduled-class', { eventType: 'class', recurring: true, recurringText: 'Every Monday', startTime: null, endTime: null, timeStatus: 'unscheduled' }),
  makeEvent('cancelled', { eventStatus: 'cancelled', startTime: '2026-08-08T13:00:00.000Z', endTime: '2026-08-08T15:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('postponed', { eventStatus: 'postponed', startTime: '2026-08-09T03:00:00.000Z', endTime: null, timeStatus: 'upcoming' })
]
const publicFixtures = fixtures.filter(event => event.published && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug))
const allDatedCalendarEvents = selectDatedHomeCalendarEvents(publicFixtures)
const weeklyCalendarEvents = selectWeeklyCalendarEvents(allDatedCalendarEvents, now)
const days = buildHomeWeek(weeklyCalendarEvents, now)
const idsFor = key => days.find(day => day.key === key)?.events.map(event => event.id) ?? []
const allIds = days.flatMap(day => day.events.map(event => event.id))
const saturdayEvents = idsFor('2026-08-08')

assert.deepEqual(days.map(day => day.key), ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09'])
assert.ok(idsFor('2026-08-03').includes('monday-ongoing'))
assert.ok(idsFor('2026-08-05').includes('wednesday-ongoing'))
assert.ok(idsFor('2026-08-07').includes('friday-upcoming'))
assert.ok(idsFor('2026-08-03').includes('previous-to-current-week'))
assert.ok(idsFor('2026-08-09').includes('current-to-next-week'))
assert.ok(saturdayEvents.includes('aug-8-featured'))
assert.ok(saturdayEvents.includes('aug-8-date-only'))
assert.ok(saturdayEvents.includes('aug-8-offset'))
assert.ok(saturdayEvents.includes('cancelled'))
assert.equal(days.find(day => day.key === '2026-08-08')?.key, '2026-08-08')
assert.equal(weeklyCalendarEvents.find(event => event.id === 'cancelled')?.eventStatus, 'cancelled')
assert.equal(weeklyCalendarEvents.find(event => event.id === 'postponed')?.eventStatus, 'postponed')
assert.ok(!allIds.includes('last-week'))
assert.ok(!allIds.includes('next-week'))
assert.ok(!allIds.includes('invalid'))
assert.ok(!allIds.includes('invalid-end-before-start'))
assert.ok(!allIds.includes('unscheduled-class'))
assert.ok(!allIds.includes('pending-hidden'))
assert.ok(!allIds.includes('invalid-slug-hidden'))
assert.ok(allDatedCalendarEvents.some(event => event.id === 'last-week'))
assert.ok(allDatedCalendarEvents.some(event => event.id === 'next-week'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'invalid'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'invalid-end-before-start'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'unscheduled-class'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'pending-hidden'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'invalid-slug-hidden'))
assert.ok(saturdayEvents.length > 3)
assert.ok(saturdayEvents.includes('aug-8-hidden-1'))
assert.ok(saturdayEvents.includes('aug-8-hidden-2'))

const firstKey = offset => buildHomeWeek(allDatedCalendarEvents, now.add(offset, 'week'))[0]?.key
assert.equal(firstKey(0), '2026-08-03')
assert.equal(firstKey(-1), '2026-07-27')
assert.equal(firstKey(-2), '2026-07-20')
assert.equal(firstKey(1), '2026-08-10')
assert.equal(firstKey(2), '2026-08-17')
assert.equal(buildHomeWeek(allDatedCalendarEvents, now.subtract(1, 'week')).flatMap(day => day.events).some(event => event.id === 'last-week'), true)
assert.equal(buildHomeWeek(allDatedCalendarEvents, now.add(1, 'week')).flatMap(day => day.events).some(event => event.id === 'next-week'), true)
assert.equal(buildHomeWeek(allDatedCalendarEvents, now.add(8, 'week')).flatMap(day => day.events).length, 0)

assert.match(helper, /event\.timeStatus === 'invalid' \|\| event\.timeStatus === 'unscheduled'/)
assert.match(helper, /!eventRange\.start\.isAfter\(weekEnd\)/)
assert.match(helper, /!eventRange\.end\.isBefore\(weekStart\)/)
assert.doesNotMatch(helper, /shouldDisplayCalendarEvent\(event\).*continue/)
assert.match(helper, /startTime.*localeCompare/)
assert.match(helper, /slice\(0, 2\)/)
assert.match(week, /getDefaultHomeDayKey/)
assert.match(week, /aria-pressed/)
assert.match(week, /eventStatus/)
assert.match(week, /'is-ended'/)
assert.match(week, /event\.timeStatus === 'ended' \? 'ended'/)
assert.match(week, /selectedDay\.events/)
assert.match(week, /const weekOffset = ref\(0\)/)
assert.match(week, /const previousWeek = \(\) => \{ weekOffset\.value -= 1 \}/)
assert.match(week, /const nextWeek = \(\) => \{ weekOffset\.value \+= 1 \}/)
assert.match(week, /const returnToCurrentWeek = \(\) => \{ weekOffset\.value = 0 \}/)
assert.match(week, /const rangeLabel = computed\(\(\) => weekOffset\.value === 0/)
assert.match(week, /currentWeekRange/)
assert.match(week, /v-if="weekOffset !== 0"/)
assert.doesNotMatch(week, /:disabled="weekOffset === 0"/)
assert.doesNotMatch(week, /home\.weeklyCalendar\.(?:emptyWeek|emptyDay)/)
assert.match(week, /class="week-actions"[\s\S]*<NuxtLink :to="localePath\('calendar'\)"/)
assert.match(week, /\.week-navigation\{min-height:96px\}/)
assert.match(week, /\.desktop-calendar\{min-height:290px\}/)
assert.match(week, /\.mobile-events\{min-height:230px/)
assert.deepEqual(localeFiles.map(messages => messages.home.weeklyCalendar.currentWeekRange), [
  '{range}（本週）',
  '{range} (This week)',
  '{range}（今週）',
  '{range} (이번 주)'
])
assert.match(week, /weekOffset\.value === 0[\s\S]+getDefaultHomeDayKey\(value\)[\s\S]+value\[0\]\?\.key/)
assert.match(week, /const days = displayedWeekDays/)
assert.doesNotMatch(week, /useFetch|\$fetch/)
assert.match(home, /data: weeklyCalendarEvents/)
assert.match(home, /\/api\/weekly-calendar-events/)
assert.match(home, /<WeeklyEventCalendar :events="weeklyCalendarEvents \?\? \[\]"/)
assert.doesNotMatch(home, /<WeeklyEventCalendar[^>]+:events="events \?\? \[\]"/)
assert.doesNotMatch(home, /upcomingEvents|recentEvents|visibleUpcomingEvents|futureEvents/)
assert.match(notion, /getHomeCalendarEvents/)
assert.match(notion, /selectDatedHomeCalendarEvents\(mappedEvents\)/)
assert.match(weeklyApi, /getHomeCalendarEvents/)
assert.doesNotMatch(home, /HomeEventCard|HomeRegularClassCard|submit-panel/)
assert.doesNotMatch(footer, /github/i)
assert.match(footer, /https:\/\/www\.instagram\.com\/rocky_wide\?igsh=MW1keTBld3ZpcXJpYg%3D%3D&amp;utm_source=qr|https:\/\/www\.instagram\.com\/rocky_wide\?igsh=MW1keTBld3ZpcXJpYg%3D%3D&utm_source=qr/)
assert.match(footer, /mailto:rockywu971@gmail\.com/)
assert.match(footer, /v-if="submissionUrl"/)
console.log('Home page verification passed.')
