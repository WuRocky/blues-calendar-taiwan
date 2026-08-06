import { getWeeklyEvents } from '~~/lib/events/getWeeklyEvents'
import { getTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { formatWeeklyEventsMessage } from '~~/lib/line/formatWeeklyEventsMessage'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'
import { verifyJobAuthorization } from '~~/lib/line/verifyJobAuthorization'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authorization = getHeader(event, 'authorization')

  if (!verifyJobAuthorization({
    authorization,
    lineJobSecret: config.lineJobSecret
  })) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!config.lineGroupId || !config.lineChannelAccessToken || !config.lineJobSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing LINE configuration'
    })
  }

  try {
    const weeklyEvents = await getWeeklyEvents()
    const weekRange = getTaipeiWeekRange()
    const message = formatWeeklyEventsMessage({
      weekStart: weekRange.start,
      weekEnd: weekRange.end,
      events: weeklyEvents,
      siteUrl: config.public.siteUrl
    })

    await pushLineTextMessage({
      channelAccessToken: config.lineChannelAccessToken,
      targetId: config.lineGroupId,
      text: message
    })

    return {
      success: true,
      message: 'Weekly LINE push sent',
      eventCount: weeklyEvents.length
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.startsWith('LINE push failed')) {
      console.error('LINE weekly push request failed:', message)

      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to send LINE push message'
      })
    }

    console.error('Unexpected LINE weekly push error:', message)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process weekly LINE push request'
    })
  }
})
