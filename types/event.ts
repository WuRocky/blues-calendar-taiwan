export type EventType =
  | 'class'
  | 'social'
  | 'event'
  | 'workshop'
  | 'open-floor'
  | 'party'
  | 'festival'
  | 'other'

export interface EventItem {
  id: string
  slug: string
  name: string
  status: string
  eventType: EventType
  summary: string
  description: string
  startTime: string | null
  endTime: string | null
  venueName: string
  venueUrl: string
  address: string
  city: string
  organizer: string
  price: string
  level: string
  registrationUrl: string
  coverImageUrl: string
  recurring: boolean
  recurringText: string
  published: boolean
}
