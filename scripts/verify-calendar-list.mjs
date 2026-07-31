import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const {
  isRegularClass,
  isUnscheduledRegularClass,
  shouldDisplayCalendarListEvent,
  shouldDisplayClassCalendarEvent,
  sortRegularClasses
} = jiti('../lib/event-time.ts')

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || overrides.slug || 'event',
    slug: overrides.slug || overrides.id || 'event',
    name: overrides.name || 'Event',
    status: 'published',
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

const validRegularClass = makeEvent({
  id: 'valid-regular-class',
  slug: 'valid-regular-class',
  name: 'Valid Regular Class',
  eventType: 'class',
  recurring: true,
  startTime: null,
  endTime: null,
  timeStatus: 'unscheduled',
  status: 'published',
  eventStatus: 'scheduled',
  weekday: 'Tuesday',
  weekdayOrder: 2,
  recurringText: 'Every Tuesday'
})

const workshopUnscheduled = makeEvent({
  id: 'workshop-unscheduled',
  slug: 'workshop-unscheduled',
  name: 'Workshop Unscheduled',
  eventType: 'workshop',
  recurring: false,
  startTime: null,
  endTime: null,
  timeStatus: 'unscheduled',
  status: 'published',
  eventStatus: 'scheduled'
})

const socialUnscheduled = makeEvent({
  id: 'social-unscheduled',
  slug: 'social-unscheduled',
  name: 'Social Unscheduled',
  eventType: 'social',
  recurring: false,
  startTime: null,
  endTime: null,
  timeStatus: 'unscheduled',
  status: 'published',
  eventStatus: 'scheduled'
})

const eventUnscheduled = makeEvent({
  id: 'event-unscheduled',
  slug: 'event-unscheduled',
  name: 'Event Unscheduled',
  eventType: 'event',
  recurring: false,
  startTime: null,
  endTime: null,
  timeStatus: 'unscheduled',
  status: 'published',
  eventStatus: 'scheduled'
})

const endedClass = makeEvent({
  id: 'ended-class',
  slug: 'ended-class',
  name: 'Ended Class',
  eventType: 'class',
  recurring: true,
  startTime: '2026-07-15T01:00:00.000Z',
  endTime: '2026-07-15T03:00:00.000Z',
  timeStatus: 'ended',
  status: 'published',
  eventStatus: 'scheduled'
})

const invalidClass = makeEvent({
  id: 'invalid-class',
  slug: 'invalid-class',
  name: 'Invalid Class',
  eventType: 'class',
  recurring: true,
  startTime: null,
  endTime: null,
  timeStatus: 'invalid',
  status: 'published',
  eventStatus: 'scheduled'
})

const incompleteNonRecurringClass = makeEvent({
  id: 'incomplete-non-recurring-class',
  slug: 'incomplete-non-recurring-class',
  name: 'Incomplete Non-recurring Class',
  eventType: 'class',
  recurring: false,
  startTime: null,
  endTime: null,
  timeStatus: 'unscheduled',
  status: 'published',
  eventStatus: 'scheduled'
})

assert.equal(isRegularClass(validRegularClass), true)
assert.equal(isUnscheduledRegularClass(validRegularClass), true)
assert.equal(shouldDisplayCalendarListEvent(validRegularClass), true)
assert.equal(shouldDisplayClassCalendarEvent(validRegularClass), true)

assert.equal(shouldDisplayCalendarListEvent(workshopUnscheduled), false)
assert.equal(shouldDisplayCalendarListEvent(socialUnscheduled), false)
assert.equal(shouldDisplayCalendarListEvent(eventUnscheduled), false)
assert.equal(shouldDisplayClassCalendarEvent(workshopUnscheduled), false)
assert.equal(shouldDisplayClassCalendarEvent(socialUnscheduled), false)
assert.equal(shouldDisplayClassCalendarEvent(eventUnscheduled), false)

assert.equal(shouldDisplayCalendarListEvent(endedClass), false)
assert.equal(shouldDisplayClassCalendarEvent(endedClass), false)
assert.equal(shouldDisplayCalendarListEvent(invalidClass), false)
assert.equal(shouldDisplayClassCalendarEvent(invalidClass), false)
assert.equal(shouldDisplayCalendarListEvent(incompleteNonRecurringClass), false)
assert.equal(shouldDisplayClassCalendarEvent(incompleteNonRecurringClass), false)

const sortedRegularClasses = sortRegularClasses([
  makeEvent({ id: 'weekday-null', slug: 'weekday-null', eventType: 'class', recurring: true, name: 'No Weekday', weekday: null, weekdayOrder: null, organizer: 'Zulu' }),
  makeEvent({ id: 'weekday-2-b', slug: 'weekday-2-b', eventType: 'class', recurring: true, name: 'Beta', weekday: 'Tuesday', weekdayOrder: 2, organizer: 'Bravo' }),
  makeEvent({ id: 'weekday-1-a', slug: 'weekday-1-a', eventType: 'class', recurring: true, name: 'Alpha', weekday: 'Monday', weekdayOrder: 1, organizer: 'Alpha' }),
  makeEvent({ id: 'weekday-2-a', slug: 'weekday-2-a', eventType: 'class', recurring: true, name: 'Gamma', weekday: 'Tuesday', weekdayOrder: 2, organizer: 'Alpha' })
]).map((event) => event.slug)

assert.deepEqual(sortedRegularClasses, ['weekday-1-a', 'weekday-2-b', 'weekday-2-a', 'weekday-null'])

console.log('verify-calendar-list: ok')
