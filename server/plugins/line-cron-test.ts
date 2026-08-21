import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { defineNitroPlugin } from 'nitropack/runtime'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { ensureMissingEventSlugs } from '~~/lib/events/ensureMissingEventSlugs'
import { sendWeeklyLinePush } from '~~/lib/line/sendWeeklyLinePush'

dayjs.extend(utc)
dayjs.extend(timezone)

const PRODUCTION_WEEKLY_CRON_EXPRESSION = '0 2 * * 1'
const TEST_NEXT_WEEKLY_CRON_EXPRESSION = '0 2 * * 0'
const EVENT_SLUGS_CRON_EXPRESSION = '*/15 * * * *'

interface LineCronEnvBindings {
  NUXT_NOTION_EVENTS_DATABASE_ID?: string
  NUXT_NOTION_TOKEN?: string
  NUXT_LINE_CHANNEL_ACCESS_TOKEN?: string
  NUXT_LINE_TEST_CHANNEL_ACCESS_TOKEN?: string
  NUXT_LINE_PUBLIC_GROUP_ID?: string
  NUXT_LINE_TEST_GROUP_ID?: string
  NUXT_PUBLIC_SITE_URL?: string
}

function getEnvBinding(env: unknown, key: keyof LineCronEnvBindings) {
  if (!env || typeof env !== 'object') {
    return ''
  }

  const value = Reflect.get(env, key)
  return typeof value === 'string' ? value : ''
}

interface WeeklyLineCronConfig {
  groupId: string
  lineChannelAccessToken: string
  notionEventsDatabaseId: string
  notionToken: string
  siteUrl?: string
}

async function handleEventSlugMaintenanceCron(env: unknown) {
  const notionToken = getEnvBinding(env, 'NUXT_NOTION_TOKEN')
  const notionEventsDatabaseId = getEnvBinding(env, 'NUXT_NOTION_EVENTS_DATABASE_ID')

  if (!notionToken || !notionEventsDatabaseId) {
    console.log('[event-slugs] skipped: missing configuration')
    return
  }

  try {
    const result = await ensureMissingEventSlugs({
      notionConfig: {
        notionToken,
        notionEventsDatabaseId
      }
    })

    if (result.updated.length === 0) {
      console.log('[event-slugs] no missing slugs')
      return
    }

    console.log(`[event-slugs] updated ${result.updated.length} events`)
  } catch (error) {
    console.error(
      '[event-slugs] failed',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

async function handleWeeklyLineCron(
  cronLabel: string,
  scheduledTime: number,
  config: WeeklyLineCronConfig,
  mode: 'full-week' | 'next-week'
) {
  if (!config.groupId || !config.lineChannelAccessToken || !config.notionToken || !config.notionEventsDatabaseId) {
    console.log(`${cronLabel} skipped: missing configuration`)
    return
  }

  const now = dayjs(scheduledTime).tz(TAIPEI_TIMEZONE)

  try {
    console.log(`${cronLabel} push starting`, {
      mode,
      scheduledTime
    })

    const result = await sendWeeklyLinePush({
      lineChannelAccessToken: config.lineChannelAccessToken,
      lineGroupId: config.groupId,
      mode,
      notionConfig: {
        token: config.notionToken,
        databaseId: config.notionEventsDatabaseId
      },
      now,
      siteUrl: config.siteUrl
    })

    console.log(`${cronLabel} push sent`, {
      eventCount: result.eventCount,
      mode
    })
  } catch (error) {
    console.error(
      `${cronLabel} failed`,
      error instanceof Error ? error.message : 'Unknown error'
    )

    throw error
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async (event) => {
    const actualCron = event.controller?.cron ?? null
    const scheduledTime = event.controller?.scheduledTime ?? null

    console.log('LINE weekly cron raw event received')
    console.log('LINE weekly cron event info', {
      hasEvent: Boolean(event),
      cron: actualCron,
      scheduledTime,
    })

    if (actualCron === EVENT_SLUGS_CRON_EXPRESSION) {
      await handleEventSlugMaintenanceCron(event.env)
      return
    }

    const { env } = event
    const linePublicGroupId = getEnvBinding(env, 'NUXT_LINE_PUBLIC_GROUP_ID')
    const lineChannelAccessToken = getEnvBinding(env, 'NUXT_LINE_CHANNEL_ACCESS_TOKEN')
    const lineTestGroupId = getEnvBinding(env, 'NUXT_LINE_TEST_GROUP_ID')
    const lineTestChannelAccessToken = getEnvBinding(env, 'NUXT_LINE_TEST_CHANNEL_ACCESS_TOKEN')
    const notionToken = getEnvBinding(env, 'NUXT_NOTION_TOKEN')
    const notionEventsDatabaseId = getEnvBinding(env, 'NUXT_NOTION_EVENTS_DATABASE_ID')
    const siteUrl = getEnvBinding(env, 'NUXT_PUBLIC_SITE_URL')

    if (actualCron === PRODUCTION_WEEKLY_CRON_EXPRESSION) {
      console.log('LINE production weekly cron started', {
        cron: actualCron,
        scheduledTime
      })

      console.log('LINE production weekly cron config status', {
        hasLinePublicGroupId: Boolean(linePublicGroupId),
        hasLineChannelAccessToken: Boolean(lineChannelAccessToken),
        hasNotionToken: Boolean(notionToken),
        hasNotionDatabaseId: Boolean(notionEventsDatabaseId)
      })

      await handleWeeklyLineCron(
        'LINE production weekly cron',
        event.controller.scheduledTime,
        {
          groupId: linePublicGroupId,
          lineChannelAccessToken,
          notionToken,
          notionEventsDatabaseId,
          siteUrl
        },
        'full-week'
      )
      return
    }

    if (actualCron === TEST_NEXT_WEEKLY_CRON_EXPRESSION) {
      console.log('LINE test next-week cron started', {
        cron: actualCron,
        scheduledTime
      })

      console.log('LINE test next-week cron config status', {
        hasLineTestGroupId: Boolean(lineTestGroupId),
        hasLineTestChannelAccessToken: Boolean(lineTestChannelAccessToken),
        hasNotionToken: Boolean(notionToken),
        hasNotionDatabaseId: Boolean(notionEventsDatabaseId)
      })

      await handleWeeklyLineCron(
        'LINE test next-week cron',
        event.controller.scheduledTime,
        {
          groupId: lineTestGroupId,
          lineChannelAccessToken: lineTestChannelAccessToken,
          notionToken,
          notionEventsDatabaseId,
          siteUrl
        },
        'next-week'
      )
      return
    }

    console.log('LINE weekly cron skipped: cron mismatch')
    console.log('LINE weekly cron cron mismatch', {
      receivedCron: actualCron,
      expectedCrons: [
        PRODUCTION_WEEKLY_CRON_EXPRESSION,
        TEST_NEXT_WEEKLY_CRON_EXPRESSION,
        EVENT_SLUGS_CRON_EXPRESSION
      ],
    })
  })
})
