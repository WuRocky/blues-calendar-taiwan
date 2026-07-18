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
const {
  TAIPEI_TIMEZONE,
  evaluateEventTime,
  isRegularClass,
  shouldDisplayCalendarEvent,
  shouldDisplayPublicEvent,
  sortRegularClasses,
  sortEventsByDisplayPriority,
  withEventTimeStatus
} = jiti('../lib/event-time.ts')

const now = dayjs.tz('2026-07-16 12:00:00', 'YYYY-MM-DD HH:mm:ss', TAIPEI_TIMEZONE)

function makeEvent(overrides) {
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
    ...overrides
  }
}

const statusCases = [
  ['tomorrow-start', 'upcoming', { startTime: '2026-07-17T01:00:00.000Z', endTime: null }],
  ['one-hour-later', 'upcoming', { startTime: '2026-07-16T05:00:00.000Z', endTime: null }],
  ['ongoing-range', 'ongoing', { startTime: '2026-07-16T02:00:00.000Z', endTime: '2026-07-16T05:00:00.000Z' }],
  ['ended-yesterday', 'ended', { startTime: '2026-07-15T01:00:00.000Z', endTime: '2026-07-15T03:00:00.000Z' }],
  ['end-equals-now', 'ongoing', { startTime: '2026-07-16T01:00:00.000Z', endTime: '2026-07-16T04:00:00.000Z' }],
  ['no-end-today', 'ongoing', { startTime: '2026-07-16T00:00:00.000Z', endTime: null }],
  ['no-end-yesterday', 'ended', { startTime: '2026-07-15T00:00:00.000Z', endTime: null }],
  ['no-end-tomorrow', 'upcoming', { startTime: '2026-07-17T00:00:00.000Z', endTime: null }],
  ['unscheduled-class', 'unscheduled', { eventType: 'class', startTime: null, endTime: null }],
  ['unscheduled-recurring', 'unscheduled', { recurring: true, startTime: null, endTime: null }],
  ['missing-start', 'invalid', { startTime: null, endTime: null }],
  ['social-missing-start', 'invalid', { eventType: 'social', startTime: null, endTime: null }],
  ['workshop-missing-start', 'invalid', { eventType: 'workshop', startTime: null, endTime: null }],
  ['invalid-end-format', 'invalid', { startTime: '2026-07-16T01:00:00.000Z', endTime: 'bad-end' }],
  ['end-before-start', 'invalid', { startTime: '2026-07-16T05:00:00.000Z', endTime: '2026-07-16T04:59:59.000Z' }],
  ['taipei-midnight-same-day', 'ongoing', { startTime: '2026-07-15T16:00:00.000Z', endTime: null }]
]

for (const [name, expected, event] of statusCases) {
  const actual = evaluateEventTime(event, now).timeStatus
  assert.equal(actual, expected, `${name}: expected ${expected}, got ${actual}`)
}

assert.equal(shouldDisplayPublicEvent(withEventTimeStatus(makeEvent({
  id: 'ongoing-visible',
  slug: 'ongoing-visible',
  name: 'Ongoing Visible',
  startTime: '2026-07-16T02:00:00.000Z',
  endTime: '2026-07-16T05:00:00.000Z'
}), now)), true)

assert.equal(shouldDisplayPublicEvent(withEventTimeStatus(makeEvent({
  id: 'ended-hidden',
  slug: 'ended-hidden',
  name: 'Ended Hidden',
  startTime: '2026-07-15T01:00:00.000Z',
  endTime: '2026-07-15T03:00:00.000Z'
}), now)), false)

const unscheduledClass = withEventTimeStatus(makeEvent({
  id: 'unscheduled-class',
  slug: 'unscheduled-class',
  name: 'Unscheduled Class',
  eventType: 'class',
  startTime: null,
  endTime: null
}), now)

assert.equal(isRegularClass(unscheduledClass), true)
assert.equal(shouldDisplayPublicEvent(unscheduledClass), true)
assert.equal(shouldDisplayCalendarEvent(unscheduledClass), false)
assert.equal(unscheduledClass.timeStatus, 'unscheduled')

const sorted = sortEventsByDisplayPriority([
  withEventTimeStatus(makeEvent({
    id: 'next-week',
    slug: 'next-week',
    name: 'Next Week',
    startTime: '2026-07-23T01:00:00.000Z'
  }), now),
  withEventTimeStatus(makeEvent({
    id: 'ongoing',
    slug: 'ongoing',
    name: 'Ongoing',
    startTime: '2026-07-16T02:00:00.000Z',
    endTime: '2026-07-16T05:00:00.000Z'
  }), now),
  withEventTimeStatus(makeEvent({
    id: 'one-hour-later',
    slug: 'one-hour-later',
    name: 'One Hour Later',
    startTime: '2026-07-16T05:00:00.000Z'
  }), now)
]).map(event => event.slug)

assert.deepEqual(sorted, ['ongoing', 'one-hour-later', 'next-week'])

const regularClassOrder = sortRegularClasses([
  makeEvent({
    id: 'weekday-null',
    slug: 'weekday-null',
    eventType: 'class',
    organizer: 'Zulu',
    name: 'No Weekday',
    weekday: null,
    weekdayOrder: null
  }),
  makeEvent({
    id: 'weekday-2-b',
    slug: 'weekday-2-b',
    eventType: 'class',
    organizer: 'Bravo',
    name: 'Beta',
    weekday: '週二',
    weekdayOrder: 2
  }),
  makeEvent({
    id: 'weekday-1-a',
    slug: 'weekday-1-a',
    eventType: 'class',
    organizer: 'Alpha',
    name: 'Alpha',
    weekday: '週一',
    weekdayOrder: 1
  }),
  makeEvent({
    id: 'weekday-2-a',
    slug: 'weekday-2-a',
    eventType: 'class',
    organizer: 'Alpha',
    name: 'Gamma',
    weekday: '週二',
    weekdayOrder: 2
  })
]).map(event => event.slug)

assert.deepEqual(regularClassOrder, ['weekday-1-a', 'weekday-2-b', 'weekday-2-a', 'weekday-null'])

console.log('verify-event-time: ok')
