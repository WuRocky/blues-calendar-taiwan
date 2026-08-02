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
    <WeeklyEventCalendar :events="weeklyCalendarEvents ?? []" :loading="weeklyCalendarStatus === 'pending'" :error="Boolean(weeklyCalendarError)" @refresh="refreshWeeklyCalendar" />
    <HomeQuickExplore :items="quickExploreItems" />
    <section v-if="highlightEvents.length" class="home-section">
      <HomeSectionHeader :title="$t('home.highlights.title')" />
      <div class="highlight-grid"><HomeHighlightCard v-for="event in highlightEvents" :key="event.id" :event-item="event" /></div>
    </section>
  </main>
</template>

<style scoped>
.home-page{display:grid;gap:var(--bct-section-gap);max-width:var(--bct-page-max);margin:0 auto;padding:28px var(--bct-page-gutter) 76px}.home-section{display:grid;gap:22px}.highlight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--bct-card-gap)}@media(max-width:700px){.home-page{padding-top:22px;padding-bottom:60px}.highlight-grid{grid-template-columns:1fr}}
</style>
