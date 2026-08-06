export interface LinePushTextMessageParams {
  channelAccessToken: string
  targetId: string
  text: string
}

interface LinePushTextMessageBody {
  to: string
  messages: Array<{
    type: 'text'
    text: string
  }>
}

export async function pushLineTextMessage({
  channelAccessToken,
  targetId,
  text
}: LinePushTextMessageParams) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: targetId,
      messages: [
        {
          type: 'text',
          text
        }
      ]
    } satisfies LinePushTextMessageBody)
  })

  if (response.ok) {
    return
  }

  const errorBody = await response.text()
  throw new Error(`LINE push failed (${response.status}): ${errorBody}`)
}
