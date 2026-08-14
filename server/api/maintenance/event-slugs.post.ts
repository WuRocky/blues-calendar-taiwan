import { ensureMissingEventSlugs } from '~~/lib/events/ensureMissingEventSlugs'
import { verifyJobAuthorization } from '~~/lib/line/verifyJobAuthorization'

function parseDryRun(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return false
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authorization = getHeader(event, 'authorization')

  if (!verifyJobAuthorization({
    authorization,
    lineJobSecret: config.lineJobSecret
  })) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody<{ dryRun?: boolean | string }>(event).catch((): { dryRun?: boolean | string } => ({}))
  const query = getQuery(event)
  const dryRun = parseDryRun(body.dryRun ?? query.dryRun)

  try {
    const result = await ensureMissingEventSlugs({
      dryRun,
      runtimeConfig: {
        notionEventsDatabaseId: config.notionEventsDatabaseId,
        notionToken: config.notionToken
      }
    })

    return {
      success: true,
      dryRun: result.dryRun,
      foundMissingSlugCount: result.foundMissingSlugCount,
      skippedExistingCount: result.skippedExistingCount,
      updated: result.updated
    }
  } catch (error) {
    console.error(
      'Failed to ensure missing event slugs:',
      error instanceof Error ? error.message : 'Unknown error'
    )

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to ensure event slugs'
    })
  }
})
