import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { formatLineEventBlock, formatWeekRangeLine } from '~~/lib/line/formatLineEventBlocks'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const MAX_LINE_TEXT_LENGTH = 5000

export interface FormatOrganizerPreviewMessageParams {
  events: readonly EventItem[]
  weekEnd: Dayjs
  weekStart: Dayjs
}

export function formatOrganizerPreviewMessage({
  weekStart,
  weekEnd,
  events
}: FormatOrganizerPreviewMessageParams) {
  const header = [
    '📋 下週 Blues 活動確認',
    formatWeekRangeLine(weekStart.tz(TAIPEI_TIMEZONE), weekEnd.tz(TAIPEI_TIMEZONE))
  ]

  if (!events.length) {
    return [
      ...header,
      '',
      '下週目前暫無 Blues 活動，請確認是否有尚未登錄的活動。',
      '',
      '請於週日前完成資料修正，週一將發送至公共群組。'
    ].join('\n')
  }

  const intro = [
    '請有活動的主辦人協助確認：',
    '・日期與時間',
    '・活動名稱',
    '・地點與連結',
    '・報名連結'
  ].join('\n')

  const blocks = events.map(event => formatLineEventBlock(event, 'weekly')).filter(Boolean)
  const messageParts = [header.join('\n'), intro]

  for (const block of blocks) {
    const candidate = [...messageParts, block].join('\n\n')

    if (candidate.length > MAX_LINE_TEXT_LENGTH) {
      break
    }

    messageParts.push(block)
  }

  const closing = '請於週日前完成資料修正，週一將發送至公共群組。'
  const withClosing = [...messageParts, closing].join('\n\n')

  return withClosing.length <= MAX_LINE_TEXT_LENGTH ? withClosing : messageParts.join('\n\n')
}
