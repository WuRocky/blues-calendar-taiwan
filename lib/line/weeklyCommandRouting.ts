import type { WeeklyEventQueryMode } from '~~/lib/events/weeklyEvents'

export interface LineMentionee {
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

export type LineBotContext = 'production' | 'test' | 'legacy'

export interface WeeklyCommandMatch {
  commandType: 'direct' | 'mention'
  directCommand: string | null
  mentionCommand: string | null
  mode: WeeklyEventQueryMode
}

const DIRECT_COMMAND_MODES: Record<LineBotContext, Partial<Record<string, WeeklyEventQueryMode>>> = {
  production: {
    本週活動: 'remaining-week'
  },
  test: {
    本週活動: 'remaining-week'
  },
  legacy: {
    本週活動: 'remaining-week'
  }
}

const MENTION_COMMAND_MODES: Record<LineBotContext, Partial<Record<string, WeeklyEventQueryMode>>> = {
  production: {
    本週活動: 'remaining-week'
  },
  test: {
    活動: 'remaining-and-next-week',
    本週活動: 'remaining-week',
    下週活動: 'next-week'
  },
  legacy: {
    '': 'remaining-week',
    活動: 'remaining-week',
    本週活動: 'remaining-week'
  }
}

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

export function resolveWeeklyCommand(
  event: LineTextMessageEvent,
  botContext: LineBotContext
): WeeklyCommandMatch | null {
  const directCommand = getDirectCommand(event)

  if (directCommand) {
    const mode = DIRECT_COMMAND_MODES[botContext][directCommand]

    if (mode) {
      return {
        commandType: 'direct',
        directCommand,
        mentionCommand: null,
        mode
      }
    }
  }

  const mentionCommand = getMentionCommand(event)

  if (mentionCommand === null) {
    return null
  }

  const mode = MENTION_COMMAND_MODES[botContext][mentionCommand]

  if (!mode) {
    return null
  }

  return {
    commandType: 'mention',
    directCommand,
    mentionCommand,
    mode
  }
}
