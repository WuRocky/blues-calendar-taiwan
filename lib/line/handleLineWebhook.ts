import type { H3Event } from 'h3'
import { authorizeLineWebhook } from '~~/lib/line/verifyLineSignature'

export interface LineWebhookSource {
  type: 'user' | 'group' | 'room'
  userId?: string
  groupId?: string
  roomId?: string
}

export interface LineWebhookEvent {
  type: string
  source?: LineWebhookSource
}

export interface LineWebhookBody {
  destination?: string
  events?: LineWebhookEvent[]
}

export interface HandleLineWebhookParams {
  channelSecret: string
  event: H3Event
}

export async function handleLineWebhook({
  event,
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

      if (lineEvent.source?.type === 'group' && lineEvent.source.groupId) {
        console.log('LINE group ID:', lineEvent.source.groupId)
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
