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

const now = dayjs.tz('2026-08-01 12:00', 'Asia/Taipei')
const fixtures = [
  makeEvent('monday-ended'),
  makeEvent('wednesday-ended', { startTime: '2026-07-29T11:00:00.000Z', endTime: '2026-07-29T13:00:00.000Z' }),
  makeEvent('today', { startTime: '2026-08-01T02:00:00.000Z', endTime: '2026-08-01T06:00:00.000Z', timeStatus: 'ongoing' }),
  makeEvent('future', { startTime: '2026-08-02T02:00:00.000Z', endTime: '2026-08-02T04:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('last-week', { startTime: '2026-07-25T02:00:00.000Z', endTime: '2026-07-25T04:00:00.000Z' }),
  makeEvent('next-week', { startTime: '2026-08-03T02:00:00.000Z', endTime: '2026-08-03T04:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('previous-to-current-week', { startTime: '2026-07-26T12:00:00.000Z', endTime: '2026-07-27T04:00:00.000Z' }),
  makeEvent('current-to-next-week', { startTime: '2026-08-02T12:00:00.000Z', endTime: '2026-08-03T04:00:00.000Z', timeStatus: 'upcoming' }),
  makeEvent('invalid', { timeStatus: 'invalid' }),
  makeEvent('unscheduled-class', { eventType: 'class', recurring: true, recurringText: 'Every Monday', startTime: null, endTime: null, timeStatus: 'unscheduled' }),
  makeEvent('cancelled', { eventStatus: 'cancelled' }),
  makeEvent('postponed', { eventStatus: 'postponed', startTime: '2026-08-02T03:00:00.000Z', endTime: null, timeStatus: 'upcoming' })
]
const allDatedCalendarEvents = selectDatedHomeCalendarEvents(fixtures)
const weeklyCalendarEvents = selectWeeklyCalendarEvents(allDatedCalendarEvents, now)
const days = buildHomeWeek(weeklyCalendarEvents, now)
const idsFor = key => days.find(day => day.key === key)?.events.map(event => event.id) ?? []
const allIds = days.flatMap(day => day.events.map(event => event.id))

assert.deepEqual(days.map(day => day.key), ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02'])
assert.ok(idsFor('2026-07-27').includes('monday-ended'))
assert.ok(idsFor('2026-07-29').includes('wednesday-ended'))
assert.ok(idsFor('2026-08-01').includes('today'))
assert.ok(idsFor('2026-08-02').includes('future'))
assert.ok(idsFor('2026-07-27').includes('previous-to-current-week'))
assert.ok(idsFor('2026-08-02').includes('current-to-next-week'))
assert.ok(idsFor('2026-07-27').includes('cancelled'))
assert.ok(idsFor('2026-08-02').includes('postponed'))
assert.equal(weeklyCalendarEvents.find(event => event.id === 'cancelled')?.eventStatus, 'cancelled')
assert.equal(weeklyCalendarEvents.find(event => event.id === 'postponed')?.eventStatus, 'postponed')
assert.ok(!allIds.includes('last-week'))
assert.ok(!allIds.includes('next-week'))
assert.ok(!allIds.includes('invalid'))
assert.ok(!allIds.includes('unscheduled-class'))
assert.ok(allDatedCalendarEvents.some(event => event.id === 'last-week'))
assert.ok(allDatedCalendarEvents.some(event => event.id === 'next-week'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'invalid'))
assert.ok(!allDatedCalendarEvents.some(event => event.id === 'unscheduled-class'))

const firstKey = offset => buildHomeWeek(allDatedCalendarEvents, now.add(offset, 'week'))[0]?.key
assert.equal(firstKey(0), '2026-07-27')
assert.equal(firstKey(-1), '2026-07-20')
assert.equal(firstKey(-2), '2026-07-13')
assert.equal(firstKey(1), '2026-08-03')
assert.equal(firstKey(2), '2026-08-10')
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
