import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { defineNitroPlugin } from 'nitropack/runtime'
import { ensureMissingEventSlugs } from '~~/lib/events/ensureMissingEventSlugs'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { formatWeeklyEventsFlexMessage } from '~~/lib/line/formatWeeklyEventsFlexMessage'
import { pushLineMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

const TEST_CRON_EXPRESSION = '*/30 * * * *'
const EVENT_SLUGS_CRON_EXPRESSION = '*/15 * * * *'

interface LineCronEnvBindings {
  NUXT_NOTION_EVENTS_DATABASE_ID?: string
  NUXT_NOTION_TOKEN?: string
  NUXT_LINE_CHANNEL_ACCESS_TOKEN?: string
  NUXT_LINE_PUBLIC_GROUP_ID?: string
}

function getEnvBinding(env: unknown, key: keyof LineCronEnvBindings) {
  if (!env || typeof env !== 'object') {
    return ''
  }

  const value = Reflect.get(env, key)
  return typeof value === 'string' ? value : ''
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

    if (actualCron !== TEST_CRON_EXPRESSION) {
      console.log('LINE weekly cron skipped: cron mismatch')
      console.log('LINE weekly cron cron mismatch', {
        receivedCron: actualCron,
        expectedCron: TEST_CRON_EXPRESSION,
      })
      return
    }

    console.log('LINE weekly cron started', {
      cron: actualCron,
      scheduledTime,
    })

    const { env } = event
    const linePublicGroupId = getEnvBinding(env, 'NUXT_LINE_PUBLIC_GROUP_ID')
    const lineChannelAccessToken = getEnvBinding(env, 'NUXT_LINE_CHANNEL_ACCESS_TOKEN')
    const notionToken = getEnvBinding(env, 'NUXT_NOTION_TOKEN')
    const notionEventsDatabaseId = getEnvBinding(env, 'NUXT_NOTION_EVENTS_DATABASE_ID')

    console.log('LINE weekly cron config status', {
      hasLinePublicGroupId: Boolean(linePublicGroupId),
      hasLineChannelAccessToken: Boolean(lineChannelAccessToken),
      hasNotionToken: Boolean(notionToken),
      hasNotionDatabaseId: Boolean(notionEventsDatabaseId),
    })

    if (!linePublicGroupId || !lineChannelAccessToken || !notionToken || !notionEventsDatabaseId) {
      console.log('LINE weekly cron skipped: missing configuration')
      return
    }

    const now = dayjs(event.controller.scheduledTime).tz(TAIPEI_TIMEZONE)

    try {
      const events = await getWeeklyEvents(now, {
        token: notionToken,
        databaseId: notionEventsDatabaseId,
      })
      const weekRange = getTaipeiWeekRange(now)
      const message = formatWeeklyEventsFlexMessage({
        weekStart: weekRange.start,
        weekEnd: weekRange.end,
        events,
      })

      console.log('LINE weekly cron events loaded', {
        eventCount: events.length,
      })

      console.log('LINE weekly cron push starting')

      await pushLineMessage({
        channelAccessToken: lineChannelAccessToken,
        targetId: linePublicGroupId,
        messages: [message],
      })

      console.log('LINE weekly cron push sent', {
        eventCount: events.length,
      })
    } catch (error) {
      console.error(
        'LINE weekly cron failed',
        error instanceof Error ? error.message : 'Unknown error',
      )

      throw error
    }
  })
})
