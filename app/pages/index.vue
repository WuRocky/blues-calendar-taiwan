<script setup lang="ts">
import { resolveTallyFormUrl } from '~~/lib/event-report'
import { isRegularClass, shouldDisplayCalendarEvent, sortRegularClasses } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

const config = useRuntimeConfig()
const localePath = useLocalePath()
const { t } = useI18n()

const submissionFormUrl = computed(() => {
  const { url, warningReason } = resolveTallyFormUrl(config.public.eventSubmissionFormUrl)

  if (import.meta.dev && warningReason) {
    console.warn(`[forms] Submission form disabled on home page: ${warningReason}`)
  }

  return url
})

const { data: events, error } = await useFetch<EventItem[]>('/api/events', {
  default: () => []
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

const quickExploreItems = computed(() => {
  const calendarPath = localePath('calendar')

  return [
    { key: 'this-week', label: t('home.thisWeek'), to: calendarPath },
    { key: 'class', label: t('filters.class'), to: calendarPath },
    { key: 'workshop', label: t('filters.workshop'), to: calendarPath },
    { key: 'social', label: t('filters.social'), to: calendarPath },
    { key: 'event', label: t('filters.event'), to: calendarPath }
  ]
})

const regularWeeklyClasses = computed(() => {
  return sortRegularClasses(
    (events.value || []).filter((eventItem) => isRegularClass(eventItem))
  ).slice(0, 6)
})

const upcomingEvents = computed(() => {
  return [...(events.value || [])]
    .filter((eventItem) => shouldDisplayCalendarEvent(eventItem))
    .filter((eventItem) => ['workshop', 'social', 'event'].includes(mapPrimaryType(eventItem.eventType)))
})

const recentEvents = computed(() => upcomingEvents.value.slice(0, 4))

const highlightEvents = computed(() => {
  return upcomingEvents.value
    .filter((eventItem) => ['workshop', 'event'].includes(mapPrimaryType(eventItem.eventType)))
    .slice(0, 3)
})

useSeoMeta({
  title: () => t('site.title'),
  description: () => t('site.description')
})
</script>

<template>
  <main class="home-page">
    <HomeHero :submission-form-url="submissionFormUrl" />

    <HomeQuickExplore :items="quickExploreItems" />

    <section class="home-section">
      <HomeSectionHeader
        :kicker="$t('home.recentKicker')"
        :title="$t('home.recentTitle')"
        :description="$t('home.recentDescription')"
        :link-label="$t('home.viewAll')"
        :link-to="localePath('calendar')"
      />

      <p v-if="error" class="state-copy">{{ $t('common.loadError') }}</p>
      <p v-else-if="recentEvents.length === 0" class="state-copy">{{ $t('common.noEvents') }}</p>

      <div v-else class="recent-grid">
        <HomeEventCard
          v-for="eventItem in recentEvents"
          :key="eventItem.id"
          :event-item="eventItem"
        />
      </div>
    </section>

    <section class="home-section">
      <HomeSectionHeader
        :kicker="$t('home.regularKicker')"
        :title="$t('home.regularClassesTitle')"
        :description="$t('home.regularDescription')"
        :link-label="$t('home.viewAll')"
        :link-to="localePath('calendar')"
      />

      <p v-if="error" class="state-copy">{{ $t('common.loadError') }}</p>
      <p v-else-if="regularWeeklyClasses.length === 0" class="state-copy">{{ $t('common.noClasses') }}</p>

      <div v-else class="regular-grid">
        <HomeRegularClassCard
          v-for="eventItem in regularWeeklyClasses"
          :key="eventItem.id"
          :event-item="eventItem"
        />
      </div>
    </section>

    <section v-if="highlightEvents.length > 0" class="home-section">
      <HomeSectionHeader
        :kicker="$t('home.highlightsKicker')"
        :title="$t('home.highlightsTitle')"
        :description="$t('home.highlightsDescription')"
      />

      <div class="highlight-grid">
        <HomeHighlightCard
          v-for="eventItem in highlightEvents"
          :key="eventItem.id"
          :event-item="eventItem"
        />
      </div>
    </section>

    <section v-if="submissionFormUrl" class="submit-panel">
      <div class="submit-copy">
        <p class="submit-kicker">{{ $t('nav.submit') }}</p>
        <h2 class="submit-title">{{ $t('home.submitTitle') }}</h2>
        <p class="submit-description">{{ $t('home.submitDescription') }}</p>
      </div>

      <a
        class="submit-button"
        :href="submissionFormUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ $t('home.submitAction') }}
      </a>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: var(--bct-section-gap);
  max-width: var(--bct-page-max);
  margin: 0 auto;
  padding: 28px var(--bct-page-gutter) 88px;
}

.home-section {
  display: grid;
  gap: 22px;
}

.state-copy {
  margin: 0;
  padding: 20px 22px;
  border: 1px dashed rgba(200, 155, 70, 0.22);
  border-radius: var(--bct-radius-md);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(248, 237, 210, 0.76);
  line-height: 1.65;
}

.recent-grid,
.regular-grid,
.highlight-grid {
  display: grid;
  gap: var(--bct-card-gap);
}

.recent-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.regular-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.highlight-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.submit-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: clamp(24px, 4vw, 36px);
  border: 1px solid var(--bct-panel-border);
  border-radius: calc(var(--bct-radius-lg) + 2px);
  background:
    linear-gradient(135deg, rgba(14, 28, 47, 0.95), rgba(7, 15, 28, 0.98)),
    var(--bct-panel);
  box-shadow: var(--bct-shadow);
}

.submit-kicker {
  margin: 0 0 10px;
  color: var(--bct-gold);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.submit-title {
  margin: 0;
  color: var(--bct-cream-strong);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(1.85rem, 3.5vw, 2.8rem);
  line-height: 1.04;
}

.submit-description {
  max-width: 46ch;
  margin: 14px 0 0;
  color: rgba(248, 237, 210, 0.76);
  line-height: 1.72;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 20px;
  border-radius: 999px;
  background: var(--bct-gold);
  color: #111827;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.submit-button:hover,
.submit-button:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
}

.submit-button:focus-visible {
  outline: 2px solid var(--bct-cream-strong);
  outline-offset: 3px;
}

@media (max-width: 1180px) {
  .recent-grid,
  .regular-grid,
  .highlight-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .home-page {
    padding-top: 22px;
    padding-bottom: 64px;
  }

  .recent-grid,
  .regular-grid,
  .highlight-grid,
  .submit-panel {
    grid-template-columns: 1fr;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
