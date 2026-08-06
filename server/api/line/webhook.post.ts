interface LineWebhookSource {
  type: 'user' | 'group' | 'room'
  userId?: string
  groupId?: string
  roomId?: string
}

interface LineWebhookEvent {
  type: string
  source?: LineWebhookSource
}

interface LineWebhookBody {
  destination?: string
  events?: LineWebhookEvent[]
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<LineWebhookBody>(event)

    for (const lineEvent of body?.events ?? []) {
      console.log('LINE webhook event:', lineEvent)

      if (lineEvent.source?.type === 'group' && lineEvent.source.groupId) {
        console.log('LINE group ID:', lineEvent.source.groupId)
      }
    }

    // TODO:
    // 正式版本需使用 LINE_CHANNEL_SECRET
    // 驗證 x-line-signature，確認請求來自 LINE。

    return {
      success: true
    }
  } catch (error) {
    console.error('Failed to handle LINE webhook:', error)

    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid LINE webhook request'
    })
  }
})
