import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

const projectRoot = new URL('../', import.meta.url).pathname
const jiti = jitiFactory(import.meta.url, {
  alias: {
    '~~': projectRoot
  }
})

const { verifyLineSignature, authorizeLineWebhook } = jiti('../lib/line/verifyLineSignature.ts')

const rawBody = JSON.stringify({
  destination: 'test-destination',
  events: []
})
const channelSecret = 'test-channel-secret'

async function createReferenceSignature(body, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  let binary = ''

  for (const byte of new Uint8Array(digest)) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

const validSignature = await createReferenceSignature(rawBody, channelSecret)

assert.equal(await verifyLineSignature({
  rawBody,
  signature: validSignature,
  channelSecret
}), true)

assert.equal(await verifyLineSignature({
  rawBody,
  signature: 'invalid-signature',
  channelSecret
}), false)

assert.equal(await authorizeLineWebhook({
  rawBody,
  signature: undefined,
  channelSecret
}), false)

assert.equal(await authorizeLineWebhook({
  rawBody,
  signature: 'invalid-signature',
  channelSecret
}), false)

console.log('verify-line-webhook-signature: ok')
