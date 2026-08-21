import { handleLineWebhook } from '~~/lib/line/handleLineWebhook'

export default defineEventHandler(async (event) => {
  return handleLineWebhook({
    botContext: 'test',
    event,
    channelAccessToken: useRuntimeConfig(event).lineTestChannelAccessToken,
    channelSecret: useRuntimeConfig(event).lineTestChannelSecret
  })
})
