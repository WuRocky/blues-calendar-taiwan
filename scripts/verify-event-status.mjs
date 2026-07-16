import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})
const {
  getEventDisplayStatus,
  getEventDisplayStatusLabel,
  getEventRegistrationNotice,
  isEventRegistrationUnavailable,
  normalizeEventStatus
} = jiti('../lib/event-status.ts')
const {
  shouldDisplayCalendarEvent,
  shouldDisplayPublicEvent
} = jiti('../lib/event-time.ts')

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

assert.deepEqual(normalizeEventStatus('Scheduled'), {
  eventStatus: 'scheduled',
  warningReason: null
})

assert.deepEqual(normalizeEventStatus('Cancelled'), {
  eventStatus: 'cancelled',
  warningReason: null
})

assert.deepEqual(normalizeEventStatus('Postponed'), {
  eventStatus: 'postponed',
  warningReason: null
})

assert.deepEqual(normalizeEventStatus(''), {
  eventStatus: 'scheduled',
  warningReason: 'missing Event Status'
})

assert.deepEqual(normalizeEventStatus('Rescheduled'), {
  eventStatus: 'scheduled',
  warningReason: 'unknown Event Status "Rescheduled"'
})

const cancelledUpcoming = makeEvent({
  eventStatus: 'cancelled',
  timeStatus: 'upcoming'
})

assert.equal(shouldDisplayPublicEvent(cancelledUpcoming), true)
assert.equal(shouldDisplayCalendarEvent(cancelledUpcoming), true)
assert.equal(getEventDisplayStatus(cancelledUpcoming), 'cancelled')
assert.equal(getEventDisplayStatusLabel(getEventDisplayStatus(cancelledUpcoming)), '已取消')
assert.equal(isEventRegistrationUnavailable(cancelledUpcoming), true)
assert.equal(getEventRegistrationNotice(cancelledUpcoming), '此活動已取消')

const postponedUpcoming = makeEvent({
  eventStatus: 'postponed',
  timeStatus: 'upcoming'
})

assert.equal(shouldDisplayPublicEvent(postponedUpcoming), true)
assert.equal(shouldDisplayCalendarEvent(postponedUpcoming), true)
assert.equal(getEventDisplayStatus(postponedUpcoming), 'postponed')
assert.equal(getEventDisplayStatusLabel(getEventDisplayStatus(postponedUpcoming)), '已延期')
assert.equal(isEventRegistrationUnavailable(postponedUpcoming), true)
assert.equal(getEventRegistrationNotice(postponedUpcoming), '此活動已延期，請等待主辦單位更新資訊')

const cancelledOngoing = makeEvent({
  eventStatus: 'cancelled',
  timeStatus: 'ongoing'
})

assert.equal(getEventDisplayStatus(cancelledOngoing), 'cancelled')

const postponedOngoing = makeEvent({
  eventStatus: 'postponed',
  timeStatus: 'ongoing'
})

assert.equal(getEventDisplayStatus(postponedOngoing), 'postponed')

const scheduledOngoing = makeEvent({
  eventStatus: 'scheduled',
  timeStatus: 'ongoing'
})

assert.equal(getEventDisplayStatus(scheduledOngoing), 'ongoing')
assert.equal(getEventDisplayStatusLabel(getEventDisplayStatus(scheduledOngoing)), '進行中')
assert.equal(isEventRegistrationUnavailable(scheduledOngoing), false)
assert.equal(getEventRegistrationNotice(scheduledOngoing), '')

const cancelledEnded = makeEvent({
  eventStatus: 'cancelled',
  timeStatus: 'ended'
})

assert.equal(shouldDisplayPublicEvent(cancelledEnded), false)
assert.equal(shouldDisplayCalendarEvent(cancelledEnded), false)

const postponedEnded = makeEvent({
  eventStatus: 'postponed',
  timeStatus: 'ended'
})

assert.equal(shouldDisplayPublicEvent(postponedEnded), false)
assert.equal(shouldDisplayCalendarEvent(postponedEnded), false)

const cancelledUnscheduledClass = makeEvent({
  eventStatus: 'cancelled',
  eventType: 'class',
  timeStatus: 'unscheduled'
})

assert.equal(shouldDisplayPublicEvent(cancelledUnscheduledClass), true)
assert.equal(shouldDisplayCalendarEvent(cancelledUnscheduledClass), false)
assert.equal(getEventDisplayStatus(cancelledUnscheduledClass), 'cancelled')

const postponedUnscheduledRecurring = makeEvent({
  eventStatus: 'postponed',
  recurring: true,
  timeStatus: 'unscheduled'
})

assert.equal(shouldDisplayPublicEvent(postponedUnscheduledRecurring), true)
assert.equal(shouldDisplayCalendarEvent(postponedUnscheduledRecurring), false)
assert.equal(getEventDisplayStatus(postponedUnscheduledRecurring), 'postponed')

console.log('verify-event-status: ok')
