import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import {
  formatWeekRangeInline,
  getEventTypeLabel,
  getValidHttpUrl
} from '~~/lib/line/formatLineEventBlocks'
import type {
  LineFlexBox,
  LineFlexBubble,
  LineFlexButton,
  LineFlexMessage
} from '~~/lib/line/pushLineMessage'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const
const MAX_EVENT_BUBBLES = 11

export interface FormatWeeklyEventsFlexMessageParams {
  events: readonly EventItem[]
  weekEnd: Dayjs
  weekStart: Dayjs
}

function getWeekdayLabel(value: Dayjs) {
  return WEEKDAY_LABELS[value.day()] ?? ''
}

function formatSummaryLine(weekStart: Dayjs, weekEnd: Dayjs) {
  return `💙 本週 Blues 活動`
}

function formatSummaryDateRange(weekStart: Dayjs, weekEnd: Dayjs) {
  return formatWeekRangeInline(
    weekStart.tz(TAIPEI_TIMEZONE),
    weekEnd.tz(TAIPEI_TIMEZONE)
  )
}

function formatAltText(weekStart: Dayjs, weekEnd: Dayjs, count: number) {
  return `本週 Blues 活動 ${formatWeekRangeInline(
    weekStart.tz(TAIPEI_TIMEZONE),
    weekEnd.tz(TAIPEI_TIMEZONE)
  )}，共 ${count} 場活動`
}

function getEventTypeBadgeLabel(eventType: string) {
  return getEventTypeLabel(eventType).toUpperCase()
}

function formatEventDateTime(event: Pick<EventItem, 'startTime' | 'startTimeIsDateOnly'>) {
  if (!event.startTime) {
    return ''
  }

  const start = dayjs(event.startTime).tz(TAIPEI_TIMEZONE)
  const datePart = `${start.format('M/D')}（${getWeekdayLabel(start)}）`

  if (event.startTimeIsDateOnly) {
    return datePart
  }

  return `${datePart} ${start.format('HH:mm')}`
}

function createButton(label: string, uri: string): LineFlexButton {
  return {
    type: 'button',
    style: 'secondary',
    height: 'sm',
    flex: 1,
    action: {
      type: 'uri',
      label,
      uri
    }
  }
}

function createFooterButtons(event: Pick<EventItem, 'registrationUrl' | 'venueUrl'>): LineFlexBox | undefined {
  const buttons: LineFlexButton[] = []
  const venueUrl = getValidHttpUrl(event.venueUrl)
  const registrationUrl = getValidHttpUrl(event.registrationUrl)

  if (venueUrl) {
    buttons.push(createButton('查看地點', venueUrl))
  }

  if (registrationUrl) {
    buttons.push(createButton('活動資訊', registrationUrl))
  }

  if (!buttons.length) {
    return undefined
  }

  return {
    type: 'box',
    layout: buttons.length > 1 ? 'horizontal' : 'vertical',
    spacing: 'sm',
    contents: buttons
  }
}

function createSummaryBubble(
  weekStart: Dayjs,
  weekEnd: Dayjs,
  count: number,
  events: readonly EventItem[]
): LineFlexBubble {
  const eventSummaryLines: LineFlexBox['contents'] = []

  for (const event of events) {
    if (!event.startTime) {
      continue
    }

    const start = dayjs(event.startTime).tz(TAIPEI_TIMEZONE)
    eventSummaryLines.push({
      type: 'text',
      text: `(${getWeekdayLabel(start)}) ${event.name}`,
      size: 'sm',
      color: '#374151',
      wrap: true
    })
  }

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: formatSummaryLine(weekStart, weekEnd),
          weight: 'bold',
          size: 'lg',
          wrap: true
        },
        {
          type: 'text',
          text: formatSummaryDateRange(weekStart, weekEnd),
          size: 'sm',
          color: '#4B5563',
          wrap: true
        },
        {
          type: 'text',
          text: `本週共 ${count} 場活動`,
          size: 'md',
          weight: 'bold',
          color: '#1F2937'
        },
        ...eventSummaryLines
      ]
    }
  }
}

function createEmptyStateBubble(weekStart: Dayjs, weekEnd: Dayjs): LineFlexBubble {
  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: formatSummaryLine(weekStart, weekEnd),
          weight: 'bold',
          size: 'lg',
          wrap: true
        },
        {
          type: 'text',
          text: formatSummaryDateRange(weekStart, weekEnd),
          size: 'sm',
          color: '#4B5563',
          wrap: true
        },
        {
          type: 'text',
          text: '本週暫無 Blues 活動 💙',
          size: 'md',
          wrap: true
        }
      ]
    }
  }
}

function createEventBubble(event: EventItem): LineFlexBubble {
  const footer = createFooterButtons(event)
  const venueName = event.venueName.trim()
  const bodyContents: LineFlexBox['contents'] = [
    {
      type: 'text',
      text: formatEventDateTime(event),
      size: 'sm',
      color: '#4B5563',
      wrap: true
    },
    {
      type: 'box',
      layout: 'vertical',
      paddingTop: '4px',
      paddingBottom: '4px',
      paddingStart: '8px',
      paddingEnd: '8px',
      cornerRadius: '999px',
      backgroundColor: '#D8F0E3',
      contents: [
        {
          type: 'text',
          text: getEventTypeBadgeLabel(event.eventType),
          size: 'xs',
          weight: 'bold',
          color: '#0F5132'
        }
      ]
    },
    {
      type: 'text',
      text: event.name,
      size: 'xl',
      weight: 'bold',
      wrap: true,
      maxLines: 3
    }
  ]

  if (venueName) {
    bodyContents.push({
      type: 'text',
      text: `📍 ${venueName}`,
      size: 'sm',
      color: '#4B5563',
      wrap: true,
      maxLines: 2
    })
  }

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: bodyContents
    },
    footer
  }
}

export function formatWeeklyEventsFlexMessage({
  weekStart,
  weekEnd,
  events
}: FormatWeeklyEventsFlexMessageParams): LineFlexMessage {
  const altText = formatAltText(weekStart, weekEnd, events.length)

  if (events.length === 0) {
    return {
      type: 'flex',
      altText,
      contents: createEmptyStateBubble(weekStart, weekEnd)
    }
  }

  const eventBubbles = events.slice(0, MAX_EVENT_BUBBLES).map(createEventBubble)

  return {
    type: 'flex',
    altText,
    contents: {
      type: 'carousel',
      contents: [createSummaryBubble(weekStart, weekEnd, events.length, events), ...eventBubbles]
    }
  }
}
