import { handleLineWebhook } from '~~/lib/line/handleLineWebhook'

export default defineEventHandler(async (event) => {
  return handleLineWebhook({
    botContext: 'legacy',
    event,
    channelAccessToken: useRuntimeConfig(event).lineLegacyChannelAccessToken,
    channelSecret: useRuntimeConfig(event).lineLegacyChannelSecret
  })
})
