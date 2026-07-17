<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { buildGoogleCalendarUrl, canAddEventToCalendar } from '~~/lib/event-calendar'
import { buildEventReportUrl, resolveTallyFormUrl } from '~~/lib/event-report'
import { buildEventShareText, buildEventShareTitle, buildEventShareUrl, buildLineShareUrl } from '~~/lib/event-sharing'
import { getEventDisplayStatus, getEventDisplayStatusLabel, getEventRegistrationNotice, isEventRegistrationUnavailable, isEventStatusMuted } from '~~/lib/event-status'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const route = useRoute()
const { t } = useI18n()
const config = useRuntimeConfig()
const isWebShareSupported = ref(false)
const shareFeedback = ref('')
const shareFeedbackIsError = ref(false)
let shareFeedbackTimeoutId: ReturnType<typeof setTimeout> | null = null

const { data: eventItem, error } = await useFetch<EventItem>(`/api/events/${route.params.slug}`)

function formatDate(date: string | null) {
  if (!date) {
    return t('common.timeToBeAnnounced')
  }

  return dayjs.utc(date).tz('Asia/Taipei').format('YYYY/MM/DD HH:mm')
}

function formatDateRange(startTime: string | null, endTime: string | null) {
  if (!startTime && eventItem.value?.recurring && eventItem.value?.recurringText) {
    return eventItem.value.recurringText
  }

  if (!startTime) {
    return t('common.timeToBeAnnounced')
  }

  if (!endTime) {
    return formatDate(startTime)
  }

  return `${formatDate(startTime)} - ${formatDate(endTime)}`
}

function getEventTypeLabel(eventType: string) {
  const normalized = eventType.toLowerCase()

  if (normalized === 'event' || normalized === 'party' || normalized === 'festival') {
    return t('filters.event')
  }

  if (normalized === 'class') {
    return t('filters.class')
  }

  if (normalized === 'workshop') {
    return t('filters.workshop')
  }

  if (normalized === 'social' || normalized === 'open-floor') {
    return t('filters.social')
  }

  return t('filters.event')
}

const displayStatusLabel = computed(() => {
  return eventItem.value ? getEventDisplayStatusLabel(getEventDisplayStatus(eventItem.value)) : ''
})

const registrationNotice = computed(() => {
  return eventItem.value ? getEventRegistrationNotice(eventItem.value) : ''
})

const isRegistrationUnavailable = computed(() => {
  return eventItem.value ? isEventRegistrationUnavailable(eventItem.value) : false
})

const googleCalendarUrl = computed(() => {
  return eventItem.value ? buildGoogleCalendarUrl(eventItem.value, config.public.siteUrl) : null
})

const icsDownloadUrl = computed(() => {
  return eventItem.value && canAddEventToCalendar(eventItem.value)
    ? `/api/events/${eventItem.value.slug}/calendar.ics`
    : null
})

const shareUrl = computed(() => {
  return eventItem.value ? buildEventShareUrl(eventItem.value, config.public.siteUrl) : null
})

const shareTitle = computed(() => {
  return eventItem.value ? buildEventShareTitle(eventItem.value) : ''
})

const shareText = computed(() => {
  return eventItem.value ? buildEventShareText(eventItem.value, config.public.siteUrl) : null
})

const lineShareUrl = computed(() => {
  return eventItem.value ? buildLineShareUrl(eventItem.value, config.public.siteUrl) : null
})

const reportFormUrl = computed(() => {
  const { url, warningReason } = resolveTallyFormUrl(config.public.eventReportFormUrl)

  if (import.meta.dev && warningReason) {
    console.warn(`[forms] Event report form disabled: ${warningReason}`)
  }

  return url
})

const eventReportUrl = computed(() => {
  if (!eventItem.value || !reportFormUrl.value) {
    return null
  }

  const url = buildEventReportUrl(eventItem.value, reportFormUrl.value, config.public.siteUrl)

  if (import.meta.dev && !url) {
    console.warn(`[forms] Event report link disabled for slug="${eventItem.value.slug}"`)
  }

  return url
})

function setShareFeedback(message: string, isError = false) {
  shareFeedback.value = message
  shareFeedbackIsError.value = isError

  if (shareFeedbackTimeoutId) {
    clearTimeout(shareFeedbackTimeoutId)
  }

  shareFeedbackTimeoutId = setTimeout(() => {
    shareFeedback.value = ''
    shareFeedbackIsError.value = false
    shareFeedbackTimeoutId = null
  }, 3000)
}

function getSharePayload() {
  if (!shareUrl.value || !shareTitle.value || !shareText.value) {
    return null
  }

  return {
    title: shareTitle.value,
    text: shareText.value,
    url: shareUrl.value
  }
}

function copyTextWithFallback(text: string) {
  if (!import.meta.client || typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  try {
    return document.execCommand('copy')
  }
  finally {
    document.body.removeChild(textarea)
  }
}

async function copyEventLink() {
  if (!shareUrl.value) {
    setShareFeedback('目前無法產生活動分享連結', true)
    return
  }

  try {
    if (import.meta.client && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl.value)
    }
    else if (!copyTextWithFallback(shareUrl.value)) {
      throw new Error('clipboard unavailable')
    }

    setShareFeedback('已複製活動連結')
  }
  catch {
    if (copyTextWithFallback(shareUrl.value)) {
      setShareFeedback('已複製活動連結')
      return
    }

    setShareFeedback('無法複製連結，請手動複製網址', true)
  }
}

async function shareEventNatively() {
  const payload = getSharePayload()

  if (!payload) {
    setShareFeedback('目前無法產生活動分享連結', true)
    return
  }

  if (!import.meta.client || typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return
  }

  try {
    await navigator.share(payload)
  }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    setShareFeedback('無法分享活動，請稍後再試', true)
  }
}

function handleLineShareUnavailable() {
  setShareFeedback('目前無法產生活動分享連結', true)
}

onMounted(() => {
  isWebShareSupported.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})

onBeforeUnmount(() => {
  if (shareFeedbackTimeoutId) {
    clearTimeout(shareFeedbackTimeoutId)
  }
})

useSeoMeta({
  title: () => eventItem.value?.name ? `${eventItem.value.name} | ${t('site.title')}` : `${t('event.detailTitle')} | ${t('site.title')}`,
  description: () => eventItem.value?.summary || t('event.detailDescription')
})
</script>

<template>
  <main class="poster-page">
    <section class="detail-panel">
      <p v-if="error" class="state-copy">{{ $t('common.notFound') }}</p>

      <article v-else-if="eventItem" class="event-sheet" :class="{ 'event-sheet-muted': isEventStatusMuted(eventItem) }">
        <div class="event-tag-row">
          <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
          <span v-if="displayStatusLabel" class="event-status-badge" :class="{
            'event-status-badge-cancelled': eventItem.eventStatus === 'cancelled',
            'event-status-badge-postponed': eventItem.eventStatus === 'postponed',
            'event-status-badge-ongoing': eventItem.eventStatus === 'scheduled' && eventItem.timeStatus === 'ongoing'
          }">
            {{ displayStatusLabel }}
          </span>
        </div>
        <h1 class="event-title">{{ eventItem.name }}</h1>
        <p class="event-datetime">{{ formatDateRange(eventItem.startTime, eventItem.endTime) }}</p>
        <p v-if="eventItem.recurring && eventItem.recurringText" class="event-recurring">
          {{ eventItem.recurringText }}
        </p>
        <div class="content-block share-actions">
          <h2 class="section-title">分享活動</h2>
          <div class="share-action-row">
            <button
              v-if="isWebShareSupported"
              type="button"
              class="action-button action-button-secondary"
              aria-label="分享活動"
              @click="shareEventNatively"
            >
              分享活動
            </button>
            <a
              v-if="lineShareUrl"
              class="action-button action-button-secondary"
              :href="lineShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="分享到 LINE"
            >
              分享到 LINE
            </a>
            <button
              v-else
              type="button"
              class="action-button action-button-secondary"
              aria-label="分享到 LINE"
              @click="handleLineShareUnavailable"
            >
              分享到 LINE
            </button>
            <button
              type="button"
              class="action-button action-button-secondary"
              aria-label="複製活動連結"
              @click="copyEventLink"
            >
              複製連結
            </button>
          </div>
          <p
            v-if="shareFeedback"
            class="share-feedback"
            :class="{ 'share-feedback-error': shareFeedbackIsError }"
            aria-live="polite"
            role="status"
          >
            {{ shareFeedback }}
          </p>
        </div>
        <div class="content-block content-block-summary">
          <h2 class="section-title">{{ $t('event.summaryTitle') }}</h2>
          <p>{{ eventItem.summary || $t('common.noSummary') }}</p>
        </div>

        <div class="info-section">
          <h2 class="section-title">{{ $t('event.infoTitle') }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ $t('event.city') }}</span>
              <span class="info-value">{{ eventItem.city || $t('common.tbdCity') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('event.venue') }}</span>
              <span v-if="eventItem.venueUrl" class="info-value">
                <a class="venue-link" :href="eventItem.venueUrl" target="_blank" rel="noreferrer">
                  {{ eventItem.venueName || $t('common.tbdVenue') }}
                </a>
              </span>
              <span v-else class="info-value">{{ eventItem.venueName || $t('common.tbdVenue') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('event.address') }}</span>
              <span class="info-value">{{ eventItem.address || $t('common.tbdAddress') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('event.organizer') }}</span>
              <span class="info-value">{{ eventItem.organizer || $t('common.tbdOrganizer') }}</span>
            </div>
            <div v-if="eventItem.level" class="info-item">
              <span class="info-label">{{ $t('event.level') }}</span>
              <span class="info-value">{{ eventItem.level }}</span>
            </div>
            <div v-if="eventItem.venueUrl" class="info-item">
              <span class="info-label">{{ $t('event.venueLink') }}</span>
              <span class="info-value">
                <a class="venue-link" :href="eventItem.venueUrl" target="_blank" rel="noreferrer">
                  {{ $t('event.venueLinkAction') }}
                </a>
              </span>
            </div>
          </div>
        </div>

        <div class="content-block">
          <h2 class="section-title">{{ $t('event.priceTitle') }}</h2>
          <p class="price-copy">{{ eventItem.price || $t('common.noPrice') }}</p>
        </div>

        <div v-if="eventItem.coverImageUrl" class="content-block">
          <h2 class="section-title">{{ $t('event.coverImage') }}</h2>
          <img class="cover-image" :src="eventItem.coverImageUrl" :alt="eventItem.name">
        </div>

        <div v-if="eventItem.description" class="content-block">
          <h2 class="section-title">{{ $t('event.detailsTitle') }}</h2>
          <p v-for="paragraph in eventItem.description.split('\n').filter(Boolean)" :key="paragraph">
            {{ paragraph }}
          </p>
        </div>

        <div v-if="googleCalendarUrl && icsDownloadUrl" class="content-block calendar-actions">
          <h2 class="section-title">加入行事曆</h2>
          <div class="calendar-action-row">
            <a
              class="action-button action-button-secondary"
              :href="googleCalendarUrl"
              target="_blank"
              rel="noreferrer"
              aria-label="加入 Google Calendar"
            >
              加入 Google Calendar
            </a>
            <a
              class="action-button action-button-secondary"
              :href="icsDownloadUrl"
              aria-label="下載行事曆檔案"
            >
              下載行事曆檔案
            </a>
          </div>
        </div>

        <div v-if="eventReportUrl" class="content-block report-actions">
          <h2 class="section-title">{{ $t('event.reportTitle') }}</h2>
          <p class="report-copy">{{ $t('event.reportDescription') }}</p>
          <a
            class="action-button action-button-secondary"
            :href="eventReportUrl"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="$t('event.reportAction')"
          >
            {{ $t('event.reportAction') }}
          </a>
        </div>

        <p v-if="registrationNotice" class="status-notice">{{ registrationNotice }}</p>

        <a
          v-if="eventItem.registrationUrl && !isRegistrationUnavailable"
          class="action-button"
          :href="eventItem.registrationUrl"
          target="_blank"
          rel="noreferrer"
        >
          {{ $t('event.registerAction') }}
        </a>
      </article>
    </section>
  </main>
</template>

<style scoped>
.poster-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 28px 20px 72px;
}

.detail-panel {
  padding: 24px;
  border: 1px solid rgba(190, 154, 91, 0.36);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(12, 27, 49, 0.96), rgba(7, 15, 28, 0.98)),
    #091321;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
}

.event-sheet {
  padding: 24px;
  border: 1px solid rgba(198, 160, 95, 0.4);
  border-radius: 16px;
  background: linear-gradient(180deg, #f1e3bf 0%, #e4d0ab 100%);
  color: #1a1d28;
}

.event-tag,
.info-label {
  color: #7c3f24;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.event-tag {
  margin: 0 0 8px;
  font-size: 0.82rem;
  font-weight: 700;
}

.event-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.event-status-badge-cancelled {
  background: rgba(112, 24, 24, 0.12);
  border: 1px solid rgba(112, 24, 24, 0.26);
  color: #7a1f1f;
}

.event-status-badge-postponed {
  background: rgba(129, 92, 15, 0.12);
  border: 1px solid rgba(129, 92, 15, 0.24);
  color: #7a5208;
}

.event-status-badge-ongoing {
  background: rgba(123, 45, 38, 0.12);
  border: 1px solid rgba(123, 45, 38, 0.24);
  color: #7b2d26;
}

.event-title {
  margin: 0;
  color: #162235;
  font-size: clamp(2rem, 6vw, 3.8rem);
  line-height: 1.05;
}

.event-datetime,
.state-copy {
  margin: 16px 0 0;
  color: #4e4234;
  font-size: 1rem;
}

.event-recurring {
  margin: 14px 0 0;
  color: #7b2d26;
  font-weight: 700;
}

.content-block-summary {
  margin-top: 24px;
}

.event-sheet-muted {
  opacity: 0.88;
}

.info-section,
.content-block {
  margin-top: 26px;
  border-top: 1px solid rgba(122, 83, 43, 0.22);
  padding-top: 20px;
}

.section-title {
  margin: 0 0 14px;
  color: #0e1a2a;
  font-size: 1.15rem;
}

.info-grid {
  display: grid;
  gap: 16px 22px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 0.78rem;
}

.info-value {
  color: #2f2b24;
  line-height: 1.5;
}

.venue-link {
  color: #7b2d26;
  font-weight: 700;
  text-decoration: none;
}

.venue-link:hover,
.venue-link:focus-visible {
  color: #4f1715;
  text-decoration: underline;
}

.content-block p {
  margin: 0 0 12px;
  color: #322c22;
  line-height: 1.8;
}

.price-copy {
  white-space: pre-line;
  line-height: 1.7;
}

.cover-image {
  display: block;
  max-width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(92, 67, 38, 0.16);
}

.status-notice {
  margin: 28px 0 0;
  color: #7a1f1f;
  font-weight: 700;
}

.calendar-actions {
  margin-top: 28px;
}

.report-actions {
  margin-top: 28px;
}

.calendar-action-row,
.share-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.report-copy {
  margin: 0 0 14px;
}

.share-actions {
  margin-top: 24px;
}

.share-feedback {
  margin: 14px 0 0;
  color: #245037;
  font-weight: 700;
}

.share-feedback-error {
  color: #7a1f1f;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  padding: 12px 18px;
  font: inherit;
  border-radius: 999px;
  background: #72292d;
  border: 1px solid transparent;
  color: #f9edd8;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}

.action-button-secondary {
  background: transparent;
  color: #7b2d26;
  border: 1px solid rgba(123, 45, 38, 0.3);
}

.action-button:hover,
.action-button:focus-visible {
  background: #5a1c1b;
  color: #f9edd8;
}

@media (max-width: 700px) {
  .poster-page {
    padding-inline: 16px;
  }

  .detail-panel,
  .event-sheet {
    padding: 18px;
  }
}
</style>
