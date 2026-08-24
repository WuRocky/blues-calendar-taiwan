import type { H3Event } from 'h3'
import { handleLineCommand } from '~~/lib/line/handleLineMentionCommand'
import type { OrganizerCommandRuntimeConfig } from '~~/lib/line/handleLineOrganizerUpdate'
import type { LineBotContext } from '~~/lib/line/weeklyCommandRouting'
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
  postback?: {
    data?: string
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
  botContext: LineBotContext
  channelAccessToken: string
  channelSecret: string
  event: H3Event
}

export async function handleLineWebhook({
  event,
  botContext,
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
    const runtimeConfig = useRuntimeConfig(event)
    const organizerConfig: OrganizerCommandRuntimeConfig = {
      lineOrganizerGroupId: runtimeConfig.lineOrganizerGroupId,
      lineTestGroupId: runtimeConfig.lineTestGroupId,
      notionEventsDatabaseId: runtimeConfig.notionEventsDatabaseId,
      notionToken: runtimeConfig.notionToken,
      siteUrl: runtimeConfig.public.siteUrl
    }

    for (const lineEvent of body?.events ?? []) {
      console.log('LINE webhook event:', {
        type: lineEvent.type,
        sourceType: lineEvent.source?.type ?? null
      })

      if (lineEvent.source?.type === 'group') {
        console.log('LINE webhook group event received')
        console.log('[line-webhook] group event', {
          groupId: lineEvent.source.groupId,
          userId: lineEvent.source.userId
        })
      }

      try {
        await handleLineCommand(lineEvent, channelAccessToken, organizerConfig, botContext)
      } catch (error) {
        console.error(
          'Failed to handle LINE command:',
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
