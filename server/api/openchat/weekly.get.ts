import { createWeeklyOpenChatFeed } from '~~/lib/openchat/createWeeklyOpenChatFeed'
import { verifyJobAuthorization } from '~~/lib/line/verifyJobAuthorization'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authorization = getHeader(event, 'authorization')

  if (!verifyJobAuthorization({
    authorization,
    lineJobSecret: config.openchatJobSecret
  })) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!config.openchatJobSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing OpenChat configuration'
    })
  }

  try {
    const feed = await createWeeklyOpenChatFeed({
      notionConfig: {
        token: config.notionToken,
        databaseId: config.notionEventsDatabaseId
      },
      siteUrl: config.public.siteUrl,
      lineAddFriendUrl: config.public.lineAddFriendUrl
    })

    return {
      success: true,
      ...feed
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('OpenChat weekly feed failed:', message)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate OpenChat weekly feed'
    })
  }
})
