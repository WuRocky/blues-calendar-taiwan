import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import { getOrganizerLogoUrls } from '~~/lib/events/organizerLogo'
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
  periodLabel?: string
  siteUrl?: string
  weekEnd: Dayjs
  weekStart: Dayjs
}

function getWeekdayLabel(value: Dayjs) {
  return WEEKDAY_LABELS[value.day()] ?? ''
}

function formatSummaryLine(periodLabel: string) {
  return `💙 ${periodLabel} Blues 活動`
}

function formatSummaryCountLine(periodLabel: string, count: number) {
  if (periodLabel === '下週') {
    return `下週共 ${count} 場活動`
  }

  return `本週共 ${count} 場活動`
}

function formatEmptySocialLine(periodLabel: string) {
  if (periodLabel === '下週') {
    return '下週目前沒有 Social 活動'
  }

  if (periodLabel === '近期') {
    return '近期目前沒有 Social 活動'
  }

  return '本週目前沒有 Social 活動'
}

function formatSummaryDateRange(weekStart: Dayjs, weekEnd: Dayjs) {
  return formatWeekRangeInline(
    weekStart.tz(TAIPEI_TIMEZONE),
    weekEnd.tz(TAIPEI_TIMEZONE)
  )
}

function formatAltText(periodLabel: string, weekStart: Dayjs, weekEnd: Dayjs, count: number) {
  return `${periodLabel} Blues 活動 ${formatWeekRangeInline(
    weekStart.tz(TAIPEI_TIMEZONE),
    weekEnd.tz(TAIPEI_TIMEZONE)
  )}，共 ${count} 場活動`
}

function getEventTypeBadgeLabel(eventType: string) {
  const label = getEventTypeLabel(eventType)

  if (label === 'Workshop') {
    return 'WorkShop'
  }

  return label
}

function getEventTypeBadgeStyle(eventType: string) {
  const normalized = eventType.toLowerCase()

  if (normalized === 'workshop') {
    return {
      backgroundColor: '#DDEEFE',
      color: '#1E5AA8'
    }
  }

  return {
    backgroundColor: '#D8F0E3',
    color: '#0F5132'
  }
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
  periodLabel: string,
  weekStart: Dayjs,
  weekEnd: Dayjs,
  count: number,
  events: readonly EventItem[]
): LineFlexBubble {
  const socialSummaryLines: LineFlexBox['contents'] = []
  const workshopSummaryLines: LineFlexBox['contents'] = []

  for (const event of events) {
    if (!event.startTime) {
      continue
    }

    const start = dayjs(event.startTime).tz(TAIPEI_TIMEZONE)
    const summaryLine = {
      type: 'text',
      text: `(${getWeekdayLabel(start)}) ${start.format('M/D')} ${event.name}`,
      size: 'sm',
      color: '#374151',
      wrap: true
    } satisfies LineFlexBox['contents'][number]

    if (event.eventType === 'workshop') {
      workshopSummaryLines.push(summaryLine)
      continue
    }

    socialSummaryLines.push(summaryLine)
  }

  const summaryContents: LineFlexBox['contents'] = [
    {
      type: 'text',
      text: formatSummaryLine(periodLabel),
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
    }
  ]

  if (socialSummaryLines.length > 0) {
    summaryContents.push({
      type: 'text',
      text: formatSummaryCountLine(periodLabel, socialSummaryLines.length),
      size: 'md',
      weight: 'bold',
      color: '#1F2937'
    })

    summaryContents.push(...socialSummaryLines)
  } else {
    summaryContents.push({
      type: 'text',
      text: formatEmptySocialLine(periodLabel),
      size: 'md',
      color: '#374151',
      wrap: true
    })
  }

  if (workshopSummaryLines.length > 0) {
    summaryContents.push({
      type: 'text',
      text: '近期 WorkShop',
      size: 'md',
      weight: 'bold',
      color: '#1F2937',
      margin: socialSummaryLines.length > 0 ? 'xl' : 'none'
    })

    summaryContents.push(...workshopSummaryLines)
  }

  summaryContents.push({
    type: 'text',
    text: '活動時間、地點與內容如有異動，請以主辦單位最新公告為準。',
    size: 'xs',
    color: '#888888',
    wrap: true,
    margin: 'md'
  })

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: summaryContents
    }
  }
}

function createEmptyStateBubble(periodLabel: string, weekStart: Dayjs, weekEnd: Dayjs): LineFlexBubble {
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
          text: formatSummaryLine(periodLabel),
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
          text: `${periodLabel}暫無 Blues 活動 💙`,
          size: 'md',
          wrap: true
        }
      ]
    }
  }
}

function createOrganizerContents(event: Pick<EventItem, 'organizer'>, siteUrl?: string): LineFlexBox | null {
  const organizerName = event.organizer.trim()

  if (!organizerName) {
    return null
  }

  const organizerLogoUrls = siteUrl ? getOrganizerLogoUrls(organizerName, siteUrl) : []
  const contents: LineFlexBox['contents'] = []

  if (organizerLogoUrls.length > 0) {
    contents.push({
      type: 'box',
      layout: 'horizontal',
      spacing: 'xs',
      flex: 0,
      contents: organizerLogoUrls.map((logo) => ({
        type: 'image' as const,
        url: logo.url,
        size: '20px',
        aspectMode: 'cover' as const,
        aspectRatio: '1:1',
        gravity: 'center' as const,
        flex: 0
      }))
    })
  }

  contents.push({
    type: 'text',
    text: organizerName,
    size: 'sm',
    color: '#4B5563',
    wrap: true,
    gravity: 'center',
    flex: 1
  })

  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    margin: 'xs',
    contents
  }
}

function createEventBubble(event: EventItem, siteUrl?: string): LineFlexBubble {
  const footer = createFooterButtons(event)
  const venueName = event.venueName.trim()
  const organizerContents = createOrganizerContents(event, siteUrl)
  const badgeStyle = getEventTypeBadgeStyle(event.eventType)
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
      backgroundColor: badgeStyle.backgroundColor,
      contents: [
        {
          type: 'text',
          text: getEventTypeBadgeLabel(event.eventType),
          size: 'xs',
          weight: 'bold',
          color: badgeStyle.color
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

  if (organizerContents) {
    bodyContents.push(organizerContents)
  }

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
  events,
  siteUrl,
  periodLabel = '本週'
}: FormatWeeklyEventsFlexMessageParams): LineFlexMessage {
  const altText = formatAltText(periodLabel, weekStart, weekEnd, events.length)

  if (events.length === 0) {
    return {
      type: 'flex',
      altText,
      contents: createEmptyStateBubble(periodLabel, weekStart, weekEnd)
    }
  }

  const eventBubbles = events.slice(0, MAX_EVENT_BUBBLES).map(event => createEventBubble(event, siteUrl))

  return {
    type: 'flex',
    altText,
    contents: {
      type: 'carousel',
      contents: [createSummaryBubble(periodLabel, weekStart, weekEnd, events.length, events), ...eventBubbles]
    }
  }
}
