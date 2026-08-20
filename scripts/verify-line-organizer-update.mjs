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

const {
  isOrganizerUpdateCommand,
  parseOrganizerEventUpdateCommand
} = jiti('../lib/line/organizerEventUpdateParser.ts')
const {
  buildOrganizerEventUpdatePatch
} = jiti('../lib/line/organizerEventUpdateNotion.ts')
const mentionHandler = fs.readFileSync(new URL('../lib/line/handleLineMentionCommand.ts', import.meta.url), 'utf8')
const webhookHandler = fs.readFileSync(new URL('../lib/line/handleLineWebhook.ts', import.meta.url), 'utf8')
const organizerHandler = fs.readFileSync(new URL('../lib/line/handleLineOrganizerUpdate.ts', import.meta.url), 'utf8')
const organizerState = fs.readFileSync(new URL('../lib/line/organizerUpdateState.ts', import.meta.url), 'utf8')

const now = dayjs.tz('2026-08-14 12:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Taipei')
const parsed = parseOrganizerEventUpdateCommand(`修改活動
活動：Friday Blues
日期：8/22
開始時間：20:30`, now)

assert.equal(isOrganizerUpdateCommand(`修改活動
活動：Friday Blues`), true)
assert.ok(!('reason' in parsed))

if (!('reason' in parsed)) {
  assert.equal(parsed.eventName, 'Friday Blues')
  assert.equal(parsed.eventDate.format('YYYY-MM-DD'), '2026-08-22')
  assert.equal(parsed.fields.startTime, '20:30')
}

const parsedVenueOnly = parseOrganizerEventUpdateCommand(`修改活動
活動：Friday Blues
日期：2026/08/22
場地：Sappho`, now)

assert.ok(!('reason' in parsedVenueOnly))
if (!('reason' in parsedVenueOnly)) {
  assert.equal(parsedVenueOnly.fields.venueName, 'Sappho')
}

const parsedMissingField = parseOrganizerEventUpdateCommand(`修改活動
活動：Friday Blues
日期：8/22`, now)
assert.ok('reason' in parsedMissingField)

const patch = buildOrganizerEventUpdatePatch({
  endTime: '2026-08-22T15:30:00.000Z',
  eventStatus: 'Scheduled',
  name: 'Friday Blues',
  pageId: 'page-1',
  price: '300',
  publishStatus: 'Pending',
  startTime: '2026-08-22T12:00:00.000Z',
  venueName: 'Old Venue'
}, dayjs.tz('2026-08-22', 'YYYY-MM-DD', 'Asia/Taipei'), {
  startTime: '20:30',
  venueName: 'Sappho'
})

assert.equal(dayjs(patch.startTime).tz('Asia/Taipei').format('HH:mm'), '20:30')
assert.equal(patch.endTime, undefined)
assert.equal(patch.venueName, 'Sappho')

assert.match(mentionHandler, /handleOrganizerUpdatePostback/)
assert.match(mentionHandler, /handleOrganizerUpdateMessage/)
assert.match(webhookHandler, /lineOrganizerGroupId/)
assert.match(webhookHandler, /lineTestGroupId/)
assert.match(organizerHandler, /lineOrganizerGroupId/)
assert.match(organizerHandler, /lineTestGroupId/)
assert.match(organizerHandler, /buildOrganizerUpdateCompletedMessage/)
assert.match(organizerHandler, /buildOrganizerUpdateCancelledMessage\(\)/)
assert.match(organizerHandler, /buildOrganizerUpdateExpiredMessage\(\)/)
assert.match(organizerHandler, /completed request reused/)
assert.match(organizerHandler, /cancelled request reused/)
assert.match(organizerState, /status: 'pending'/)
assert.match(organizerState, /'completed'/)
assert.match(organizerState, /'cancelled'/)
assert.match(organizerState, /'expired'/)
assert.match(organizerState, /TERMINAL_STATE_RETENTION_MINUTES = 60/)
assert.match(organizerState, /REQUEST_EXPIRY_MINUTES = 10/)
assert.match(organizerState, /getOrganizerUpdateTerminalStateRetentionMinutes/)

console.log('verify-line-organizer-update: ok')
