import { sendWeeklyLinePush, WEEKLY_LINE_PUSH_CRON } from '~~/lib/line/sendWeeklyLinePush'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ controller }) => {
    if (controller.cron !== WEEKLY_LINE_PUSH_CRON) {
      return
    }

    const config = useRuntimeConfig()

    try {
      const result = await sendWeeklyLinePush({
        lineGroupId: config.lineGroupId,
        lineChannelAccessToken: config.lineChannelAccessToken
      })

      console.info('LINE weekly cron push sent', {
        cron: controller.cron,
        eventCount: result.eventCount
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('LINE weekly cron push failed:', message)
      throw error
    }
  })
})
