import { sendDailyLinePush } from '~~/lib/line/sendDailyLinePush'
import { verifyJobAuthorization } from '~~/lib/line/verifyJobAuthorization'
import { resolveLinePushDate } from '~~/lib/line/resolveLinePushDate'

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

  if (!config.linePublicGroupId || !config.lineChannelAccessToken || !config.lineJobSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing LINE configuration'
    })
  }

  const query = getQuery(event)
  const now = resolveLinePushDate(query.date)

  if (!now) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date query'
    })
  }

  try {
    const result = await sendDailyLinePush({
      lineChannelAccessToken: config.lineChannelAccessToken,
      linePublicGroupId: config.linePublicGroupId,
      now
    })

    return {
      success: true,
      message: result.skipped ? 'No daily events to send' : 'Daily LINE push sent',
      eventCount: result.eventCount,
      skipped: result.skipped
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.startsWith('LINE push failed')) {
      console.error('LINE daily push request failed:', message)

      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to send LINE push message'
      })
    }

    console.error('Unexpected LINE daily push error:', message)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process daily LINE push request'
    })
  }
})
