<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const route = useRoute()
const { t } = useI18n()

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

useSeoMeta({
  title: () => eventItem.value?.name ? `${eventItem.value.name} | ${t('site.title')}` : `${t('event.detailTitle')} | ${t('site.title')}`,
  description: () => eventItem.value?.summary || t('event.detailDescription')
})
</script>

<template>
  <main class="poster-page">
    <section class="detail-panel">
      <p v-if="error" class="state-copy">{{ $t('common.notFound') }}</p>

      <article v-else-if="eventItem" class="event-sheet">
        <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
        <h1 class="event-title">{{ eventItem.name }}</h1>
        <p class="event-datetime">{{ formatDateRange(eventItem.startTime, eventItem.endTime) }}</p>
        <p v-if="eventItem.recurring && eventItem.recurringText" class="event-recurring">
          {{ eventItem.recurringText }}
        </p>
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

        <a
          v-if="eventItem.registrationUrl"
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

.event-tag {
  margin: 0 0 8px;
  font-size: 0.82rem;
  font-weight: 700;
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

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  padding: 12px 18px;
  border-radius: 999px;
  background: #72292d;
  color: #f9edd8;
  text-decoration: none;
  font-weight: 700;
}

.action-button:hover,
.action-button:focus-visible {
  background: #5a1c1b;
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
