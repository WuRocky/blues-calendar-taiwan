import assert from 'node:assert/strict'
import fs from 'node:fs'

const wranglerConfig = fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
const cronPlugin = fs.readFileSync(new URL('../server/plugins/line-cron-test.ts', import.meta.url), 'utf8')

assert.match(wranglerConfig, /"\*\/15 \* \* \* \*"/)
assert.match(cronPlugin, /const EVENT_SLUGS_CRON_EXPRESSION = '\*\/15 \* \* \* \*'/)
assert.match(cronPlugin, /handleEventSlugMaintenanceCron/)
assert.match(cronPlugin, /ensureMissingEventSlugs/)
assert.match(cronPlugin, /NUXT_NOTION_TOKEN/)
assert.match(cronPlugin, /NUXT_NOTION_EVENTS_DATABASE_ID/)
assert.match(cronPlugin, /\[event-slugs\] no missing slugs/)
assert.match(cronPlugin, /\[event-slugs\] updated \$\{result\.updated\.length\} events/)
assert.match(cronPlugin, /\[event-slugs\] failed/)
assert.match(cronPlugin, /if \(actualCron === EVENT_SLUGS_CRON_EXPRESSION\)/)
assert.match(cronPlugin, /if \(actualCron !== TEST_CRON_EXPRESSION\)/)

console.log('verify-event-slug-cron: ok')
