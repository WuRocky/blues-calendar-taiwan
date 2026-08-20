import { createWeeklyLineFlexMessage } from '~~/lib/line/createWeeklyLineFlexMessage'
import type { OrganizerCommandRuntimeConfig } from '~~/lib/line/handleLineOrganizerUpdate'
import { handleOrganizerUpdateMessage, handleOrganizerUpdatePostback } from '~~/lib/line/handleLineOrganizerUpdate'
import { LineMessageRequestError, replyLineMessage } from '~~/lib/line/pushLineMessage'

interface LineMentionee {
  index: number
  isSelf?: boolean
  length: number
}

interface LineTextMessageMention {
  mentionees?: LineMentionee[]
}

export interface LineTextMessageEvent {
  message?: {
    mention?: LineTextMessageMention
    text?: string
    type?: string
  }
  postback?: {
    data?: string
  }
  replyToken?: string
  source?: {
    groupId?: string
    type?: string
    userId?: string
  }
  type?: string
}

const SUPPORTED_WEEKLY_COMMANDS = new Set(['', '活動', '本週活動'])
const RICH_MENU_WEEKLY_COMMAND = '本週活動'

function stripSelfMentions(text: string, mentionees: readonly LineMentionee[]) {
  const segments = [...mentionees]
    .filter(mentionee => mentionee.isSelf)
    .sort((left, right) => right.index - left.index)

  let result = text

  for (const mentionee of segments) {
    result =
      result.slice(0, mentionee.index) +
      result.slice(mentionee.index + mentionee.length)
  }

  return result.trim()
}

function getMentionCommand(event: LineTextMessageEvent) {
  if (event.type !== 'message') {
    return null
  }

  if (event.source?.type !== 'group') {
    return null
  }

  if (event.message?.type !== 'text') {
    return null
  }

  const text = typeof event.message.text === 'string' ? event.message.text : ''
  const mentionees = event.message.mention?.mentionees ?? []
  const hasSelfMention = mentionees.some(mentionee => mentionee.isSelf)

  if (!hasSelfMention) {
    return null
  }

  return stripSelfMentions(text, mentionees)
}

function getDirectCommand(event: LineTextMessageEvent) {
  if (event.type !== 'message') {
    return null
  }

  if (event.message?.type !== 'text') {
    return null
  }

  const text = typeof event.message.text === 'string' ? event.message.text.trim() : ''
  return text || null
}

function shouldReplyWeeklyEvents(event: LineTextMessageEvent) {
  const directCommand = getDirectCommand(event)

  if (directCommand === RICH_MENU_WEEKLY_COMMAND) {
    return true
  }

  const mentionCommand = getMentionCommand(event)
  return mentionCommand !== null && SUPPORTED_WEEKLY_COMMANDS.has(mentionCommand)
}

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
  config: OrganizerCommandRuntimeConfig
) {
  if (await handleOrganizerUpdatePostback(event, channelAccessToken, config)) {
    return true
  }

  if (await handleOrganizerUpdateMessage(event, channelAccessToken, config)) {
    return true
  }

  if (!shouldReplyWeeklyEvents(event)) {
    return false
  }

  if (!event.replyToken) {
    return false
  }

  const directCommand = getDirectCommand(event)
  const mentionCommand = getMentionCommand(event)

  console.log('[line-weekly] command received', {
    commandType: directCommand === RICH_MENU_WEEKLY_COMMAND ? 'direct' : 'mention',
    directCommand: directCommand ?? null,
    mentionCommand: mentionCommand ?? null,
    hasReplyToken: Boolean(event.replyToken),
    sourceType: event.source?.type ?? null
  })

  try {
    const { eventCount, message } = await createWeeklyLineFlexMessage(undefined, {
      mode: 'remaining-week',
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
