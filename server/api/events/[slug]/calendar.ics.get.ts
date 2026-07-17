import { buildIcsContent, canAddEventToCalendar, getEventCalendarFilename } from '~~/lib/event-calendar'
import { getEventBySlug } from '~~/lib/notion'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing event slug'
    })
  }

  const matchedEvent = await getEventBySlug(slug)

  if (!matchedEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found'
    })
  }

  if (!canAddEventToCalendar(matchedEvent)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Event cannot be added to calendar'
    })
  }

  const siteUrl = useRuntimeConfig().public.siteUrl
  const ics = buildIcsContent(matchedEvent, siteUrl)

  if (!ics) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unable to generate calendar file for this event'
    })
  }

  setResponseHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${getEventCalendarFilename(matchedEvent)}"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store, max-age=0')

  return ics
})
