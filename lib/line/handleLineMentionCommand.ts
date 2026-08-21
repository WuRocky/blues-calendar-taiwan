import { createWeeklyLineFlexMessage } from '~~/lib/line/createWeeklyLineFlexMessage'
import type { OrganizerCommandRuntimeConfig } from '~~/lib/line/handleLineOrganizerUpdate'
import { handleOrganizerUpdateMessage, handleOrganizerUpdatePostback } from '~~/lib/line/handleLineOrganizerUpdate'
import { LineMessageRequestError, replyLineMessage } from '~~/lib/line/pushLineMessage'
import {
  resolveWeeklyCommand,
  type LineBotContext,
  type LineTextMessageEvent
} from '~~/lib/line/weeklyCommandRouting'

function collectFlexImageUrls(message: Awaited<ReturnType<typeof createWeeklyLineFlexMessage>>['message']) {
  if (message.type !== 'flex') {
    return []
  }

  const bubbles = message.contents.type === 'carousel'
    ? message.contents.contents
    : [message.contents]

  const imageUrls: string[] = []

  for (const bubble of bubbles) {
    const boxes = [bubble.body, bubble.footer].filter((box): box is typeof bubble.body => Boolean(box))

    for (const box of boxes) {
      for (const component of box.contents) {
        if (component.type === 'image') {
          imageUrls.push(component.url)
          continue
        }

        if (component.type !== 'box') {
          continue
        }

        for (const nestedComponent of component.contents) {
          if (nestedComponent.type === 'image') {
            imageUrls.push(nestedComponent.url)
          }
        }
      }
    }
  }

  return imageUrls
}

export async function handleLineCommand(
  event: LineTextMessageEvent,
  channelAccessToken: string,
  config: OrganizerCommandRuntimeConfig,
  botContext: LineBotContext
) {
  if (await handleOrganizerUpdatePostback(event, channelAccessToken, config)) {
    return true
  }

  if (await handleOrganizerUpdateMessage(event, channelAccessToken, config)) {
    return true
  }

  const weeklyCommand = resolveWeeklyCommand(event, botContext)

  if (!weeklyCommand) {
    return false
  }

  if (!event.replyToken) {
    return false
  }

  console.log('[line-weekly] command received', {
    botContext,
    commandType: weeklyCommand.commandType,
    directCommand: weeklyCommand.directCommand,
    mentionCommand: weeklyCommand.mentionCommand,
    mode: weeklyCommand.mode,
    hasReplyToken: Boolean(event.replyToken),
    sourceType: event.source?.type ?? null
  })

  try {
    const { eventCount, message } = await createWeeklyLineFlexMessage(undefined, {
      mode: weeklyCommand.mode,
      siteUrl: config.siteUrl
    })

    console.log('[line-weekly] events loaded', {
      count: eventCount
    })

    const imageUrls = collectFlexImageUrls(message)

    console.log('[line-weekly] flex created', {
      bubbleCount: message.type === 'flex' && message.contents.type === 'carousel'
        ? message.contents.contents.length
        : 1,
      hasCarousel: message.type === 'flex' && message.contents.type === 'carousel',
      imageCount: imageUrls.length
    })

    if (imageUrls.length > 0) {
      console.log('[line-weekly] organizer logo urls', {
        urls: imageUrls
      })
    }

    await replyLineMessage({
      channelAccessToken,
      replyToken: event.replyToken,
      messages: [message]
    })

    console.log('[line-weekly] reply success')
  } catch (error) {
    if (error instanceof LineMessageRequestError && error.endpoint === 'reply') {
      console.error('[line-weekly] reply failed', {
        status: error.status,
        body: error.responseBody
      })
    } else {
      console.error(
        '[line-weekly] reply failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }

    throw error
  }

  return true
}
