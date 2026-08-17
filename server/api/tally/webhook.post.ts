const TALLY_START_DATE_FIELD_KEY = 'question_PlVVe5'
const TALLY_END_DATE_FIELD_KEY = 'question_ELyyEX'
const TALLY_START_TIME_FIELD_KEY = 'question_aEVjGb'
const TALLY_END_TIME_FIELD_KEY = 'question_6vo1RJ'
const TALLY_EVENT_TYPE_FIELD_KEY = 'question_RREEad'

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
  switch (value.trim().toLowerCase()) {
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
    aliases: ['活動名稱', 'eventname', '名稱'],
    notionProperty: 'Name',
    transform: field => createTitleProperty(getTextValue(field))
  },
  {
    aliases: ['活動類型', 'eventtype'],
    notionProperty: 'Event Type',
    transform: field => createSelectProperty(mapEventTypeOption(resolveSelectText(field)))
  },
  {
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
    aliases: ['星期', 'weekday', '星期幾'],
    notionProperty: 'Weekday',
    transform: field => createSelectProperty(resolveSelectText(field) || getTextValue(field))
  },
  {
    aliases: ['weekdayorder', '星期排序'],
    notionProperty: 'Weekday Order',
    transform: field => createNumberProperty(getNumberValue(field))
  },
  {
    aliases: ['費用', 'price', '費用說明'],
    notionProperty: 'Price',
    transform: field => createRichTextProperty(getTextValue(field))
  },
  {
    aliases: ['程度', 'level', '適合程度'],
    notionProperty: 'Level',
    transform: field => createSelectProperty(resolveSelectText(field) || getTextValue(field))
  },
  {
    aliases: ['報名連結', 'registrationurl', 'registrationurl/報名連結', 'registrationurl/報名連結（若有）'],
    notionProperty: 'Registration URL',
    transform: field => createUrlProperty(getTextValue(field))
  },
  {
    aliases: ['instagram連結', 'instagramurl', 'instagram'],
    notionProperty: 'Instagram URL',
    transform: field => createUrlProperty(getTextValue(field))
  },
  {
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
    aliases: ['常態課說明', 'recurringtext'],
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

    if (TALLY_IGNORED_FIELD_ALIASES.has(normalizedLabel)) {
      ignoredFields.push({
        key: fieldKey,
        label: field.label || '',
        reason: 'handled by fixed value or combined datetime mapping',
        value: field.value ?? null
      })
      continue
    }

    const rule = fieldKey === TALLY_EVENT_TYPE_FIELD_KEY
      ? TALLY_TO_NOTION_RULES.find(item => item.notionProperty === 'Event Type') || null
      : TALLY_TO_NOTION_RULES.find(item => item.aliases.includes(normalizedLabel)) || null

    if (!rule) {
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
      unresolvedFields.push({
        key: fieldKey,
        label: field.label || '',
        reason: 'mapped field has empty or invalid value',
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
