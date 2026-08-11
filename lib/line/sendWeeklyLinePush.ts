import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { createWeeklyLineFlexMessage } from '~~/lib/line/createWeeklyLineFlexMessage'
import { pushLineMessage } from '~~/lib/line/pushLineMessage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface WeeklyLinePushConfig {
  lineChannelAccessToken: string
  lineGroupId: string
  now?: Dayjs
}

export interface WeeklyLinePushResult {
  eventCount: number
}

export async function sendWeeklyLinePush({
  lineGroupId,
  lineChannelAccessToken,
  now = dayjs()
}: WeeklyLinePushConfig): Promise<WeeklyLinePushResult> {
  if (!lineGroupId || !lineChannelAccessToken) {
    throw new Error('Missing LINE configuration')
  }

  const { eventCount, message } = await createWeeklyLineFlexMessage(now)

  await pushLineMessage({
    channelAccessToken: lineChannelAccessToken,
    targetId: lineGroupId,
    messages: [message]
  })

  return {
    eventCount
  }
}
