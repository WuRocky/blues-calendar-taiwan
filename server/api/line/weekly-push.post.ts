import { sendWeeklyLinePush } from '~~/lib/line/sendWeeklyLinePush'
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
    const result = await sendWeeklyLinePush({
      lineChannelAccessToken: config.lineChannelAccessToken,
      lineGroupId: config.lineGroupId,
      mode: 'remaining-week',
      siteUrl: config.public.siteUrl
    })

    return {
      success: true,
      eventCount: result.eventCount
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
