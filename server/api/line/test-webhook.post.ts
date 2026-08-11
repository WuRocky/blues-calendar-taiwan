import { handleLineWebhook } from '~~/lib/line/handleLineWebhook'

export default defineEventHandler(async (event) => {
  return handleLineWebhook({
    event,
    channelAccessToken: useRuntimeConfig(event).lineTestChannelAccessToken,
    channelSecret: useRuntimeConfig(event).lineTestChannelSecret
  })
})
