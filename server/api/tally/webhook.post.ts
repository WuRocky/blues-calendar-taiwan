const TALLY_START_DATE_FIELD_KEY = 'question_PlVVe5'
const TALLY_END_DATE_FIELD_KEY = 'question_ELyyEX'
const TALLY_START_TIME_FIELD_KEY = 'question_aEVjGb'
const TALLY_END_TIME_FIELD_KEY = 'question_6vo1RJ'
const TALLY_EVENT_TYPE_FIELD_KEY = 'question_RREEad'
const TALLY_EVENT_NAME_FIELD_KEY = 'question_lLJJ1B'
const TALLY_SUMMARY_FIELD_KEY = 'question_GL884p'
const TALLY_SCHEDULE_TYPE_FIELD_KEY = 'question_AD594o'
const TALLY_PRICE_FIELD_KEY = 'question_ZlqqKz'
const TALLY_COVER_IMAGE_URL_FIELD_KEY = 'question_qO00MY'
const TALLY_LEVEL_FIELD_KEY = 'question_NLGGQB'
const TALLY_PUBLISH_STATUS_FIELD_KEY = 'question_VVkL6E'
const TALLY_PRIMARY_REGISTRATION_URL_FIELD_KEY = 'question_PYyXOe'
const TALLY_DUPLICATE_REGISTRATION_URL_FIELD_KEY = 'question_x2OO1y'
const TALLY_INSTAGRAM_URL_FIELD_KEY = 'question_4vd8Yb'
const TALLY_CONTACT_METHOD_FIELD_KEY = 'question_WPxvMP'
const TALLY_RELATIONSHIP_FIELD_KEY = 'question_D5ggPq'
const TALLY_CITY_FIELD_KEY = 'question_rVzz1l'
const TALLY_RECURRING_TEXT_FIELD_KEY = 'question_VV22AJ'
const TALLY_WEEKDAY_FIELD_KEY = 'question_djE89V'
const TALLY_CONFIRM_CHECKBOX_FIELD_KEYS = [
  'question_9Obbyp',
  'question_9Obbyp_5577729b-f718-4069-a3d6-6e5468f96363',
  'question_eLkkl0',
  'question_eLkkl0_8cf4b21e-493d-4801-9706-43a88d68fa85'
] as const

const INPUT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const INPUT_TIME_PATTERN = /^\d{2}:\d{2}$/
const URL_PATTERN = /^https?:\/\/\S+$/i

interface TallyFieldOption {
  id?: string
  text?: string
  value?: string
  label?: string
}

interface TallyField {
  key?: string
  label?: string
  type?: string
  value?: unknown
  options?: TallyFieldOption[]
}

interface TallyWebhookBody {
  eventId?: string
  createdAt?: string
  data?: {
    fields?: TallyField[]
    responseId?: string
    submissionId?: string
    respondentId?: string
    formId?: string
    createdAt?: string
  }
}

type NotionPropertyValue =
  | { title: Array<{ type: 'text', text: { content: string } }> }
  | { rich_text: Array<{ type: 'text', text: { content: string } }> }
  | { select: { name: string } }
  | { date: { start: string } }
  | { url: string }
  | { checkbox: boolean }
  | { number: number }

interface NotionPayloadBuildResult {
  ignoredFields: Array<{
    key: string
    label: string
    reason: string
    value: unknown
  }>
  mappedFields: Array<{
    notionProperty: string
    sourceFieldKey: string
    sourceLabel: string
    value: unknown
  }>
  omittedOptionalFields: Array<{
    key: string
    label: string
    reason: string
    value: unknown
  }>
  properties: Record<string, NotionPropertyValue>
  unresolvedFields: Array<{
    key: string
    label: string
    reason: string
    value: unknown
  }>
}

interface NotionFieldMappingRule {
  aliases: string[]
  fieldKeys?: string[]
  notionProperty: string
  transform: (field: TallyField) => NotionPropertyValue | null
}

function normalizeLabel(value: string | undefined) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function getFieldValue(fields: TallyField[], key: string) {
  const field = fields.find(item => item.key === key)
  return typeof field?.value === 'string' ? field.value.trim() : ''
}

function getFieldByKey(fields: TallyField[], key: string) {
  return fields.find(field => field.key === key) || null
}

function getTextValue(field: TallyField | null) {
  return typeof field?.value === 'string' ? field.value.trim() : ''
}

function getStringArrayValue(field: TallyField | null) {
  if (!Array.isArray(field?.value)) {
    return []
  }

  return field.value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function getBooleanValue(field: TallyField | null) {
  if (typeof field?.value === 'boolean') {
    return field.value
  }

  if (typeof field?.value === 'string') {
    const normalized = field.value.trim().toLowerCase()
    return ['true', 'yes', 'y', '1'].includes(normalized)
  }

  return false
}

function isEmptyFieldValue(field: TallyField | null) {
  if (!field) {
    return true
  }

  if (field.value === null || field.value === undefined) {
    return true
  }

  if (typeof field.value === 'string') {
    return field.value.trim().length === 0
  }

  if (Array.isArray(field.value)) {
    return field.value.length === 0
  }

  return false
}

function getNumberValue(field: TallyField | null) {
  if (typeof field?.value === 'number' && Number.isFinite(field.value)) {
    return field.value
  }

  if (typeof field?.value === 'string') {
    const normalized = field.value.trim()

    if (!normalized) {
      return null
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function getOptionLabel(option: TallyFieldOption) {
  return option.text || option.label || option.value || option.id || ''
}

function resolveSelectText(field: TallyField | null) {
  if (!field) {
    return ''
  }

  const arrayValues = getStringArrayValue(field)

  if (arrayValues.length > 0) {
    return arrayValues.map((rawValue) => {
      const matchedOption = field.options?.find((option) => {
        return option.id === rawValue || option.value === rawValue
      })

      return matchedOption ? getOptionLabel(matchedOption).trim() : rawValue.trim()
    }).filter(Boolean).join(', ')
  }

  if (typeof field.value === 'string') {
    const rawValue = field.value.trim()

    if (!rawValue) {
      return ''
    }

    const matchedOption = field.options?.find((option) => {
      return option.id === rawValue || option.value === rawValue
    })

    return matchedOption ? getOptionLabel(matchedOption).trim() : rawValue
  }

  return ''
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  if (!INPUT_DATE_PATTERN.test(dateValue) || !INPUT_TIME_PATTERN.test(timeValue)) {
    return null
  }

  return `${dateValue}T${timeValue}:00+08:00`
}

function createTitleProperty(value: string): NotionPropertyValue | null {
  const content = value.trim()

  if (!content) {
    return null
  }

  return {
    title: [
      {
        type: 'text',
        text: {
          content
        }
      }
    ]
  }
}

function createRichTextProperty(value: string): NotionPropertyValue | null {
  const content = value.trim()

  if (!content) {
    return null
  }

  return {
    rich_text: [
      {
        type: 'text',
        text: {
          content
        }
      }
    ]
  }
}

function createSelectProperty(value: string): NotionPropertyValue | null {
  const name = value.trim()

  if (!name) {
    return null
  }

  return {
    select: {
      name
    }
  }
}

function createUrlProperty(value: string): NotionPropertyValue | null {
  const url = value.trim()

  if (!URL_PATTERN.test(url)) {
    return null
  }

  return {
    url
  }
}

function createCheckboxProperty(value: boolean): NotionPropertyValue {
  return {
    checkbox: value
  }
}

function createNumberProperty(value: number | null): NotionPropertyValue | null {
  if (value === null) {
    return null
  }

  return {
    number: value
  }
}

function mapEventTypeOption(value: string) {
  switch (value.trim().toLowerCase()) {
    case 'class':
      return 'Class'
    case 'social':
      return 'Social'
    case 'workshop':
      return 'Workshop'
    case 'practice':
      return 'Practice'
    case 'event':
      return 'Event'
    default:
      return ''
  }
}

function mapScheduleTypeOption(value: string) {
  const normalizedValue = value
    .split('｜')[0]
    ?.split('|')[0]
    ?.trim()
    .toLowerCase() || ''

  switch (normalizedValue) {
    case 'single':
      return 'Single'
    case 'weekly':
      return 'Weekly'
    case 'specific dates':
    case 'specificdates':
      return 'Specific Dates'
    default:
      return ''
  }
}

const TALLY_TO_NOTION_RULES: NotionFieldMappingRule[] = [
  {
    fieldKeys: [TALLY_EVENT_NAME_FIELD_KEY],
    aliases: ['活動名稱', 'eventname', '名稱'],
    notionProperty: 'Name',
    transform: field => createTitleProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_EVENT_TYPE_FIELD_KEY],
    aliases: ['活動類型', 'eventtype'],
    notionProperty: 'Event Type',
    transform: field => createSelectProperty(mapEventTypeOption(resolveSelectText(field)))
  },
  {
    fieldKeys: [TALLY_SUMMARY_FIELD_KEY],
    aliases: ['活動簡介', 'summary', '簡介', '活動摘要'],
    notionProperty: 'Summary',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    aliases: ['活動內容', '完整活動介紹', 'fulldescription', '詳細介紹', '其他補充說明', '補充說明'],
    notionProperty: 'Full Description',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_SCHEDULE_TYPE_FIELD_KEY],
    aliases: ['時程類型', 'scheduletype', '活動日期類型'],
    notionProperty: 'Schedule Type',
    transform: field => createSelectProperty(mapScheduleTypeOption(resolveSelectText(field)))
  },
  {
    aliases: ['指定日期', 'specificdates', '多個活動日期'],
    notionProperty: 'Specific Dates',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    aliases: ['場地名稱', 'venuename', '場地', 'venue'],
    notionProperty: 'Venue Name',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    aliases: ['場地連結', 'venueurl', '地點連結', '場地或地圖連結', '地圖連結'],
    notionProperty: 'Venue URL',
    transform: field => createUrlProperty(getTextValue(field))
  },
  {
    aliases: ['地址', 'address'],
    notionProperty: 'Address',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_CITY_FIELD_KEY],
    aliases: ['城市', 'city'],
    notionProperty: 'City',
    transform: field => createSelectProperty(resolveSelectText(field) || getTextValue(field))
  },
  {
    aliases: ['國家', 'country'],
    notionProperty: 'Country',
    transform: field => createSelectProperty(resolveSelectText(field) || getTextValue(field))
  },
  {
    aliases: ['主辦單位', 'organizer', '主辦者/老師/組織名稱', '主辦者', '老師', '組織名稱'],
    notionProperty: 'Organizer',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_WEEKDAY_FIELD_KEY],
    aliases: ['星期', 'weekday', '星期幾', '固定或常態活動主要在星期幾舉行？'],
    notionProperty: 'Weekday',
    transform: field => createSelectProperty(resolveSelectText(field) || getTextValue(field))
  },
  {
    aliases: ['weekdayorder', '星期排序'],
    notionProperty: 'Weekday Order',
    transform: field => createNumberProperty(getNumberValue(field))
  },
  {
    fieldKeys: [TALLY_PRICE_FIELD_KEY],
    aliases: ['費用', 'price', '費用說明'],
    notionProperty: 'Price',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_LEVEL_FIELD_KEY],
    aliases: ['程度', 'level', '適合程度'],
    notionProperty: 'Level',
    transform: field => createSelectProperty(resolveSelectText(field) || getTextValue(field))
  },
  {
    fieldKeys: [TALLY_PRIMARY_REGISTRATION_URL_FIELD_KEY],
    aliases: ['報名連結', 'registrationurl', 'registrationurl/報名連結', 'registrationurl/報名連結（若有）'],
    notionProperty: 'Registration URL',
    transform: field => createUrlProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_INSTAGRAM_URL_FIELD_KEY],
    aliases: ['instagram連結', 'instagramurl', 'instagram', '活動instagramurl'],
    notionProperty: 'Instagram URL',
    transform: field => createUrlProperty(getTextValue(field))
  },
  {
    fieldKeys: [TALLY_COVER_IMAGE_URL_FIELD_KEY],
    aliases: ['封面圖片連結', 'coverimageurl', '圖片連結', '活動圖片連結'],
    notionProperty: 'Cover Image URL',
    transform: field => createUrlProperty(getTextValue(field))
  },
  {
    aliases: ['是否常態課', 'recurring'],
    notionProperty: 'Recurring',
    transform: field => createCheckboxProperty(getBooleanValue(field))
  },
  {
    fieldKeys: [TALLY_RECURRING_TEXT_FIELD_KEY],
    aliases: ['常態課說明', 'recurringtext', '固定活動說明'],
    notionProperty: 'Recurring Text',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    aliases: ['投稿者姓名', 'submittedby', '姓名'],
    notionProperty: 'Submitted By',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    aliases: ['聯絡方式', 'submittercontact', '電子郵件', 'email'],
    notionProperty: 'Submitter Contact',
    transform: field => createRichTextProperty(getTextValue(field))
  }
]

const TALLY_IGNORED_FIELD_ALIASES = new Set([
  'publishstatus',
  'eventstatus',
  'source',
  '資料來源',
  '開始日期',
  '結束日期',
  '開始時間',
  '結束時間'
])

const TALLY_IGNORED_FIELD_KEYS = new Set([
  TALLY_PUBLISH_STATUS_FIELD_KEY,
  TALLY_DUPLICATE_REGISTRATION_URL_FIELD_KEY,
  TALLY_CONTACT_METHOD_FIELD_KEY,
  TALLY_RELATIONSHIP_FIELD_KEY,
  ...TALLY_CONFIRM_CHECKBOX_FIELD_KEYS
])

function buildNotionPropertiesPayload(fields: TallyField[], startDateTime: string | null, endDateTime: string | null): NotionPayloadBuildResult {
  const properties: Record<string, NotionPropertyValue> = {
    'Publish Status': {
      select: {
        name: 'Pending'
      }
    },
    'Event Status': {
      select: {
        name: 'Scheduled'
      }
    },
    'Source': {
      select: {
        name: 'Tally'
      }
    }
  }

  if (startDateTime) {
    properties['Start Time'] = {
      date: {
        start: startDateTime
      }
    }
  }

  if (endDateTime) {
    properties['End Time'] = {
      date: {
        start: endDateTime
      }
    }
  }

  const ignoredFields: NotionPayloadBuildResult['ignoredFields'] = []
  const mappedFields: NotionPayloadBuildResult['mappedFields'] = []
  const omittedOptionalFields: NotionPayloadBuildResult['omittedOptionalFields'] = []
  const unresolvedFields: NotionPayloadBuildResult['unresolvedFields'] = []
  const mappedFieldKeys = new Set([
    TALLY_START_DATE_FIELD_KEY,
    TALLY_END_DATE_FIELD_KEY,
    TALLY_START_TIME_FIELD_KEY,
    TALLY_END_TIME_FIELD_KEY
  ])

  for (const field of fields) {
    const fieldKey = field.key || ''
    const normalizedLabel = normalizeLabel(field.label)

    if (!fieldKey || mappedFieldKeys.has(fieldKey)) {
      continue
    }

    if (TALLY_IGNORED_FIELD_KEYS.has(fieldKey) || TALLY_IGNORED_FIELD_ALIASES.has(normalizedLabel)) {
      let reason = 'handled by fixed value or combined datetime mapping'

      if (fieldKey === TALLY_DUPLICATE_REGISTRATION_URL_FIELD_KEY) {
        reason = 'duplicate registration field ignored in favor of question_PYyXOe'
      }

      if (fieldKey === TALLY_CONTACT_METHOD_FIELD_KEY || fieldKey === TALLY_RELATIONSHIP_FIELD_KEY) {
        reason = 'no matching Notion property by design'
      }

      if (TALLY_CONFIRM_CHECKBOX_FIELD_KEYS.includes(fieldKey as typeof TALLY_CONFIRM_CHECKBOX_FIELD_KEYS[number])) {
        reason = 'confirmation checkbox ignored by design'
      }

      ignoredFields.push({
        key: fieldKey,
        label: field.label || '',
        reason,
        value: field.value ?? null
      })
      continue
    }

    const rule = TALLY_TO_NOTION_RULES.find((item) => {
      if (item.fieldKeys?.includes(fieldKey)) {
        return true
      }

      return item.aliases.includes(normalizedLabel)
    }) || null

    if (!rule) {
      if (isEmptyFieldValue(field)) {
        omittedOptionalFields.push({
          key: fieldKey,
          label: field.label || '',
          reason: 'optional field omitted',
          value: field.value ?? null
        })
        continue
      }

      unresolvedFields.push({
        key: fieldKey,
        label: field.label || '',
        reason: 'no mapping rule',
        value: field.value ?? null
      })
      continue
    }

    const propertyValue = rule.transform(field)

    if (!propertyValue) {
      if (isEmptyFieldValue(field)) {
        omittedOptionalFields.push({
          key: fieldKey,
          label: field.label || '',
          reason: 'optional field omitted',
          value: field.value ?? null
        })
        continue
      }

      unresolvedFields.push({
        key: fieldKey,
        label: field.label || '',
        reason: 'mapped field has invalid or unsupported value',
        value: field.value ?? null
      })
      continue
    }

    properties[rule.notionProperty] = propertyValue
    mappedFieldKeys.add(fieldKey)
    mappedFields.push({
      notionProperty: rule.notionProperty,
      sourceFieldKey: fieldKey,
      sourceLabel: field.label || '',
      value: field.value ?? null
    })
  }

  return {
    ignoredFields,
    mappedFields,
    omittedOptionalFields,
    properties,
    unresolvedFields
  }
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
  const notionPayload = buildNotionPropertiesPayload(fields, startDateTime, endDateTime)

  console.log('[Tally webhook]', JSON.stringify(body, null, 2))
  console.log('[Tally webhook] metadata', JSON.stringify({
    eventId: body.eventId || null,
    responseId: body.data?.responseId || null,
    submissionId: body.data?.submissionId || null,
    respondentId: body.data?.respondentId || null,
    formId: body.data?.formId || null,
    createdAt: body.data?.createdAt || body.createdAt || null
  }, null, 2))
  console.log('[Tally webhook] parsed timing', JSON.stringify({
    startDate,
    startTime,
    startDateTime,
    endDate,
    endTime,
    endDateTime
  }, null, 2))
  console.log('[Tally webhook] notion payload', JSON.stringify(notionPayload, null, 2))
  console.log('[Tally webhook] Notion create skipped: payload review stage only')

  return {
    success: true
  }
})
