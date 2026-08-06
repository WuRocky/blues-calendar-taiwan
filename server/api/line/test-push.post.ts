import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

const TEST_PUSH_MESSAGE = 'LINE Bot 主動推播測試成功 💙'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authorization = getHeader(event, 'authorization')
  const expectedAuthorization = config.lineJobSecret ? `Bearer ${config.lineJobSecret}` : ''

  if (!authorization || authorization !== expectedAuthorization) {
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
    await pushLineTextMessage({
      channelAccessToken: config.lineChannelAccessToken,
      targetId: config.lineGroupId,
      text: TEST_PUSH_MESSAGE
    })

    return {
      success: true,
      message: 'LINE test push sent'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.startsWith('LINE push failed')) {
      console.error('LINE push request failed:', message)

      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to send LINE push message'
      })
    }

    console.error('Unexpected LINE test push error:', message)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process LINE test push request'
    })
  }
})
