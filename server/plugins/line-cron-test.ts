import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { defineNitroPlugin } from 'nitropack/runtime'
import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { formatWeeklyEventsMessage } from '~~/lib/line/formatWeeklyEventsMessage'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

const TEST_CRON_EXPRESSION = '*/10 * * * *'

interface LineCronEnvBindings {
  NOTION_EVENTS_DATABASE_ID?: string
  NOTION_TOKEN?: string
  NUXT_LINE_CHANNEL_ACCESS_TOKEN?: string
  NUXT_LINE_GROUP_ID?: string
}

function getEnvBinding(env: unknown, key: keyof LineCronEnvBindings) {
  if (!env || typeof env !== 'object') {
    return ''
  }

  const value = Reflect.get(env, key)
  return typeof value === 'string' ? value : ''
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
    const lineGroupId = getEnvBinding(env, 'NUXT_LINE_GROUP_ID')
    const lineChannelAccessToken = getEnvBinding(env, 'NUXT_LINE_CHANNEL_ACCESS_TOKEN')
    const notionToken = getEnvBinding(env, 'NOTION_TOKEN')
    const notionEventsDatabaseId = getEnvBinding(env, 'NOTION_EVENTS_DATABASE_ID')

    console.log('LINE weekly cron config status', {
      hasLineGroupId: Boolean(lineGroupId),
      hasLineChannelAccessToken: Boolean(lineChannelAccessToken),
      hasNotionToken: Boolean(notionToken),
      hasNotionDatabaseId: Boolean(notionEventsDatabaseId),
    })

    if (!lineGroupId || !lineChannelAccessToken || !notionToken || !notionEventsDatabaseId) {
      console.log('LINE weekly cron skipped: missing configuration')
      return
    }

    const now = dayjs(event.controller.scheduledTime).tz(TAIPEI_TIMEZONE)

    try {
      const events = await getWeeklyEvents(now, {
        notionToken,
        notionEventsDatabaseId,
      })
      const weekRange = getTaipeiWeekRange(now)
      const message = formatWeeklyEventsMessage({
        weekStart: weekRange.start,
        weekEnd: weekRange.end,
        events,
      })

      console.log('LINE weekly cron events loaded', {
        eventCount: events.length,
      })

      console.log('LINE weekly cron push starting')

      await pushLineTextMessage({
        channelAccessToken: lineChannelAccessToken,
        targetId: lineGroupId,
        text: message,
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
