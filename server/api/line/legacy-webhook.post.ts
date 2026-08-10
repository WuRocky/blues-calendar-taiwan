import { handleLineWebhook } from '~~/lib/line/handleLineWebhook'

export default defineEventHandler(async (event) => {
  return handleLineWebhook({
    event,
    channelSecret: useRuntimeConfig(event).lineLegacyChannelSecret
  })
})
