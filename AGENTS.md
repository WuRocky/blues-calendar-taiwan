# Blues Calendar Taiwan

## Project architecture

- Nuxt + Cloudflare
- Notion is the event database
- Tally submits through `/api/tally/webhook`
- Tally Date + Time fields are merged into Notion datetime values
- `NUXT_TALLY_NOTION_WRITE_ENABLED=true` enables real Notion writes

## Notion rules

- Publish Status: Draft / Pending / Published
- Event Status: Scheduled / Postponed / Cancelled
- Public website and public LINE output only use Published events
- Do not regenerate an existing Slug
- Source represents the original source and must not change during LINE edits

## LINE environments

### Production

- `/api/line/webhook`
- Production credentials use `NUXT_LINE_CHANNEL_*`
- Public target uses `NUXT_LINE_PUBLIC_GROUP_ID`
- Supports `本週活動`
- Does not respond to `活動` or `下週活動`

### Test

- `/api/line/test-webhook`
- Uses `NUXT_LINE_TEST_*`
- Supports:
  - 活動 = remaining current week + next week
  - 本週活動 = remaining current week
  - 下週活動 = next full week

### Organizer

- `NUXT_LINE_ORGANIZER_GROUP_ID`
- `NUXT_LINE_TEST_GROUP_ID`
- May use event update features

## Scheduled jobs

- `*/15 * * * *` event Slug maintenance
- Sunday 10:00 Asia/Taipei: Test Bot pushes next week
- Monday 10:00 Asia/Taipei: Production Bot pushes current week
- Production daily push time is not finalized yet

## Safety

- Never expose tokens or secrets in logs
- Do not change Notion schema unless explicitly requested
- Do not modify Tally mapping when working on LINE-only tasks
- Do not make public LINE management commands visible outside authorized groups

## Required verification

Before completing LINE changes run:

- node scripts/verify-line-release-routing.mjs
- node scripts/verify-line-weekly-push.mjs
- node scripts/verify-line-organizer-update.mjs
- yarn typecheck
- yarn build
