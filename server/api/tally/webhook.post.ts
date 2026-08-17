export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)

  console.log('[Tally webhook]', JSON.stringify(body, null, 2))

  return {
    success: true
  }
})
