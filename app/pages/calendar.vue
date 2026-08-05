<script setup lang="ts">
import { buildLocaleAlternates, buildLocalizedUrl, getOgLocale, resolveSeoImage, SITE_NAME } from '~~/lib/event-seo'
import { isUnscheduledRegularClass, shouldDisplayCalendarListEvent, shouldDisplayClassCalendarEvent, sortRegularClasses } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

type EventTypeFilter = 'all' | 'class' | 'workshop' | 'social' | 'event'
type SpecificEventTypeFilter = Exclude<EventTypeFilter, 'all'>
type FilterOption = { value: EventTypeFilter, label: string }
type EventSection = { events: EventItem[], title: string | null }
const eventTypeFilters = ['all', 'social', 'class', 'workshop', 'event'] as const

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const activeFilter = ref<EventTypeFilter>('all')

const { data: events, error, status, refresh } = await useFetch<EventItem[]>('/api/events', {
  default: () => []
})

const filterOptions = computed<FilterOption[]>(() => eventTypeFilters.map(value => ({
  value,
  label: t(`filters.${value}`)
})))

function mapFilterType(eventType: string): SpecificEventTypeFilter {
  const normalized = eventType.toLowerCase()
  if (normalized === 'class') return 'class'
  if (normalized === 'workshop') return 'workshop'
  if (normalized === 'social' || normalized === 'open-floor') return 'social'
  return 'event'
}

const regularClassEvents = computed(() => sortRegularClasses(
  (events.value || []).filter((eventItem) => isUnscheduledRegularClass(eventItem))
))

const upcomingAndOngoingEvents = computed(() => (events.value || []).filter((eventItem) => {
  if (!shouldDisplayCalendarListEvent(eventItem)) return false
  return !isUnscheduledRegularClass(eventItem)
}))

const singleClassEvents = computed(() => [...(events.value || [])]
  .filter((eventItem) => shouldDisplayClassCalendarEvent(eventItem) && !isUnscheduledRegularClass(eventItem))
  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '') || a.name.localeCompare(b.name)))

const filteredEvents = computed(() => {
  if (activeFilter.value === 'all') return [...upcomingAndOngoingEvents.value, ...regularClassEvents.value]
  if (activeFilter.value === 'class') return [...regularClassEvents.value, ...singleClassEvents.value]

  return (events.value || []).filter((eventItem) =>
    shouldDisplayCalendarListEvent(eventItem) && mapFilterType(eventItem.eventType) === activeFilter.value
  )
})

const eventSections = computed<EventSection[]>(() => {
  if (activeFilter.value === 'all') {
    return [
      { title: t('calendar.upcomingEvents'), events: upcomingAndOngoingEvents.value },
      { title: t('calendar.regularClasses'), events: regularClassEvents.value }
    ].filter(section => section.events.length)
  }

  if (activeFilter.value === 'class') {
    return [
      { title: t('calendar.regularClasses'), events: regularClassEvents.value },
      { title: t('calendar.recentSingleClasses'), events: singleClassEvents.value }
    ].filter(section => section.events.length)
  }

  return [{ title: null, events: filteredEvents.value }]
})

const activeFilterLabel = computed(() => filterOptions.value.find(option => option.value === activeFilter.value)?.label || '')

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
  <main class="calendar-page bct-container">
    <header class="calendar-intro">
      <p class="calendar-kicker">{{ $t('calendar.kicker') }}</p>
      <h1>{{ $t('calendar.title') }}</h1>
      <p class="calendar-description">{{ $t('calendar.description') }}</p>
      <div class="calendar-context" aria-live="polite">
        <p>{{ $t('calendar.currentFilter', { filter: activeFilterLabel }) }}</p>
        <p>{{ $t('calendar.resultsCount', { count: filteredEvents.length }) }}</p>
      </div>
    </header>

    <section class="calendar-controls" :aria-label="$t('calendar.filterLabel')">
      <div class="filter-row" role="group" :aria-label="$t('calendar.filterLabel')">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          class="filter-chip"
          :class="{ 'filter-chip-active': activeFilter === option.value }"
          type="button"
          :aria-pressed="activeFilter === option.value"
          @click="activeFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <button v-if="activeFilter !== 'all'" class="clear-filter" type="button" @click="activeFilter = 'all'">
        {{ $t('calendar.clearFilter') }}
      </button>
    </section>

    <section class="calendar-results" :aria-busy="status === 'pending'">
      <div v-if="status === 'pending'" class="event-grid event-grid-skeleton" aria-hidden="true">
        <span v-for="index in 6" :key="index" class="event-skeleton" />
      </div>

      <div v-else-if="error" class="calendar-state">
        <p>{{ $t('common.loadError') }}</p>
        <button class="bct-button bct-button--secondary" type="button" @click="() => refresh()">
          {{ $t('calendar.retry') }}
        </button>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="calendar-state">
        <p>{{ $t('common.noMatchingEvents') }}</p>
        <button v-if="activeFilter !== 'all'" class="bct-button bct-button--secondary" type="button" @click="activeFilter = 'all'">
          {{ $t('calendar.emptyAction') }}
        </button>
      </div>

      <div v-else class="calendar-section-list">
        <section v-for="section in eventSections" :key="section.title || activeFilter" class="calendar-event-section">
          <h2 v-if="section.title">{{ section.title }}</h2>
          <div class="event-grid">
            <CalendarEventCard v-for="eventItem in section.events" :key="eventItem.id" :event-item="eventItem" />
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.calendar-page{display:grid;gap:clamp(36px,6vw,72px);padding-block:clamp(38px,7vw,92px) clamp(72px,10vw,144px)}.calendar-intro{max-width:var(--bct-reading-max)}.calendar-kicker{margin:0 0 var(--bct-space-3);color:var(--bct-accent);font-size:var(--bct-text-xs);font-weight:700;letter-spacing:.13em;line-height:1.35;text-transform:uppercase}.calendar-intro h1{margin:0;color:var(--bct-primary);font-family:var(--bct-font-serif);font-size:clamp(2.25rem,4.5vw,4.2rem);font-weight:500;letter-spacing:-.04em;line-height:1.05}.calendar-description{max-width:57ch;margin:var(--bct-space-4) 0 0;color:var(--bct-text-muted);font-size:var(--bct-text-lg);line-height:1.65}.calendar-context{display:flex;flex-wrap:wrap;gap:var(--bct-space-2) var(--bct-space-6);margin-top:var(--bct-space-6);color:var(--bct-text-subtle);font-size:var(--bct-text-sm)}.calendar-context p{margin:0}.calendar-context p:last-child{color:var(--bct-primary);font-weight:700}.calendar-controls{display:flex;align-items:start;justify-content:space-between;gap:var(--bct-space-4);padding:var(--bct-space-4) 0;border-top:1px solid var(--bct-panel-border);border-bottom:1px solid var(--bct-panel-border)}.filter-row{display:flex;flex-wrap:wrap;gap:var(--bct-space-2)}.filter-chip,.clear-filter{min-height:40px;border:1px solid transparent;border-radius:var(--bct-radius-sm);background:transparent;color:var(--bct-primary);cursor:pointer;font-size:var(--bct-text-sm);font-weight:700;line-height:1.25;transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease}.filter-chip{padding:0 12px}.filter-chip:hover{background:var(--bct-surface-strong)}.filter-chip-active{border-color:var(--bct-primary);background:var(--bct-primary);color:#fffdf8}.filter-chip-active:hover{background:var(--bct-primary-hover);color:#fffdf8}.clear-filter{padding:0 4px;color:var(--bct-accent);text-decoration:underline;text-decoration-color:currentColor;text-decoration-thickness:1px;text-underline-offset:.25em}.clear-filter:hover{color:var(--bct-primary)}.calendar-section-list{display:grid;gap:clamp(52px,8vw,104px)}.calendar-event-section{display:grid;gap:var(--bct-space-6)}.calendar-event-section h2{margin:0;color:var(--bct-primary);font-family:var(--bct-font-serif);font-size:var(--bct-text-xl);font-weight:500;letter-spacing:-.025em;line-height:1.12}.event-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(28px,4vw,52px) var(--bct-card-gap)}.calendar-state{display:grid;justify-items:start;gap:var(--bct-space-4);max-width:var(--bct-reading-max);padding:var(--bct-space-8) 0;border-top:1px solid var(--bct-panel-border);border-bottom:1px solid var(--bct-panel-border)}.calendar-state p{margin:0;color:var(--bct-text-muted);font-size:var(--bct-text-lg)}.event-grid-skeleton{pointer-events:none}.event-skeleton{display:block;min-height:390px;border-top:1px solid var(--bct-panel-border);background:linear-gradient(110deg,var(--bct-surface-strong) 12%,var(--bct-surface) 28%,var(--bct-surface-strong) 48%);background-size:220% 100%;animation:calendar-shimmer 1.6s linear infinite}@keyframes calendar-shimmer{to{background-position:-220% 0}}@media(max-width:1000px){.event-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.calendar-page{gap:var(--bct-space-8);padding-top:var(--bct-space-12)}.calendar-controls{display:grid}.filter-row{flex-wrap:nowrap;max-width:100%;overflow-x:auto;padding-bottom:2px}.filter-chip{flex:0 0 auto}.clear-filter{justify-self:start}.event-grid{grid-template-columns:1fr;gap:var(--bct-space-8)}.event-skeleton{min-height:400px}}@media(prefers-reduced-motion:reduce){.event-skeleton{animation:none}}
</style>
