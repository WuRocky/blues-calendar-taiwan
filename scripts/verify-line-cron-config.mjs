import assert from 'node:assert/strict'
import fs from 'node:fs'
const wranglerConfig = JSON.parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))
const pluginSource = fs.readFileSync(new URL('../server/plugins/line-weekly-push.ts', import.meta.url), 'utf8')
const apiSource = fs.readFileSync(new URL('../server/api/line/weekly-push.post.ts', import.meta.url), 'utf8')
const serviceSource = fs.readFileSync(new URL('../lib/line/sendWeeklyLinePush.ts', import.meta.url), 'utf8')

assert.match(serviceSource, /export const WEEKLY_LINE_PUSH_CRON = '0 2 \* \* \*'/)
assert.deepEqual(wranglerConfig.triggers?.crons, ['0 2 * * *'])
assert.match(pluginSource, /cloudflare:scheduled/)
assert.match(pluginSource, /sendWeeklyLinePush/)
assert.match(apiSource, /sendWeeklyLinePush/)

console.log('verify-line-cron-config: ok')
