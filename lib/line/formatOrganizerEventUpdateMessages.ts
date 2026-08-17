import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { OrganizerEditableEvent, OrganizerEventUpdatePatch } from '~~/lib/line/organizerEventUpdateNotion'
import type { OrganizerUpdateConfirmationRequest, OrganizerUpdateSelectionRequest } from '~~/lib/line/organizerUpdateState'
import type { LineFlexBox, LineFlexBubble, LineFlexMessage, LineTextMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

function formatEventDate(value: string) {
  return dayjs(value).tz(TAIPEI_TIMEZONE).format('YYYY/MM/DD')
}

function formatEventDateShort(value: string | null) {
  if (!value) {
    return '未設定'
  }

  return dayjs(value).tz(TAIPEI_TIMEZONE).format('M/D HH:mm')
}

function formatEventTimeRange(event: Pick<OrganizerEditableEvent, 'startTime' | 'endTime'>) {
  if (!event.startTime) {
    return '未設定'
  }

  const startText = dayjs(event.startTime).tz(TAIPEI_TIMEZONE).format('HH:mm')

  if (!event.endTime) {
    return startText
  }

  return `${startText}–${dayjs(event.endTime).tz(TAIPEI_TIMEZONE).format('HH:mm')}`
}

function formatPatchTimeRange(event: OrganizerEditableEvent, patch: OrganizerEventUpdatePatch) {
  const startValue = patch.startTime ?? event.startTime
  const endValue = patch.endTime ?? event.endTime

  if (!startValue) {
    return '未設定'
  }

  const startText = dayjs(startValue).tz(TAIPEI_TIMEZONE).format('HH:mm')

  if (!endValue) {
    return startText
  }

  return `${startText}–${dayjs(endValue).tz(TAIPEI_TIMEZONE).format('HH:mm')}`
}

function createPostbackButton(label: string, data: string, style: 'primary' | 'secondary' = 'secondary') {
  return {
    type: 'button' as const,
    style,
    height: 'sm' as const,
    action: {
      type: 'postback' as const,
      label,
      data,
      displayText: label
    }
  }
}

function createTextLine(text: string, size = 'sm', color = '#374151') {
  return {
    type: 'text' as const,
    text,
    size,
    color,
    wrap: true
  }
}

export function buildOrganizerUpdateRestrictedMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '此功能僅限活動組織者群組使用。'
  }
}

export function buildOrganizerUpdateFormatHelpMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '請使用固定格式，例如：\n@Bot 修改活動\n活動：Friday Blues\n日期：8/22\n開始時間：20:30'
  }
}

export function buildOrganizerUpdateNotFoundMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '找不到符合的活動，請確認活動名稱與日期。'
  }
}

export function buildOrganizerUpdateExpiredMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '這次修改確認已過期，請重新輸入修改活動。'
  }
}

export function buildOrganizerUpdateCancelledMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '這次修改已經取消。'
  }
}

export function buildOrganizerUpdateCompletedMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '這次修改已經完成。'
  }
}

export function buildOrganizerUpdateUnauthorizedMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '這次修改只能由提出修改的人確認。'
  }
}

export function buildOrganizerUpdateSuccessMessage(event: OrganizerEditableEvent, patch: OrganizerEventUpdatePatch): LineTextMessage {
  const lines = [
    `✅ 已更新 ${event.name}`,
    '',
    event.startTime ? formatEventDate(event.startTime) : '日期未設定'
  ]

  if (patch.startTime || patch.endTime) {
    lines.push(`時間：${formatPatchTimeRange(event, patch)}`)
  }

  if (patch.venueName !== undefined) {
    lines.push(`場地：${patch.venueName || '未設定'}`)
  }

  if (patch.price !== undefined) {
    lines.push(`費用：${patch.price || '未設定'}`)
  }

  return {
    type: 'text',
    text: lines.join('\n')
  }
}

export function buildOrganizerUpdateFailureMessage(): LineTextMessage {
  return {
    type: 'text',
    text: '⚠️ 更新失敗，請稍後再試。'
  }
}

export function buildOrganizerSelectionMessage(request: OrganizerUpdateSelectionRequest): LineFlexMessage {
  const contents: LineFlexBox['contents'] = [
    {
      type: 'text',
      text: '找到多筆活動',
      size: 'lg',
      weight: 'bold',
      wrap: true
    }
  ]

  request.candidates.forEach((candidate, index) => {
    contents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      contents: [
        createTextLine(`${index + 1}. ${candidate.name}`, 'md', '#111827'),
        createTextLine(`${formatEventDateShort(candidate.startTime)}${candidate.venueName ? `｜${candidate.venueName}` : ''}`, 'sm'),
        createPostbackButton(
          '選擇這筆活動',
          `organizer-update:select:${request.id}:${index}`,
          'primary'
        )
      ]
    })
  })

  contents.push({
    type: 'box',
    layout: 'vertical',
    margin: 'lg',
    contents: [
      createPostbackButton('取消', `organizer-update:cancel:${request.id}`, 'secondary')
    ]
  })

  return {
    type: 'flex',
    altText: '找到多筆活動，請選擇要修改的活動。',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        contents,
        spacing: 'sm'
      }
    }
  }
}

export function buildOrganizerConfirmationMessage(request: OrganizerUpdateConfirmationRequest): LineFlexMessage {
  const { event, patch } = request
  const bodyContents: LineFlexBox['contents'] = [
    {
      type: 'text',
      text: event.name,
      size: 'lg',
      weight: 'bold',
      wrap: true
    },
    createTextLine(event.startTime ? formatEventDate(event.startTime) : formatEventDate(request.eventDate), 'sm'),
    createTextLine('原本', 'sm', '#6B7280'),
    createTextLine(`時間：${formatEventTimeRange(event)}`, 'sm', '#111827'),
    createTextLine(`場地：${event.venueName || '未設定'}`, 'sm', '#111827'),
    createTextLine(`費用：${event.price || '未設定'}`, 'sm', '#111827'),
    {
      type: 'separator',
      margin: 'md',
      color: '#E5E7EB'
    },
    createTextLine('修改後', 'sm', '#6B7280'),
    createTextLine(`時間：${formatPatchTimeRange(event, patch)}`, 'sm', '#111827'),
    createTextLine(`場地：${(patch.venueName ?? event.venueName) || '未設定'}`, 'sm', '#111827'),
    createTextLine(`費用：${(patch.price ?? event.price) || '未設定'}`, 'sm', '#111827')
  ]

  return {
    type: 'flex',
    altText: `請確認是否更新 ${event.name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: bodyContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          createPostbackButton('確認修改', `organizer-update:confirm:${request.id}`, 'primary'),
          createPostbackButton('取消', `organizer-update:cancel:${request.id}`, 'secondary')
        ]
      }
    }
  }
}
