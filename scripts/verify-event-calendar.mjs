import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const {
  buildEventDetailUrl,
  buildGoogleCalendarUrl,
  buildIcsContent,
  canAddEventToCalendar,
  getEventCalendarFilename
} = jiti('../lib/event-calendar.ts')

const siteUrl = 'https://blues.example.com'

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
    startTime: '2026-07-18T11:00:00.000Z',
    endTime: '2026-07-18T13:00:00.000Z',
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

const timedEvent = makeEvent({
  slug: 'taipei-social',
  name: 'Taipei Social',
  summary: 'Friday social dancing',
  organizer: 'Blue Monday',
  price: 'NT$300',
  registrationUrl: 'https://register.example.com',
  venueName: 'Blue Hall',
  address: 'Taipei City',
  startTime: '2026-07-18T11:00:00.000Z',
  endTime: '2026-07-18T13:00:00.000Z'
})

assert.equal(canAddEventToCalendar(timedEvent), true)
assert.equal(buildEventDetailUrl(siteUrl, timedEvent.slug), 'https://blues.example.com/events/taipei-social')

const googleUrl = new URL(buildGoogleCalendarUrl(timedEvent, siteUrl))
assert.equal(googleUrl.origin + googleUrl.pathname, 'https://calendar.google.com/calendar/render')
assert.equal(googleUrl.searchParams.get('action'), 'TEMPLATE')
assert.equal(googleUrl.searchParams.get('text'), 'Taipei Social')
assert.equal(googleUrl.searchParams.get('dates'), '20260718T110000Z/20260718T130000Z')
assert.equal(googleUrl.searchParams.get('ctz'), 'Asia/Taipei')
assert.match(googleUrl.searchParams.get('details') || '', /Organizer: Blue Monday/)
assert.match(googleUrl.searchParams.get('details') || '', /Registration: https:\/\/register\.example\.com/)
assert.match(googleUrl.searchParams.get('details') || '', /Details: https:\/\/blues\.example\.com\/events\/taipei-social/)
assert.equal(googleUrl.searchParams.get('location'), 'Blue Hall, Taipei City')

const icsTimed = buildIcsContent(timedEvent, siteUrl)
assert.match(icsTimed, /BEGIN:VCALENDAR\r\n/)
assert.match(icsTimed, /DTSTART:20260718T110000Z/)
assert.match(icsTimed, /DTEND:20260718T130000Z/)
assert.match(icsTimed, /UID:taipei-social@blues\.example\.com/)
assert.match(icsTimed, /URL:https:\/\/blues\.example\.com\/events\/taipei-social/)

const icsTimedAgain = buildIcsContent(timedEvent, siteUrl)
assert.equal(
  icsTimed.match(/UID:(.+)\r\n/)[1],
  icsTimedAgain.match(/UID:(.+)\r\n/)[1]
)

const allDayEvent = makeEvent({
  slug: 'all-day-jam',
  name: 'All Day Jam',
  startTime: '2026-07-19T00:00:00.000Z',
  endTime: null,
  startTimeIsDateOnly: true,
  endTimeIsDateOnly: false
})

const allDayUrl = new URL(buildGoogleCalendarUrl(allDayEvent, siteUrl))
assert.equal(allDayUrl.searchParams.get('dates'), '20260719/20260720')
assert.equal(allDayUrl.searchParams.get('ctz'), null)

const icsAllDay = buildIcsContent(allDayEvent, siteUrl)
assert.match(icsAllDay, /DTSTART;VALUE=DATE:20260719/)
assert.match(icsAllDay, /DTEND;VALUE=DATE:20260720/)

const timedWithoutEnd = makeEvent({
  slug: 'late-night',
  endTime: null,
  startTime: '2026-07-18T10:30:00.000Z',
  startTimeIsDateOnly: false
})

const fallbackUrl = new URL(buildGoogleCalendarUrl(timedWithoutEnd, siteUrl))
assert.equal(fallbackUrl.searchParams.get('dates'), '20260718T103000Z/20260718T155959Z')

const escapedEvent = makeEvent({
  slug: 'escaped',
  name: '中文活動, 測試; Backslash \\',
  summary: '第一行\n第二行, 測試; \\',
  organizer: '主辦單位',
  address: '台北市, 測試; 路'
})

const escapedIcs = buildIcsContent(escapedEvent, siteUrl)
assert.match(escapedIcs, /SUMMARY:中文活動\\, 測試\\; Backslash \\\\/)
assert.match(escapedIcs, /DESCRIPTION:第一行\\n第二行\\, 測試\\; \\\\/)
assert.match(escapedIcs, /LOCATION:台北市\\, 測試\\; 路/)

assert.equal(buildGoogleCalendarUrl(makeEvent({
  eventStatus: 'cancelled'
}), siteUrl), null)
assert.equal(buildIcsContent(makeEvent({
  eventStatus: 'postponed'
}), siteUrl), null)
assert.equal(buildGoogleCalendarUrl(makeEvent({
  timeStatus: 'ended'
}), siteUrl), null)
assert.equal(buildGoogleCalendarUrl(makeEvent({
  timeStatus: 'unscheduled',
  startTime: null
}), siteUrl), null)
assert.equal(buildGoogleCalendarUrl(makeEvent({
  startTime: 'bad-date'
}), siteUrl), null)

assert.equal(getEventCalendarFilename(makeEvent({
  slug: 'taipei-blues-social'
})), 'taipei-blues-social.ics')

console.log('verify-event-calendar: ok')
