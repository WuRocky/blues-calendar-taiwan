interface CursorPaginatedResponse<TItem> {
  has_more: boolean
  next_cursor: string | null
  results: TItem[]
}

interface CursorPaginationOptions {
  scope: string
}

type CursorPageFetcher<TItem> = (startCursor: string | null, pageNumber: number) => Promise<CursorPaginatedResponse<TItem>>

function isDevelopmentEnvironment() {
  return process.env.NODE_ENV !== 'production'
}

function logPaginationPage(scope: string, pageNumber: number) {
  if (!isDevelopmentEnvironment()) {
    return
  }

  console.info(`[events] Fetching Notion ${scope} page ${pageNumber}`)
}

function createPaginationError(scope: string, reason: string) {
  return new Error(`Failed to paginate Notion ${scope}: ${reason}`)
}

export async function collectPaginatedNotionResults<TItem>(
  fetchPage: CursorPageFetcher<TItem>,
  options: CursorPaginationOptions
) {
  const results: TItem[] = []
  const seenCursors = new Set<string>()
  let startCursor: string | null = null
  let pageNumber = 1

  while (true) {
    logPaginationPage(options.scope, pageNumber)

    const response = await fetchPage(startCursor, pageNumber)
    results.push(...response.results)

    if (!response.has_more || !response.next_cursor) {
      if (response.has_more && !response.next_cursor) {
        throw createPaginationError(options.scope, 'has_more was true but next_cursor was empty')
      }

      return results
    }

    if (seenCursors.has(response.next_cursor)) {
      throw createPaginationError(options.scope, 'received a repeated next_cursor')
    }

    seenCursors.add(response.next_cursor)
    startCursor = response.next_cursor
    pageNumber += 1
  }
}
