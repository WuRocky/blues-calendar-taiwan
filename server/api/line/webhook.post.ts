import { handleLineWebhook } from '~~/lib/line/handleLineWebhook'

export default defineEventHandler(async (event) => {
  return handleLineWebhook({
    botContext: 'production',
    event,
    channelAccessToken: useRuntimeConfig(event).lineChannelAccessToken,
    channelSecret: useRuntimeConfig(event).lineChannelSecret
  })
})
