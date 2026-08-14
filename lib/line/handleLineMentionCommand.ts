import { createWeeklyLineFlexMessage } from '~~/lib/line/createWeeklyLineFlexMessage'
import { replyLineMessage } from '~~/lib/line/pushLineMessage'

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
  replyToken?: string
  source?: {
    type?: string
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

export async function handleLineCommand(
  event: LineTextMessageEvent,
  channelAccessToken: string
) {
  if (!shouldReplyWeeklyEvents(event)) {
    return false
  }

  if (!event.replyToken) {
    return false
  }

  const { message } = await createWeeklyLineFlexMessage(undefined, {
    mode: 'remaining-week'
  })

  await replyLineMessage({
    channelAccessToken,
    replyToken: event.replyToken,
    messages: [message]
  })

  return true
}
