export type EventType =
  | 'class'
  | 'social'
  | 'event'
  | 'workshop'
  | 'open-floor'
  | 'party'
  | 'festival'
  | 'other'

export type EventTimeStatus =
  | 'upcoming'
  | 'ongoing'
  | 'ended'
  | 'unscheduled'
  | 'invalid'

export type EventStatus =
  | 'scheduled'
  | 'cancelled'
  | 'postponed'

export interface BaseEventItem {
  id: string
  slug: string
  name: string
  status: string
  eventStatus: EventStatus
  eventType: EventType
  summary: string
  description: string
  startTime: string | null
  endTime: string | null
  startTimeIsDateOnly: boolean
  endTimeIsDateOnly: boolean
  venueName: string
  venueUrl: string
  address: string
  city: string
  organizer: string
  weekday: string | null
  weekdayOrder: number | null
  price: string
  level: string
  registrationUrl: string
  coverImageUrl: string
  recurring: boolean
  recurringText: string
  published: boolean
}

export interface EventItem extends BaseEventItem {
  timeStatus: EventTimeStatus
}
