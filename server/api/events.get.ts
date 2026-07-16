import { getPublishedEvents } from '~~/lib/notion'

export default defineEventHandler(async () => {
  return getPublishedEvents()
})
