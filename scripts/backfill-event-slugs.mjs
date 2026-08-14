import fs from 'node:fs'
import path from 'node:path'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const { ensureMissingEventSlugs } = jiti('../lib/events/ensureMissingEventSlugs.ts')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const contents = fs.readFileSync(filePath, 'utf8')
  const entries = {}

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex < 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1)
    }

    entries[key] = value
  }

  return entries
}

function loadLocalEnvironment() {
  const cwd = process.cwd()
  const envPaths = [
    path.join(cwd, '.env'),
    path.join(cwd, '.env.local'),
    path.join(cwd, '.dev.vars')
  ]

  return envPaths.reduce((combined, filePath) => {
    return {
      ...combined,
      ...parseEnvFile(filePath)
    }
  }, {})
}

function formatChange(change) {
  return `- ${change.name} → ${change.slug}`
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const localEnvironment = loadLocalEnvironment()
  const notionToken = process.env.NOTION_TOKEN || localEnvironment.NOTION_TOKEN || process.env.NUXT_NOTION_TOKEN || localEnvironment.NUXT_NOTION_TOKEN || ''
  const notionEventsDatabaseId = process.env.NOTION_EVENTS_DATABASE_ID || localEnvironment.NOTION_EVENTS_DATABASE_ID || process.env.NUXT_NOTION_EVENTS_DATABASE_ID || localEnvironment.NUXT_NOTION_EVENTS_DATABASE_ID || ''

  const result = await ensureMissingEventSlugs({
    dryRun,
    notionConfig: {
      notionEventsDatabaseId,
      notionToken
    }
  })

  console.log(`Found ${result.foundMissingSlugCount} events without slug`)
  console.log('')
  console.log(dryRun ? 'Planned updates:' : 'Updated:')

  if (result.updated.length > 0) {
    for (const change of result.updated) {
      console.log(formatChange(change))
    }
  } else {
    console.log('- None')
  }

  console.log('')
  console.log(`Skipped: ${result.skippedExistingCount} events already have slug`)
  console.log(`Completed: ${result.updated.length} ${dryRun ? 'planned' : 'updated'}`)
}

main().catch((error) => {
  console.error(
    'Failed to backfill event slugs:',
    error instanceof Error ? error.message : 'Unknown error'
  )
  process.exitCode = 1
})
