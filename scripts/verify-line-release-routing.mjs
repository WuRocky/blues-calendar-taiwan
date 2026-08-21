import assert from 'node:assert/strict'
import fs from 'node:fs'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const { resolveWeeklyCommand } = jiti('../lib/line/weeklyCommandRouting.ts')

function makeMentionEvent(command) {
  const mentionText = 'BOT'
  const text = command ? `${mentionText} ${command}` : mentionText

  return {
    type: 'message',
    source: {
      type: 'group'
    },
    message: {
      type: 'text',
      text,
      mention: {
        mentionees: [
          {
            index: 0,
            length: mentionText.length,
            isSelf: true
          }
        ]
      }
    }
  }
}

function makeDirectEvent(command) {
  return {
    type: 'message',
    source: {
      type: 'group'
    },
    message: {
      type: 'text',
      text: command
    }
  }
}

assert.equal(resolveWeeklyCommand(makeMentionEvent('本週活動'), 'production')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeDirectEvent('本週活動'), 'production')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeMentionEvent('活動'), 'production'), null)
assert.equal(resolveWeeklyCommand(makeMentionEvent('下週活動'), 'production'), null)
assert.equal(resolveWeeklyCommand(makeMentionEvent(''), 'production'), null)

assert.equal(resolveWeeklyCommand(makeMentionEvent('活動'), 'test')?.mode, 'remaining-and-next-week')
assert.equal(resolveWeeklyCommand(makeMentionEvent('本週活動'), 'test')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeMentionEvent('下週活動'), 'test')?.mode, 'next-week')
assert.equal(resolveWeeklyCommand(makeDirectEvent('本週活動'), 'test')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeDirectEvent('活動'), 'test'), null)

assert.equal(resolveWeeklyCommand(makeMentionEvent(''), 'legacy')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeMentionEvent('活動'), 'legacy')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeMentionEvent('本週活動'), 'legacy')?.mode, 'remaining-week')
assert.equal(resolveWeeklyCommand(makeMentionEvent('下週活動'), 'legacy'), null)

const productionWebhook = fs.readFileSync(new URL('../server/api/line/webhook.post.ts', import.meta.url), 'utf8')
const testWebhook = fs.readFileSync(new URL('../server/api/line/test-webhook.post.ts', import.meta.url), 'utf8')
const legacyWebhook = fs.readFileSync(new URL('../server/api/line/legacy-webhook.post.ts', import.meta.url), 'utf8')

assert.match(productionWebhook, /botContext: 'production'/)
assert.match(testWebhook, /botContext: 'test'/)
assert.match(legacyWebhook, /botContext: 'legacy'/)

console.log('verify-line-release-routing: ok')
