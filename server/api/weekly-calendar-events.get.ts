import { getHomeCalendarEvents } from '~~/lib/notion'

export default defineEventHandler(async () => {
  return getHomeCalendarEvents()
})
