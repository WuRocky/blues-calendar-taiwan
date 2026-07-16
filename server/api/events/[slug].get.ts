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

  return matchedEvent
})
