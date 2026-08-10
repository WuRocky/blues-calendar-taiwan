export interface LineMessageUriAction {
  type: 'uri'
  label: string
  uri: string
}

export interface LineFlexText {
  type: 'text'
  text: string
  size?: string
  weight?: string
  color?: string
  wrap?: boolean
  maxLines?: number
  margin?: string
  align?: 'start' | 'center' | 'end'
  gravity?: 'top' | 'center' | 'bottom'
  flex?: number
}

export interface LineFlexButton {
  type: 'button'
  style?: 'primary' | 'secondary' | 'link'
  height?: 'sm' | 'md'
  color?: string
  action: LineMessageUriAction
  flex?: number
}

export interface LineFlexBox {
  type: 'box'
  layout: 'vertical' | 'horizontal' | 'baseline'
  contents: LineFlexComponent[]
  spacing?: string
  margin?: string
  paddingAll?: string
  paddingTop?: string
  paddingBottom?: string
  paddingStart?: string
  paddingEnd?: string
  backgroundColor?: string
  cornerRadius?: string
}

export interface LineFlexSeparator {
  type: 'separator'
  margin?: string
  color?: string
}

export type LineFlexComponent =
  | LineFlexText
  | LineFlexButton
  | LineFlexBox
  | LineFlexSeparator

export interface LineFlexBubble {
  type: 'bubble'
  size?: 'nano' | 'micro' | 'deca' | 'hecto' | 'kilo' | 'mega' | 'giga'
  body: LineFlexBox
  footer?: LineFlexBox
}

export interface LineFlexCarousel {
  type: 'carousel'
  contents: LineFlexBubble[]
}

export interface LineTextMessage {
  type: 'text'
  text: string
}

export interface LineFlexMessage {
  type: 'flex'
  altText: string
  contents: LineFlexBubble | LineFlexCarousel
}

export type LinePushMessage = LineTextMessage | LineFlexMessage

export interface PushLineMessageParams {
  channelAccessToken: string
  messages: LinePushMessage[]
  targetId: string
}

export interface LinePushTextMessageParams {
  channelAccessToken: string
  targetId: string
  text: string
}

interface LinePushMessageBody {
  to: string
  messages: LinePushMessage[]
}

export async function pushLineMessage({
  channelAccessToken,
  targetId,
  messages
}: PushLineMessageParams) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: targetId,
      messages
    } satisfies LinePushMessageBody)
  })

  if (response.ok) {
    return
  }

  const errorBody = await response.text()
  throw new Error(`LINE push failed (${response.status}): ${errorBody}`)
}

export async function pushLineTextMessage({
  channelAccessToken,
  targetId,
  text
}: LinePushTextMessageParams) {
  await pushLineMessage({
    channelAccessToken,
    targetId,
    messages: [
      {
        type: 'text',
        text
      }
    ]
  })
}
