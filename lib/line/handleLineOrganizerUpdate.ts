import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { applyOrganizerEventUpdate, buildOrganizerEventUpdatePatch, findOrganizerEventsByNameAndDate } from '~~/lib/line/organizerEventUpdateNotion'
import { isOrganizerUpdateCommand, parseOrganizerEventUpdateCommand } from '~~/lib/line/organizerEventUpdateParser'
import {
  buildOrganizerUpdateCompletedMessage,
  buildOrganizerConfirmationMessage,
  buildOrganizerSelectionMessage,
  buildOrganizerUpdateCancelledMessage,
  buildOrganizerUpdateExpiredMessage,
  buildOrganizerUpdateFailureMessage,
  buildOrganizerUpdateFormatHelpMessage,
  buildOrganizerUpdateNotFoundMessage,
  buildOrganizerUpdateSuccessMessage,
  buildOrganizerUpdateUnauthorizedMessage
} from '~~/lib/line/formatOrganizerEventUpdateMessages'
import {
  createOrganizerConfirmationRequest,
  createOrganizerSelectionRequest,
  getOrganizerPendingRequest,
  markOrganizerPendingRequestStatus
} from '~~/lib/line/organizerUpdateState'
import { replyLineMessage, type LinePushMessage } from '~~/lib/line/pushLineMessage'
import type { NotionRuntimeConfig } from '~~/lib/notion-connection'
import type { LineTextMessageEvent } from '~~/lib/line/handleLineMentionCommand'

dayjs.extend(utc)
dayjs.extend(timezone)

const ORGANIZER_POSTBACK_PREFIX = 'organizer-update'

export interface OrganizerCommandRuntimeConfig extends NotionRuntimeConfig {
  lineOrganizerGroupId?: string
  lineTestGroupId?: string
}

interface OrganizerPostbackEvent extends LineTextMessageEvent {
  postback?: {
    data?: string
  }
  source?: {
    groupId?: string
    type?: string
    userId?: string
  }
}

function stripSelfMentions(text: string, mentionees: Array<{ index: number, isSelf?: boolean, length: number }> = []) {
  const segments = mentionees
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
  if (event.type !== 'message' || event.source?.type !== 'group' || event.message?.type !== 'text') {
    return null
  }

  const text = typeof event.message.text === 'string' ? event.message.text : ''
  const mentionees = event.message.mention?.mentionees ?? []

  if (!mentionees.some(mentionee => mentionee.isSelf)) {
    return null
  }

  return stripSelfMentions(text, mentionees)
}

function isAllowedOrganizerGroup(event: OrganizerPostbackEvent, config: OrganizerCommandRuntimeConfig) {
  if (event.source?.type !== 'group') {
    return false
  }

  const allowedGroupIds = [
    config.lineOrganizerGroupId,
    config.lineTestGroupId
  ].filter((groupId): groupId is string => Boolean(groupId))

  return allowedGroupIds.includes(event.source.groupId || '')
}

async function reply(channelAccessToken: string, replyToken: string | undefined, message: LinePushMessage) {
  if (!replyToken) {
    return false
  }

  await replyLineMessage({
    channelAccessToken,
    replyToken,
    messages: [message]
  })

  return true
}

function parseOrganizerPostback(data: string | undefined) {
  if (!data || !data.startsWith(`${ORGANIZER_POSTBACK_PREFIX}:`)) {
    return null
  }

  const [, action, requestId, candidateIndexText] = data.split(':')

  if (!action || !requestId) {
    return null
  }

  return {
    action,
    candidateIndex: candidateIndexText ? Number(candidateIndexText) : null,
    requestId
  }
}

export async function handleOrganizerUpdateMessage(
  event: OrganizerPostbackEvent,
  channelAccessToken: string,
  config: OrganizerCommandRuntimeConfig
) {
  const command = getMentionCommand(event)

  if (!command || !isOrganizerUpdateCommand(command)) {
    return false
  }

  if (!isAllowedOrganizerGroup(event, config)) {
    return false
  }

  const parsedCommand = parseOrganizerEventUpdateCommand(command)

  if ('reason' in parsedCommand) {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFormatHelpMessage())
    return true
  }

  const matches = await findOrganizerEventsByNameAndDate(
    parsedCommand.eventName,
    parsedCommand.eventDate,
    config
  )

  if (matches.length === 0) {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateNotFoundMessage())
    return true
  }

  if (matches.length > 1) {
    const request = await createOrganizerSelectionRequest({
      candidates: matches,
      eventDate: parsedCommand.eventDate.toISOString(),
      fields: parsedCommand.fields,
      groupId: event.source?.groupId || '',
      requestUserId: event.source?.userId || ''
    })

    console.log('[line-organizer] update request created')
    await reply(channelAccessToken, event.replyToken, buildOrganizerSelectionMessage(request))
    return true
  }

  const matchedEvent = matches[0]

  if (!matchedEvent) {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFailureMessage())
    return true
  }

  const patch = buildOrganizerEventUpdatePatch(matchedEvent, parsedCommand.eventDate, parsedCommand.fields)
  const request = await createOrganizerConfirmationRequest({
    event: matchedEvent,
    eventDate: parsedCommand.eventDate.toISOString(),
    fields: parsedCommand.fields,
    groupId: event.source?.groupId || '',
    patch,
    requestUserId: event.source?.userId || ''
  })

  console.log('[line-organizer] update request created')
  await reply(channelAccessToken, event.replyToken, buildOrganizerConfirmationMessage(request))
  return true
}

export async function handleOrganizerUpdatePostback(
  event: OrganizerPostbackEvent,
  channelAccessToken: string,
  config: OrganizerCommandRuntimeConfig
) {
  if (event.type !== 'postback' || event.source?.type !== 'group') {
    return false
  }

  const parsedPostback = parseOrganizerPostback(event.postback?.data)

  if (!parsedPostback) {
    return false
  }

  if (!isAllowedOrganizerGroup(event, config)) {
    return false
  }

  const pendingRequest = await getOrganizerPendingRequest(parsedPostback.requestId)

  if (!pendingRequest) {
    console.log('[line-organizer] update expired')
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateExpiredMessage())
    return true
  }

  if (pendingRequest.status === 'completed') {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateCompletedMessage())
    return true
  }

  if (pendingRequest.status === 'cancelled') {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateCancelledMessage())
    return true
  }

  if (pendingRequest.status === 'expired') {
    console.log('[line-organizer] update expired')
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateExpiredMessage())
    return true
  }

  if (pendingRequest.status !== 'pending') {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFailureMessage())
    return true
  }

  if (
    pendingRequest.groupId !== event.source.groupId
    || pendingRequest.requestUserId !== (event.source.userId || '')
  ) {
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateUnauthorizedMessage())
    return true
  }

  if (parsedPostback.action === 'cancel') {
    await markOrganizerPendingRequestStatus(pendingRequest.id, 'cancelled')
    console.log('[line-organizer] update cancelled')
    await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateCancelledMessage())
    return true
  }

  if (pendingRequest.kind === 'selection' && parsedPostback.action === 'select') {
    const candidateIndex = parsedPostback.candidateIndex
    const candidate = candidateIndex !== null && Number.isInteger(candidateIndex)
      ? pendingRequest.candidates[candidateIndex]
      : null

    if (!candidate) {
      await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFailureMessage())
      return true
    }

    const patch = buildOrganizerEventUpdatePatch(
      candidate,
      dayjs(pendingRequest.eventDate),
      pendingRequest.fields
    )

    const confirmationRequest = await createOrganizerConfirmationRequest({
      event: candidate,
      eventDate: pendingRequest.eventDate,
      fields: pendingRequest.fields,
      groupId: pendingRequest.groupId,
      patch,
      requestUserId: pendingRequest.requestUserId
    })

    await markOrganizerPendingRequestStatus(pendingRequest.id, 'completed')
    console.log('[line-organizer] update request created')
    await reply(channelAccessToken, event.replyToken, buildOrganizerConfirmationMessage(confirmationRequest))
    return true
  }

  if (pendingRequest.kind === 'confirmation' && parsedPostback.action === 'confirm') {
    try {
      const lockedRequest = await markOrganizerPendingRequestStatus(pendingRequest.id, 'processing')

      if (!lockedRequest || lockedRequest.status !== 'processing') {
        await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFailureMessage())
        return true
      }

      await applyOrganizerEventUpdate(pendingRequest.event.pageId, pendingRequest.patch, config)
      await markOrganizerPendingRequestStatus(pendingRequest.id, 'completed')
      console.log('[line-organizer] update confirmed')
      await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateSuccessMessage(pendingRequest.event, pendingRequest.patch))
    } catch (error) {
      await markOrganizerPendingRequestStatus(pendingRequest.id, 'pending')
      console.error(
        '[line-organizer] update failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
      await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFailureMessage())
    }

    return true
  }

  await reply(channelAccessToken, event.replyToken, buildOrganizerUpdateFailureMessage())
  return true
}
