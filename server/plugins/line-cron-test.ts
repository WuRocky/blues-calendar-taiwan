import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { defineNitroPlugin } from 'nitropack/runtime'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

const TEST_CRON_EXPRESSION = '*/10 * * * *'

interface LineCronEnvBindings {
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
  nitroApp.hooks.hook('cloudflare:scheduled', async ({
    controller,
    env
  }) => {
    console.log('LINE cron test started', {
      cron: controller.cron,
      scheduledTime: controller.scheduledTime
    })

    if (controller.cron !== TEST_CRON_EXPRESSION) {
      console.warn('LINE cron test skipped: unknown cron', {
        cron: controller.cron
      })
      return
    }

    const lineGroupId = getEnvBinding(env, 'NUXT_LINE_GROUP_ID')
    const lineChannelAccessToken = getEnvBinding(env, 'NUXT_LINE_CHANNEL_ACCESS_TOKEN')

    console.log('LINE cron config status', {
      hasLineGroupId: Boolean(lineGroupId),
      hasLineChannelAccessToken: Boolean(lineChannelAccessToken)
    })

    if (!lineGroupId || !lineChannelAccessToken) {
      console.warn('LINE cron test skipped: missing configuration')
      return
    }

    const taipeiTime = dayjs(controller.scheduledTime).tz(TAIPEI_TIMEZONE)
    const message = [
      '🧪 LINE Cron 測試',
      '',
      '自動排程執行成功 💙',
      `時間：${taipeiTime.format('YYYY/MM/DD HH:mm')}`
    ].join('\n')

    try {
      console.log('LINE cron push starting')

      await pushLineTextMessage({
        channelAccessToken: lineChannelAccessToken,
        targetId: lineGroupId,
        text: message
      })

      console.log('LINE cron push sent')
    } catch (error) {
      console.error(
        'LINE cron push failed',
        error instanceof Error ? error.message : 'Unknown error'
      )

      throw error
    }
  })
})
