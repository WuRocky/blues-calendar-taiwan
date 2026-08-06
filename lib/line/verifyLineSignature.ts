const textEncoder = new TextEncoder()

function encodeBase64(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function timingSafeEqual(left: string, right: string) {
  const leftBytes = textEncoder.encode(left)
  const rightBytes = textEncoder.encode(right)
  const maxLength = Math.max(leftBytes.length, rightBytes.length)
  let mismatch = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return mismatch === 0
}

async function createLineSignature(rawBody: string, channelSecret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(channelSecret),
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(rawBody))
  return encodeBase64(new Uint8Array(signature))
}

export interface VerifyLineSignatureParams {
  rawBody: string
  signature: string
  channelSecret: string
}

export interface AuthorizeLineWebhookParams {
  channelSecret: string
  rawBody: string
  signature: string | undefined
}

export async function verifyLineSignature({
  rawBody,
  signature,
  channelSecret
}: VerifyLineSignatureParams) {
  if (!rawBody || !signature || !channelSecret) {
    return false
  }

  const expectedSignature = await createLineSignature(rawBody, channelSecret)
  return timingSafeEqual(expectedSignature, signature.trim())
}

export async function authorizeLineWebhook({
  channelSecret,
  rawBody,
  signature
}: AuthorizeLineWebhookParams) {
  if (!signature || !channelSecret) {
    return false
  }

  return verifyLineSignature({
    rawBody,
    signature,
    channelSecret
  })
}
