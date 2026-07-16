import type { BaseEventItem, EventItem, EventStatus } from '~~/types/event'

export interface NormalizedEventStatusResult {
  eventStatus: EventStatus
  warningReason: string | null
}

export type EventDisplayStatus =
  | 'cancelled'
  | 'postponed'
  | 'ongoing'
  | null

export function normalizeEventStatus(value: string): NormalizedEventStatusResult {
  const normalizedValue = value.trim().toLowerCase()

  if (!normalizedValue) {
    return {
      eventStatus: 'scheduled',
      warningReason: 'missing Event Status'
    }
  }

  if (normalizedValue === 'scheduled') {
    return {
      eventStatus: 'scheduled',
      warningReason: null
    }
  }

  if (normalizedValue === 'cancelled') {
    return {
      eventStatus: 'cancelled',
      warningReason: null
    }
  }

  if (normalizedValue === 'postponed') {
    return {
      eventStatus: 'postponed',
      warningReason: null
    }
  }

  return {
    eventStatus: 'scheduled',
    warningReason: `unknown Event Status "${value}"`
  }
}

export function getEventDisplayStatus(event: Pick<EventItem, 'eventStatus' | 'timeStatus'>): EventDisplayStatus {
  if (event.eventStatus === 'cancelled') {
    return 'cancelled'
  }

  if (event.eventStatus === 'postponed') {
    return 'postponed'
  }

  if (event.timeStatus === 'ongoing') {
    return 'ongoing'
  }

  return null
}

export function getEventDisplayStatusLabel(displayStatus: EventDisplayStatus) {
  if (displayStatus === 'cancelled') {
    return '已取消'
  }

  if (displayStatus === 'postponed') {
    return '已延期'
  }

  if (displayStatus === 'ongoing') {
    return '進行中'
  }

  return ''
}

export function isEventRegistrationUnavailable(event: Pick<BaseEventItem, 'eventStatus'>) {
  return event.eventStatus === 'cancelled' || event.eventStatus === 'postponed'
}

export function getEventRegistrationNotice(event: Pick<BaseEventItem, 'eventStatus'>) {
  if (event.eventStatus === 'cancelled') {
    return '此活動已取消'
  }

  if (event.eventStatus === 'postponed') {
    return '此活動已延期，請等待主辦單位更新資訊'
  }

  return ''
}

export function isEventStatusMuted(event: Pick<BaseEventItem, 'eventStatus'>) {
  return event.eventStatus === 'cancelled' || event.eventStatus === 'postponed'
}

export function shouldRetainEventByTimeStatus(event: Pick<EventItem, 'timeStatus'>) {
  return event.timeStatus === 'ongoing' || event.timeStatus === 'upcoming' || event.timeStatus === 'unscheduled'
}

export function shouldRetainCalendarEventByTimeStatus(event: Pick<EventItem, 'timeStatus'>) {
  return event.timeStatus === 'ongoing' || event.timeStatus === 'upcoming'
}
