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
  max-width: 1160px;
  margin: 0 auto;
  padding: 18px 20px 0;
}

.site-brand,
.site-nav a {
  color: #f1e4c8;
  text-decoration: none;
}

.site-brand {
  font-weight: 700;
}

.site-nav {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 840px) {
  .site-header {
    align-items: start;
    flex-direction: column;
  }
}
</style>
