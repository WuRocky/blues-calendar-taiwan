import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getNextWeeklyEvents } from '~~/lib/events/getNextWeeklyEvents'
import { getNextTaipeiWeekRange } from '~~/lib/events/weeklyEvents'
import { formatOrganizerPreviewMessage } from '~~/lib/line/formatOrganizerPreviewMessage'
import { pushLineTextMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface OrganizerPreviewLinePushConfig {
  lineChannelAccessToken: string
  lineOrganizerGroupId: string
  now?: Dayjs
}

export interface OrganizerPreviewLinePushResult {
  eventCount: number
}

export async function sendOrganizerPreviewLinePush({
  lineOrganizerGroupId,
  lineChannelAccessToken,
  now = dayjs()
}: OrganizerPreviewLinePushConfig): Promise<OrganizerPreviewLinePushResult> {
  if (!lineOrganizerGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const nextWeeklyEvents = await getNextWeeklyEvents(now)
  const weekRange = getNextTaipeiWeekRange(now)
  const message = formatOrganizerPreviewMessage({
    weekStart: weekRange.start,
    weekEnd: weekRange.end,
    events: nextWeeklyEvents
  })

  await pushLineTextMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: lineOrganizerGroupId,
    text: message
  })

  return {
    eventCount: nextWeeklyEvents.length
  }
}
