import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const jiti = jitiFactory(import.meta.url)
const { collectPaginatedNotionResults } = jiti('../lib/notion-pagination.ts')

function makeResponse({ results, hasMore, nextCursor }) {
  return {
    results,
    has_more: hasMore,
    next_cursor: nextCursor
  }
}

async function expectReject(promise, pattern) {
  await assert.rejects(promise, (error) => {
    assert.match(String(error?.statusMessage || error?.message || error), pattern)
    return true
  })
}

const singlePage = await collectPaginatedNotionResults(async (cursor) => {
  assert.equal(cursor, null)
  return makeResponse({
    results: ['a', 'b'],
    hasMore: false,
    nextCursor: null
  })
}, {
  scope: 'single-page'
})

assert.deepEqual(singlePage, ['a', 'b'])

const exactlyOneHundred = await collectPaginatedNotionResults(async () => {
  return makeResponse({
    results: Array.from({ length: 100 }, (_, index) => index + 1),
    hasMore: false,
    nextCursor: null
  })
}, {
  scope: 'exactly-one-hundred'
})

assert.equal(exactlyOneHundred.length, 100)

const oneHundredAndOne = await collectPaginatedNotionResults(async (cursor) => {
  if (cursor === null) {
    return makeResponse({
      results: Array.from({ length: 100 }, (_, index) => index + 1),
      hasMore: true,
      nextCursor: 'cursor-2'
    })
  }

  assert.equal(cursor, 'cursor-2')
  return makeResponse({
    results: [101],
    hasMore: false,
    nextCursor: null
  })
}, {
  scope: 'one-hundred-and-one'
})

assert.equal(oneHundredAndOne.length, 101)
assert.equal(oneHundredAndOne.at(-1), 101)

const multiPage = await collectPaginatedNotionResults(async (cursor) => {
  if (cursor === null) {
    return makeResponse({
      results: ['page-1-a', 'page-1-b'],
      hasMore: true,
      nextCursor: 'cursor-2'
    })
  }

  if (cursor === 'cursor-2') {
    return makeResponse({
      results: ['page-2-a', 'page-2-b'],
      hasMore: true,
      nextCursor: 'cursor-3'
    })
  }

  assert.equal(cursor, 'cursor-3')
  return makeResponse({
    results: ['page-3-a'],
    hasMore: false,
    nextCursor: null
  })
}, {
  scope: 'multi-page'
})

assert.deepEqual(multiPage, ['page-1-a', 'page-1-b', 'page-2-a', 'page-2-b', 'page-3-a'])

await expectReject(
  collectPaginatedNotionResults(async () => {
    return makeResponse({
      results: ['partial'],
      hasMore: true,
      nextCursor: null
    })
  }, {
    scope: 'missing-cursor'
  }),
  /has_more was true but next_cursor was empty/
)

await expectReject(
  collectPaginatedNotionResults(async (cursor) => {
    if (cursor === null) {
      return makeResponse({
        results: ['page-1'],
        hasMore: true,
        nextCursor: 'cursor-2'
      })
    }

    return makeResponse({
      results: ['page-2'],
      hasMore: true,
      nextCursor: 'cursor-2'
    })
  }, {
    scope: 'repeated-cursor'
  }),
  /received a repeated next_cursor/
)

await expectReject(
  collectPaginatedNotionResults(async (cursor) => {
    if (cursor === null) {
      return makeResponse({
        results: ['page-1'],
        hasMore: true,
        nextCursor: 'cursor-2'
      })
    }

    throw new Error('second page failed')
  }, {
    scope: 'error-on-second-page'
  }),
  /second page failed/
)

console.log('verify-notion-pagination: ok')
