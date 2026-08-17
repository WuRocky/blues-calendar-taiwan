const TALLY_START_DATE_FIELD_KEY = 'question_PlVVe5'
const TALLY_END_DATE_FIELD_KEY = 'question_ELyyEX'
const TALLY_START_TIME_FIELD_KEY = 'question_aEVjGb'
const TALLY_END_TIME_FIELD_KEY = 'question_6vo1RJ'

const INPUT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const INPUT_TIME_PATTERN = /^\d{2}:\d{2}$/

interface TallyField {
  key?: string
  label?: string
  type?: string
  value?: unknown
}

interface TallyWebhookBody {
  data?: {
    fields?: TallyField[]
  }
}

function getFieldValue(fields: TallyField[], key: string) {
  const field = fields.find(item => item.key === key)
  return typeof field?.value === 'string' ? field.value.trim() : ''
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  if (!INPUT_DATE_PATTERN.test(dateValue) || !INPUT_TIME_PATTERN.test(timeValue)) {
    return null
  }

  return `${dateValue}T${timeValue}:00+08:00`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TallyWebhookBody>(event)
  const fields = Array.isArray(body?.data?.fields) ? body.data.fields : []
  const startDate = getFieldValue(fields, TALLY_START_DATE_FIELD_KEY)
  const endDate = getFieldValue(fields, TALLY_END_DATE_FIELD_KEY)
  const startTime = getFieldValue(fields, TALLY_START_TIME_FIELD_KEY)
  const endTime = getFieldValue(fields, TALLY_END_TIME_FIELD_KEY)
  const startDateTime = combineDateAndTime(startDate, startTime)
  const endDateTime = combineDateAndTime(endDate, endTime)

  console.log('[Tally webhook]', JSON.stringify(body, null, 2))
  console.log('[Tally webhook] parsed timing', JSON.stringify({
    startDate,
    startTime,
    startDateTime,
    endDate,
    endTime,
    endDateTime
  }, null, 2))
  console.log('[Tally webhook] Notion update skipped: no safe page identifier from Tally payload yet')

  return {
    success: true
  }
})
