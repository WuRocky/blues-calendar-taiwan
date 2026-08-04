<script setup lang="ts">
import { buildLocaleAlternates, buildLocalizedUrl, getOgLocale, resolveSeoImage, SITE_NAME } from '~~/lib/event-seo'
import { selectHighlightEvents } from '~~/lib/home-events'
import type { EventItem } from '~~/types/event'

const config = useRuntimeConfig()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const { data: events } = await useFetch<EventItem[]>('/api/events', { default: () => [] })
const {
  data: weeklyCalendarEvents,
  error: weeklyCalendarError,
  status: weeklyCalendarStatus,
  refresh: refreshWeeklyCalendar
} = await useFetch<EventItem[]>('/api/weekly-calendar-events', { default: () => [] })

const quickExploreItems = computed(() => [
  { key: 'social', label: t('filters.social'), description: t('home.quickExplore.socialDescription'), to: localePath('calendar') },
  { key: 'class', label: t('filters.class'), description: t('home.quickExplore.classDescription'), to: localePath('calendar') },
  { key: 'workshop', label: t('filters.workshop'), description: t('home.quickExplore.workshopDescription'), to: localePath('calendar') },
  { key: 'event', label: t('filters.event'), description: t('home.quickExplore.eventDescription'), to: localePath('calendar') }
])
const highlightEvents = computed(() => selectHighlightEvents(events.value ?? []))

useSeoMeta({ title: () => t('site.seoTitle'), description: () => t('site.description'), ogTitle: () => t('site.seoTitle'), ogDescription: () => t('site.description'), ogUrl: () => buildLocalizedUrl(config.public.siteUrl, locale.value, '/'), ogType: 'website', ogSiteName: SITE_NAME, ogLocale: () => getOgLocale(locale.value), ogImage: () => resolveSeoImage(config.public.siteUrl, ''), twitterCard: 'summary_large_image', twitterTitle: () => t('site.seoTitle'), twitterDescription: () => t('site.description'), twitterImage: () => resolveSeoImage(config.public.siteUrl, '') })
useHead(() => ({ link: [...(buildLocalizedUrl(config.public.siteUrl, locale.value, '/') ? [{ rel: 'canonical', href: buildLocalizedUrl(config.public.siteUrl, locale.value, '/')! }] : []), ...buildLocaleAlternates(config.public.siteUrl, '/').map(a => ({ rel: 'alternate', hreflang: a.hreflang, href: a.href })), ...(buildLocalizedUrl(config.public.siteUrl, 'zh-TW', '/') ? [{ rel: 'alternate', hreflang: 'x-default', href: buildLocalizedUrl(config.public.siteUrl, 'zh-TW', '/')! }] : [])] }))
</script>

<template>
  <main class="home-page">
    <HomeHero />
    <div class="home-content bct-container">
      <WeeklyEventCalendar :events="weeklyCalendarEvents ?? []" :loading="weeklyCalendarStatus === 'pending'" :error="Boolean(weeklyCalendarError)" @refresh="refreshWeeklyCalendar" />
      <section v-if="highlightEvents.length" class="home-section">
        <HomeSectionHeader
          :kicker="$t('home.recentKicker')"
          :title="$t('home.recentTitle')"
          :description="$t('home.recentDescription')"
          :link-label="$t('home.viewAllEvents')"
          :link-to="localePath('calendar')"
        />
        <div class="highlight-grid">
          <HomeHighlightCard
            v-for="(event, index) in highlightEvents"
            :key="event.id"
            :event-item="event"
            :variant="index === 0 ? 'featured' : 'supporting'"
          />
        </div>
      </section>
      <HomeQuickExplore :items="quickExploreItems" />
    </div>
  </main>
</template>

<style scoped>
.home-page{display:grid}.home-content{display:grid;gap:var(--bct-section-gap);padding-block:28px 76px}.home-section{display:grid;gap:clamp(24px,4vw,44px)}.highlight-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr);align-items:start;gap:var(--bct-card-gap)}@media(max-width:760px){.home-content{padding-block:22px 60px}.highlight-grid{grid-template-columns:1fr}}
</style>
