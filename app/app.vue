<script setup lang="ts">
import { resolveTallyFormUrl } from '~~/lib/event-report'
import { getOgLocale, resolveSeoImage, SITE_NAME } from '~~/lib/event-seo'

const localePath = useLocalePath()
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const localeHead = useLocaleHead({
  lang: true,
  dir: true,
  seo: false
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  titleTemplate: title => title || t('site.seoTitle'),
  link: localeHead.value.link
}))

useSeoMeta({
  title: () => t('site.seoTitle'),
  description: () => t('site.description'),
  ogSiteName: SITE_NAME,
  ogLocale: () => getOgLocale(locale.value),
  ogType: 'website',
  ogImage: () => resolveSeoImage(config.public.siteUrl, ''),
  twitterCard: 'summary_large_image'
})

const submissionFormUrl = computed(() => {
  const { url, warningReason } = resolveTallyFormUrl(config.public.eventSubmissionFormUrl)

  if (import.meta.dev && warningReason) {
    console.warn(`[forms] Submission form disabled: ${warningReason}`)
  }

  return url
})
</script>

<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="site-header">
      <NuxtLink class="site-brand" :to="localePath('index')">
        {{ $t('site.title') }}
      </NuxtLink>

      <nav class="site-nav">
        <NuxtLink :to="localePath('index')">
          {{ $t('nav.home') }}
        </NuxtLink>
        <NuxtLink :to="localePath('calendar')">
          {{ $t('nav.calendar') }}
        </NuxtLink>
        <a
          v-if="submissionFormUrl"
          :href="submissionFormUrl"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="$t('nav.submit')"
        >
          {{ $t('nav.submit') }}
        </a>
      </nav>

      <LanguageSwitcher />
    </header>

    <NuxtPage />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: var(--bct-page-max);
  margin: 0 auto;
  padding: 18px var(--bct-page-gutter) 0;
}

.site-brand,
.site-nav a {
  color: var(--bct-cream-strong);
  text-decoration: none;
}

.site-brand {
  flex-shrink: 0;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.site-nav {
  display: flex;
  gap: 16px;
  align-items: center;
}

.site-nav a {
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 840px) {
  .site-header {
    flex-wrap: wrap;
    row-gap: 14px;
  }

  .site-nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }
}
</style>
