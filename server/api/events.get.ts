import { getPublishedEvents } from '~~/lib/notion'

export default defineEventHandler(async () => {
  const events = await getPublishedEvents()

  return events.sort((a, b) => {
    if (!a.startTime && !b.startTime) {
      return 0
    }

    if (!a.startTime) {
      return 1
    }

    if (!b.startTime) {
      return -1
    }

    return a.startTime.localeCompare(b.startTime)
  })
})
