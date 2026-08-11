import type { H3Event } from 'h3'
import { handleLineMentionCommand } from '~~/lib/line/handleLineMentionCommand'
import { authorizeLineWebhook } from '~~/lib/line/verifyLineSignature'

export interface LineWebhookSource {
  type: 'user' | 'group' | 'room'
  userId?: string
  groupId?: string
  roomId?: string
}

export interface LineWebhookEvent {
  message?: {
    mention?: {
      mentionees?: Array<{
        index: number
        isSelf?: boolean
        length: number
      }>
    }
    text?: string
    type?: string
  }
  replyToken?: string
  type: string
  source?: LineWebhookSource
}

export interface LineWebhookBody {
  destination?: string
  events?: LineWebhookEvent[]
}

export interface HandleLineWebhookParams {
  channelAccessToken: string
  channelSecret: string
  event: H3Event
}

export async function handleLineWebhook({
  event,
  channelAccessToken,
  channelSecret
}: HandleLineWebhookParams) {
  try {
    const signature = getHeader(event, 'x-line-signature')
    const rawBody = (await readRawBody(event, 'utf8')) ?? ''

    const isAuthorized = rawBody
      ? await authorizeLineWebhook({
          channelSecret,
          rawBody,
          signature
        })
      : false

    if (!isAuthorized) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const parsedBody = JSON.parse(rawBody) as LineWebhookBody
    const body = typeof parsedBody === 'object' && parsedBody !== null ? parsedBody : {}

    for (const lineEvent of body?.events ?? []) {
      console.log('LINE webhook event:', {
        type: lineEvent.type,
        sourceType: lineEvent.source?.type ?? null
      })

      if (lineEvent.source?.type === 'group') {
        console.log('LINE webhook group event received')
      }

      try {
        await handleLineMentionCommand(lineEvent, channelAccessToken)
      } catch (error) {
        console.error(
          'Failed to handle LINE mention command:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    return {
      success: true
    }
  } catch (error) {
    if (isError(error) && error.statusCode === 401) {
      throw error
    }

    console.error('Failed to handle LINE webhook:', error)

    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid LINE webhook request'
    })
  }
}
