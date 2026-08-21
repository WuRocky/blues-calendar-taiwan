export interface LineMessageUriAction {
  type: 'uri'
  label: string
  uri: string
}

export interface LineMessagePostbackAction {
  type: 'postback'
  label: string
  data: string
  displayText?: string
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

export interface LineFlexImage {
  type: 'image'
  url: string
  size?: string
  aspectMode?: 'cover' | 'fit'
  aspectRatio?: string
  gravity?: 'top' | 'center' | 'bottom'
  flex?: number
  cornerRadius?: string
}

export interface LineFlexButton {
  type: 'button'
  style?: 'primary' | 'secondary' | 'link'
  height?: 'sm' | 'md'
  color?: string
  action: LineMessageUriAction | LineMessagePostbackAction
  flex?: number
}

export interface LineFlexBox {
  type: 'box'
  layout: 'vertical' | 'horizontal' | 'baseline'
  contents: LineFlexComponent[]
  flex?: number
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
  | LineFlexImage
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

export interface ReplyLineMessageParams {
  channelAccessToken: string
  messages: LinePushMessage[]
  replyToken: string
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

interface LineReplyMessageBody {
  messages: LinePushMessage[]
  replyToken: string
}

export class LineMessageRequestError extends Error {
  endpoint: 'push' | 'reply'
  responseBody: string
  status: number

  constructor(endpoint: 'push' | 'reply', status: number, responseBody: string) {
    super(`LINE ${endpoint} failed (${status}): ${responseBody}`)
    this.name = 'LineMessageRequestError'
    this.endpoint = endpoint
    this.status = status
    this.responseBody = responseBody
  }
}

async function sendLineMessageRequest(
  endpoint: 'push' | 'reply',
  channelAccessToken: string,
  body: LinePushMessageBody | LineReplyMessageBody
) {
  const response = await fetch(`https://api.line.me/v2/bot/message/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (response.ok) {
    return
  }

  const errorBody = await response.text()
  throw new LineMessageRequestError(endpoint, response.status, errorBody)
}

export async function pushLineMessage({
  channelAccessToken,
  targetId,
  messages
}: PushLineMessageParams) {
  await sendLineMessageRequest(
    'push',
    channelAccessToken,
    {
      to: targetId,
      messages
    } satisfies LinePushMessageBody
  )
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

export async function replyLineMessage({
  channelAccessToken,
  replyToken,
  messages
}: ReplyLineMessageParams) {
  await sendLineMessageRequest(
    'reply',
    channelAccessToken,
    {
      replyToken,
      messages
    } satisfies LineReplyMessageBody
  )
}
