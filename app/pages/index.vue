<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { isRegularClass, shouldDisplayCalendarEvent, sortRegularClasses } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const config = useRuntimeConfig()
const localePath = useLocalePath()
const { t } = useI18n()

const { data: events, error } = await useFetch<EventItem[]>('/api/events', {
  default: () => []
})

const regularWeeklyClasses = computed(() => {
  return sortRegularClasses(
    (events.value || []).filter((eventItem) => isRegularClass(eventItem))
  )
})

const upcomingEvents = computed(() => {
  return [...(events.value || [])]
    .filter((eventItem) => shouldDisplayCalendarEvent(eventItem))
    .filter((eventItem) => ['workshop', 'social', 'event'].includes(mapPrimaryType(eventItem.eventType)))
})

function mapPrimaryType(eventType: string) {
  const normalized = eventType.toLowerCase()

  if (normalized === 'class') {
    return 'class'
  }

  if (normalized === 'workshop') {
    return 'workshop'
  }

  if (normalized === 'social' || normalized === 'open-floor') {
    return 'social'
  }

  return 'event'
}

function formatDate(date: string | null) {
  if (!date) {
    return ''
  }

  return dayjs.utc(date).tz('Asia/Taipei').format('YYYY/MM/DD HH:mm')
}

function formatPosterDate(date: string | null) {
  if (!date) {
    return { month: 'TBD', day: '--' }
  }

  const localDate = dayjs.utc(date).tz('Asia/Taipei')
  return {
    month: localDate.format('MMM').toUpperCase(),
    day: localDate.format('DD')
  }
}

function getDateBadge(eventItem: EventItem) {
  if (eventItem.recurring && eventItem.recurringText) {
    return {
      month: t('event.fixedBadge'),
      day: t('event.classBadge')
    }
  }

  if (eventItem.startTime) {
    return formatPosterDate(eventItem.startTime)
  }

  return {
    month: 'TBD',
    day: '--'
  }
}

function getDisplayTime(eventItem: EventItem) {
  if (eventItem.startTime) {
    return formatDate(eventItem.startTime)
  }

  if (eventItem.recurring && eventItem.recurringText) {
    return eventItem.recurringText
  }

  return t('common.timeToBeAnnounced')
}

function getEventTypeLabel(eventType: string) {
  return t(`filters.${mapPrimaryType(eventType)}`)
}

function isOngoingEvent(eventItem: EventItem) {
  return eventItem.timeStatus === 'ongoing'
}

useSeoMeta({
  title: () => t('site.title'),
  description: () => t('site.description')
})
</script>

<template>
  <main class="poster-page">
    <section class="hero-panel">
      <p class="hero-kicker">{{ $t('site.kicker') }}</p>
      <h1 class="hero-title">{{ $t('site.title') }}</h1>
      <p class="hero-subtitle">{{ $t('site.subtitle') }}</p>
      <p class="hero-subtitle hero-subtitle-en">{{ $t('site.description') }}</p>

      <div class="hero-actions">
        <NuxtLink class="poster-button poster-button-primary" :to="localePath('calendar')">
          {{ $t('home.viewEvents') }}
        </NuxtLink>
        <a
          v-if="config.public.tallyFormUrl"
          class="poster-button"
          :href="config.public.tallyFormUrl"
          target="_blank"
          rel="noreferrer"
        >
          {{ $t('nav.submit') }}
        </a>
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading section-heading-inline">
        <div>
          <p class="section-kicker">{{ $t('home.regularTitle') }}</p>
          <h2>{{ $t('home.regularSubtitle') }}</h2>
        </div>
      </div>

      <p v-if="error" class="state-copy">{{ $t('common.loadError') }}</p>
      <p v-else-if="regularWeeklyClasses.length === 0" class="state-copy">{{ $t('common.noClasses') }}</p>

      <div v-else class="event-grid">
        <NuxtLink
          v-for="eventItem in regularWeeklyClasses"
          :key="eventItem.id"
          :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
          class="event-card event-card-regular event-card-link"
          :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
        >
          <div class="date-badge date-badge-recurring">
            <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
            <span class="date-badge-day date-badge-day-small">{{ getDateBadge(eventItem).day }}</span>
          </div>

          <div class="event-card-body">
            <div class="event-tag-row">
              <p class="event-tag">{{ $t('filters.class') }}</p>
              <span v-if="isOngoingEvent(eventItem)" class="event-live-badge">進行中</span>
            </div>
            <h3 class="event-title">{{ eventItem.name }}</h3>
            <p class="event-meta">{{ eventItem.organizer || $t('common.tbdOrganizer') }}</p>
            <p class="event-meta">
              {{ $t('event.level') }} · {{ eventItem.level || $t('common.noLevel') }}
            </p>
            <p class="event-meta">
              {{ eventItem.city || $t('common.tbdCity') }}
            </p>
            <p v-if="eventItem.weekday" class="event-meta event-weekday">{{ eventItem.weekday }}</p>
            <p class="event-meta event-recurring">{{ getDisplayTime(eventItem) }}</p>
            <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
            <span class="event-link">{{ $t('event.viewDetails') }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading section-heading-inline">
        <div>
          <p class="section-kicker">{{ $t('home.upcomingTitle') }}</p>
          <h2>{{ $t('home.upcomingSubtitle') }}</h2>
        </div>
        <NuxtLink class="section-link" :to="localePath('calendar')">
          {{ $t('home.viewAll') }}
        </NuxtLink>
      </div>

      <p v-if="error" class="state-copy">{{ $t('common.loadError') }}</p>
      <p v-else-if="upcomingEvents.length === 0" class="state-copy">{{ $t('common.noEvents') }}</p>

      <div v-else class="event-grid">
        <NuxtLink
          v-for="eventItem in upcomingEvents"
          :key="eventItem.id"
          :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
          class="event-card event-card-link"
          :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
        >
          <div class="date-badge">
            <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
            <span class="date-badge-day">{{ getDateBadge(eventItem).day }}</span>
          </div>

          <div class="event-card-body">
            <div class="event-tag-row">
              <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
              <span v-if="isOngoingEvent(eventItem)" class="event-live-badge">進行中</span>
            </div>
            <h3 class="event-title">{{ eventItem.name }}</h3>
            <p class="event-meta">{{ formatDate(eventItem.startTime) }}</p>
            <p class="event-meta">
              {{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}
            </p>
            <p class="event-meta">{{ eventItem.organizer || $t('common.tbdOrganizer') }}</p>
            <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
            <span class="event-link">{{ $t('event.viewDetails') }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.poster-page {
  max-width: 1160px;
  margin: 0 auto;
  padding: 28px 20px 72px;
  color: #f1e4c8;
}

.hero-panel,
.section-block {
  margin-bottom: 28px;
  padding: 28px;
  border: 1px solid rgba(190, 154, 91, 0.4);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(12, 27, 49, 0.96), rgba(7, 15, 28, 0.98)),
    #091321;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.hero-panel {
  position: relative;
  overflow: hidden;
}

.hero-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(142, 35, 35, 0.18), transparent 28%),
    radial-gradient(circle at left center, rgba(183, 140, 63, 0.12), transparent 22%);
  pointer-events: none;
}

.event-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.event-tag-row .event-tag {
  margin: 0;
}

.event-live-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: #7b2d26;
  color: #f9edd8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-kicker,
.section-kicker,
.event-tag,
.event-link,
.section-link {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-kicker,
.section-kicker {
  margin: 0 0 10px;
  color: #d9b36c;
  font-size: 0.82rem;
}

.hero-title {
  margin: 0;
  color: #f8efd8;
  font-size: clamp(2.8rem, 8vw, 5.2rem);
  line-height: 0.95;
}

.hero-subtitle {
  max-width: 760px;
  margin: 18px 0 0;
  color: #f1e4c8;
  font-size: 1.15rem;
  line-height: 1.7;
}

.hero-subtitle-en {
  color: #cfbf9f;
  font-size: 1rem;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 28px;
}

.poster-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border: 1px solid rgba(241, 228, 200, 0.4);
  border-radius: 999px;
  color: #f8efd8;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.04);
}

.poster-button-primary {
  border-color: #c79b52;
  background: #c79b52;
  color: #10151f;
  font-weight: 700;
}

.section-heading {
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0;
  color: #f8efd8;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
}

.section-heading-inline {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.section-link,
.event-link {
  color: #d9b36c;
  text-decoration: none;
  font-size: 0.82rem;
}

.state-copy,
.event-meta {
  color: #d7c8aa;
  line-height: 1.6;
}

.event-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.event-card {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(198, 160, 95, 0.45);
  border-radius: 16px;
  background: linear-gradient(180deg, #efe1bf 0%, #e2cfaa 100%);
  color: #1b1d27;
  box-shadow: inset 0 0 0 1px rgba(111, 63, 28, 0.1);
}

.event-card-regular {
  grid-template-columns: 76px 1fr;
}

.event-card-link {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.event-card-link:hover,
.event-card-link:focus-visible {
  transform: translateY(-3px);
  border-color: #b8774e;
  box-shadow: 0 16px 28px rgba(24, 17, 10, 0.14), inset 0 0 0 1px rgba(111, 63, 28, 0.1);
}

.event-card-link:focus-visible {
  outline: 2px solid #7b2d26;
  outline-offset: 2px;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  border: 1px solid rgba(108, 51, 29, 0.22);
  border-radius: 12px;
  background: linear-gradient(180deg, #742b2b 0%, #4f1e23 100%);
  color: #f9edd8;
}

.date-badge-recurring {
  background: linear-gradient(180deg, #17304c 0%, #10263c 100%);
}

.date-badge-month {
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}

.date-badge-day {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.date-badge-day-small {
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-card-body {
  min-width: 0;
}

.event-tag {
  margin: 0 0 8px;
  color: #7c3f24;
  font-size: 0.78rem;
  font-weight: 700;
}

.event-title {
  margin: 0 0 10px;
  color: #162235;
  font-size: 1.2rem;
}

.event-meta {
  margin: 0 0 6px;
  color: #5d4f3f;
}

.event-summary {
  margin: 12px 0 0;
  color: #352d23;
}

.event-recurring {
  color: #7c3f24;
  font-weight: 600;
}

.event-link {
  color: #7b2d26;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.82rem;
}

.event-card-link:hover .event-link,
.event-card-link:focus-visible .event-link {
  color: #4f1715;
  text-decoration: underline;
}

@media (max-width: 700px) {
  .poster-page {
    padding-inline: 16px;
  }

  .hero-panel,
  .section-block {
    padding: 20px;
  }

  .section-heading-inline {
    align-items: start;
    flex-direction: column;
  }

  .event-card {
    grid-template-columns: 1fr;
  }

  .date-badge {
    width: 88px;
  }
}
</style>
