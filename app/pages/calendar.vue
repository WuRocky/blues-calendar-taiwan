<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getEventDisplayStatus, getEventDisplayStatusLabel, isEventStatusMuted } from '~~/lib/event-status'
import { buildLocaleAlternates, buildLocalizedUrl, getOgLocale, resolveSeoImage, SITE_NAME } from '~~/lib/event-seo'
import { isUnscheduledRegularClass, shouldDisplayCalendarListEvent, shouldDisplayClassCalendarEvent, sortRegularClasses } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

type EventTypeFilter =
  | 'all'
  | 'class'
  | 'workshop'
  | 'social'
  | 'event'

type SpecificEventTypeFilter = Exclude<EventTypeFilter, 'all'>
type FilterOption = { value: EventTypeFilter, label: string }

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const localePath = useLocalePath()
const activeFilter = ref<EventTypeFilter>('all')

const { data: events, error } = await useFetch<EventItem[]>('/api/events', {
  default: () => []
})

const filterOptions = computed<FilterOption[]>(() => [
  { value: 'all', label: t('filters.all') },
  { value: 'class', label: t('filters.class') },
  { value: 'workshop', label: t('filters.workshop') },
  { value: 'social', label: t('filters.social') },
  { value: 'event', label: t('filters.event') }
])

function mapFilterType(eventType: string): SpecificEventTypeFilter {
  const normalized = eventType.toLowerCase()
  if (normalized === 'class') return 'class'
  if (normalized === 'workshop') return 'workshop'
  if (normalized === 'social' || normalized === 'open-floor') return 'social'
  return 'event'
}

const regularClassEvents = computed(() => {
  return sortRegularClasses(
    (events.value || []).filter((eventItem) => isUnscheduledRegularClass(eventItem))
  )
})

const upcomingAndOngoingEvents = computed(() => {
  return (events.value || []).filter((eventItem) => {
    if (!shouldDisplayCalendarListEvent(eventItem)) {
      return false
    }

    return !isUnscheduledRegularClass(eventItem)
  })
})

const singleClassEvents = computed(() => {
  return [...(events.value || [])]
    .filter((eventItem) => shouldDisplayClassCalendarEvent(eventItem) && !isUnscheduledRegularClass(eventItem))
    .sort((a, b) => {
      const startCompare = (a.startTime || '').localeCompare(b.startTime || '')

      if (startCompare !== 0) {
        return startCompare
      }

      return a.name.localeCompare(b.name)
    })
})

const filteredEvents = computed(() => {
  if (activeFilter.value === 'all') {
    return [...upcomingAndOngoingEvents.value, ...regularClassEvents.value]
  }

  if (activeFilter.value === 'class') {
    return [...regularClassEvents.value, ...singleClassEvents.value]
  }

  return (events.value || []).filter((eventItem) => {
    if (!shouldDisplayCalendarListEvent(eventItem)) {
      return false
    }

    return mapFilterType(eventItem.eventType) === activeFilter.value
  })
})

function formatDate(date: string | null) {
  return date ? dayjs.utc(date).tz('Asia/Taipei').format('YYYY/MM/DD HH:mm') : ''
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

function getEventTypeLabel(eventType: string) {
  return t(`filters.${mapFilterType(eventType)}`)
}

function getStatusLabel(eventItem: EventItem) {
  return getEventDisplayStatusLabel(getEventDisplayStatus(eventItem))
}

function getStatusBadgeClass(eventItem: EventItem) {
  if (eventItem.eventStatus === 'cancelled') {
    return 'event-status-badge-cancelled'
  }

  if (eventItem.eventStatus === 'postponed') {
    return 'event-status-badge-postponed'
  }

  return 'event-live-badge'
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

useSeoMeta({
  title: () => `${t(`calendar.seo${activeFilter.value[0]!.toUpperCase()}${activeFilter.value.slice(1)}`)}｜${SITE_NAME}`,
  description: () => t('calendar.description'),
  ogTitle: () => `${t(`calendar.seo${activeFilter.value[0]!.toUpperCase()}${activeFilter.value.slice(1)}`)}｜${SITE_NAME}`,
  ogDescription: () => t('calendar.description'),
  ogUrl: () => buildLocalizedUrl(config.public.siteUrl, locale.value, '/calendar'),
  ogType: 'website',
  ogSiteName: SITE_NAME,
  ogLocale: () => getOgLocale(locale.value),
  ogImage: () => resolveSeoImage(config.public.siteUrl, ''),
  twitterCard: 'summary_large_image'
})

useHead(() => {
  const canonical = buildLocalizedUrl(config.public.siteUrl, locale.value, '/calendar')
  const defaultUrl = buildLocalizedUrl(config.public.siteUrl, 'zh-TW', '/calendar')
  return {
    link: [
      ...(canonical ? [{ rel: 'canonical', href: canonical }] : []),
      ...buildLocaleAlternates(config.public.siteUrl, '/calendar').map(alternate => ({ rel: 'alternate', hreflang: alternate.hreflang, href: alternate.href })),
      ...(defaultUrl ? [{ rel: 'alternate', hreflang: 'x-default', href: defaultUrl }] : [])
    ]
  }
})
</script>

<template>
  <main class="poster-page">
    <section class="header-panel">
      <p class="section-kicker">{{ $t('calendar.kicker') }}</p>
      <h1>{{ $t('calendar.title') }}</h1>
      <p class="section-description">{{ $t('calendar.description') }}</p>
    </section>

    <section class="filter-panel">
      <div class="filter-row">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          class="filter-chip"
          :class="{ 'filter-chip-active': activeFilter === option.value }"
          type="button"
          @click="activeFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="list-panel">
      <p v-if="error" class="state-copy">{{ $t('common.loadError') }}</p>
      <p v-else-if="filteredEvents.length === 0" class="state-copy">{{ $t('common.noMatchingEvents') }}</p>

      <div v-else class="event-list">
        <template v-if="activeFilter === 'all'">
          <div v-if="regularClassEvents.length" class="calendar-section-heading">
            <h2>{{ $t('calendar.regularClasses') }}</h2>
          </div>

          <div v-if="regularClassEvents.length" class="event-list regular-list">
            <NuxtLink
              v-for="eventItem in regularClassEvents"
              :key="eventItem.id"
              :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
              class="event-card event-card-link"
              :class="{ 'event-card-muted': isEventStatusMuted(eventItem) }"
              :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
            >
              <div class="date-badge">
                <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
                <span class="date-badge-day date-badge-day-small">{{ getDateBadge(eventItem).day }}</span>
              </div>

              <div class="event-content">
                <div class="event-head">
                  <div>
                    <div class="event-tag-row">
                      <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
                      <span v-if="getStatusLabel(eventItem)" :class="getStatusBadgeClass(eventItem)">{{ getStatusLabel(eventItem) }}</span>
                    </div>
                    <h2 class="event-title">{{ eventItem.name }}</h2>
                  </div>
                  <span class="event-link">{{ $t('event.viewDetails') }}</span>
                </div>

                <p class="event-meta">{{ getDisplayTime(eventItem) }}</p>
                <p class="event-meta">
                  {{ eventItem.organizer || $t('common.tbdOrganizer') }}
                </p>
                <p class="event-meta">
                  {{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}
                </p>
                <p v-if="eventItem.recurring && eventItem.recurringText && !eventItem.startTime" class="event-meta event-recurring">
                  {{ eventItem.recurringText }}
                </p>
                <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
              </div>
            </NuxtLink>
          </div>

          <div v-if="upcomingAndOngoingEvents.length" class="event-list regular-list">
            <NuxtLink
              v-for="eventItem in upcomingAndOngoingEvents"
              :key="eventItem.id"
              :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
              class="event-card event-card-link"
              :class="{ 'event-card-muted': isEventStatusMuted(eventItem) }"
              :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
            >
              <div class="date-badge">
                <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
                <span class="date-badge-day" :class="{ 'date-badge-day-small': eventItem.recurring && eventItem.recurringText }">
                  {{ getDateBadge(eventItem).day }}
                </span>
              </div>

              <div class="event-content">
                <div class="event-head">
                  <div>
                    <div class="event-tag-row">
                      <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
                      <span v-if="getStatusLabel(eventItem)" :class="getStatusBadgeClass(eventItem)">{{ getStatusLabel(eventItem) }}</span>
                    </div>
                    <h2 class="event-title">{{ eventItem.name }}</h2>
                  </div>
                  <span class="event-link">{{ $t('event.viewDetails') }}</span>
                </div>

                <p class="event-meta">{{ getDisplayTime(eventItem) }}</p>
                <p class="event-meta">
                  {{ eventItem.organizer || $t('common.tbdOrganizer') }}
                </p>
                <p class="event-meta">
                  {{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}
                </p>
                <p v-if="eventItem.recurring && eventItem.recurringText && !eventItem.startTime" class="event-meta event-recurring">
                  {{ eventItem.recurringText }}
                </p>
                <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
              </div>
            </NuxtLink>
          </div>
        </template>

        <template v-else-if="activeFilter === 'class'">
          <div v-if="regularClassEvents.length" class="calendar-section-heading">
            <h2>{{ $t('calendar.regularClasses') }}</h2>
          </div>

          <div v-if="regularClassEvents.length" class="event-list regular-list">
            <NuxtLink
              v-for="eventItem in regularClassEvents"
              :key="eventItem.id"
              :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
              class="event-card event-card-link"
              :class="{ 'event-card-muted': isEventStatusMuted(eventItem) }"
              :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
            >
              <div class="date-badge">
                <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
                <span class="date-badge-day date-badge-day-small">{{ getDateBadge(eventItem).day }}</span>
              </div>

              <div class="event-content">
                <div class="event-head">
                  <div>
                    <div class="event-tag-row">
                      <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
                      <span v-if="getStatusLabel(eventItem)" :class="getStatusBadgeClass(eventItem)">{{ getStatusLabel(eventItem) }}</span>
                    </div>
                    <h2 class="event-title">{{ eventItem.name }}</h2>
                  </div>
                  <span class="event-link">{{ $t('event.viewDetails') }}</span>
                </div>

                <p class="event-meta">{{ getDisplayTime(eventItem) }}</p>
                <p class="event-meta">
                  {{ eventItem.organizer || $t('common.tbdOrganizer') }}
                </p>
                <p class="event-meta">
                  {{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}
                </p>
                <p v-if="eventItem.recurring && eventItem.recurringText && !eventItem.startTime" class="event-meta event-recurring">
                  {{ eventItem.recurringText }}
                </p>
                <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
              </div>
            </NuxtLink>
          </div>

          <div v-if="singleClassEvents.length" class="calendar-section-heading">
            <h2>{{ $t('calendar.recentSingleClasses') }}</h2>
          </div>

          <div v-if="singleClassEvents.length" class="event-list regular-list">
            <NuxtLink
              v-for="eventItem in singleClassEvents"
              :key="eventItem.id"
              :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
              class="event-card event-card-link"
              :class="{ 'event-card-muted': isEventStatusMuted(eventItem) }"
              :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
            >
              <div class="date-badge">
                <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
                <span class="date-badge-day" :class="{ 'date-badge-day-small': eventItem.recurring && eventItem.recurringText }">
                  {{ getDateBadge(eventItem).day }}
                </span>
              </div>

              <div class="event-content">
                <div class="event-head">
                  <div>
                    <div class="event-tag-row">
                      <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
                      <span v-if="getStatusLabel(eventItem)" :class="getStatusBadgeClass(eventItem)">{{ getStatusLabel(eventItem) }}</span>
                    </div>
                    <h2 class="event-title">{{ eventItem.name }}</h2>
                  </div>
                  <span class="event-link">{{ $t('event.viewDetails') }}</span>
                </div>

                <p class="event-meta">{{ getDisplayTime(eventItem) }}</p>
                <p class="event-meta">
                  {{ eventItem.organizer || $t('common.tbdOrganizer') }}
                </p>
                <p class="event-meta">
                  {{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}
                </p>
                <p v-if="eventItem.recurring && eventItem.recurringText && !eventItem.startTime" class="event-meta event-recurring">
                  {{ eventItem.recurringText }}
                </p>
                <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
              </div>
            </NuxtLink>
          </div>
        </template>

        <template v-else>
          <NuxtLink
            v-for="eventItem in filteredEvents"
            :key="eventItem.id"
            :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
            class="event-card event-card-link"
            :class="{ 'event-card-muted': isEventStatusMuted(eventItem) }"
            :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
          >
            <div class="date-badge">
              <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
              <span class="date-badge-day" :class="{ 'date-badge-day-small': eventItem.recurring && eventItem.recurringText }">
                {{ getDateBadge(eventItem).day }}
              </span>
            </div>

            <div class="event-content">
              <div class="event-head">
                <div>
                  <div class="event-tag-row">
                    <p class="event-tag">{{ getEventTypeLabel(eventItem.eventType) }}</p>
                    <span v-if="getStatusLabel(eventItem)" :class="getStatusBadgeClass(eventItem)">{{ getStatusLabel(eventItem) }}</span>
                  </div>
                  <h2 class="event-title">{{ eventItem.name }}</h2>
                </div>
                <span class="event-link">{{ $t('event.viewDetails') }}</span>
              </div>

              <p class="event-meta">{{ getDisplayTime(eventItem) }}</p>
              <p class="event-meta">
                {{ eventItem.organizer || $t('common.tbdOrganizer') }}
              </p>
              <p class="event-meta">
                {{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}
              </p>
              <p v-if="eventItem.recurring && eventItem.recurringText && !eventItem.startTime" class="event-meta event-recurring">
                {{ eventItem.recurringText }}
              </p>
              <p class="event-summary">{{ eventItem.summary || $t('common.noSummary') }}</p>
            </div>
          </NuxtLink>
        </template>
      </div>
    </section>
  </main>
</template>

<style scoped>
.poster-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 20px 72px;
  color: #f1e4c8;
}

.header-panel,
.filter-panel,
.list-panel {
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid rgba(190, 154, 91, 0.36);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(12, 27, 49, 0.96), rgba(7, 15, 28, 0.98)),
    #091321;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
}

.section-kicker,
.event-tag {
  margin: 0 0 10px;
  color: #d9b36c;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.header-panel h1 {
  margin: 0;
  color: #f8efd8;
  font-size: clamp(2.1rem, 6vw, 4rem);
}

.section-description,
.state-copy,
.event-meta {
  color: #d7c8aa;
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

.event-status-badge-cancelled,
.event-status-badge-postponed {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.event-status-badge-cancelled {
  background: rgba(112, 24, 24, 0.18);
  color: #f3b4ad;
  border: 1px solid rgba(243, 180, 173, 0.28);
}

.event-status-badge-postponed {
  background: rgba(129, 92, 15, 0.18);
  color: #f0d59c;
  border: 1px solid rgba(240, 213, 156, 0.28);
}

.event-card-muted {
  opacity: 0.82;
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 10px 14px;
  border: 1px solid rgba(241, 228, 200, 0.28);
  border-radius: 999px;
  color: #f1e4c8;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.filter-chip-active {
  border-color: #c79b52;
  background: #c79b52;
  color: #10151f;
  font-weight: 700;
}

.event-list {
  display: grid;
  gap: 16px;
}

.event-card {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(198, 160, 95, 0.45);
  border-radius: 16px;
  background: linear-gradient(180deg, #efe1bf 0%, #e2cfaa 100%);
  color: #1b1d27;
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
  box-shadow: 0 16px 28px rgba(24, 17, 10, 0.14);
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
  min-height: 96px;
  border: 1px solid rgba(108, 51, 29, 0.22);
  border-radius: 12px;
  background: linear-gradient(180deg, #742b2b 0%, #4f1e23 100%);
  color: #f9edd8;
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

.event-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.event-title {
  margin: 0 0 10px;
  color: #162235;
  font-size: 1.3rem;
}

.event-tag {
  margin-bottom: 6px;
  color: #7c3f24;
  font-weight: 700;
}

.event-link {
  color: #7b2d26;
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
}

.event-card-link:hover .event-link,
.event-card-link:focus-visible .event-link {
  color: #4f1715;
  text-decoration: underline;
}

.event-meta {
  margin: 0 0 6px;
  color: #5d4f3f;
}

.event-summary {
  margin: 10px 0 0;
  color: #352d23;
  line-height: 1.6;
}

.event-recurring {
  color: #7c3f24;
  font-weight: 600;
}

@media (max-width: 720px) {
  .poster-page {
    padding-inline: 16px;
  }

  .header-panel,
  .filter-panel,
  .list-panel {
    padding: 18px;
  }

  .event-card {
    grid-template-columns: 1fr;
  }

  .date-badge {
    width: 88px;
  }

  .event-head {
    flex-direction: column;
  }
}
</style>
