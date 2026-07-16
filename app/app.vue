<script setup lang="ts">
const localePath = useLocalePath()
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const localeHead = useLocaleHead({
  lang: true,
  dir: true,
  seo: true
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  title: t('site.title'),
  meta: [
    ...localeHead.value.meta,
    {
      name: 'description',
      content: t('site.description')
    }
  ],
  link: localeHead.value.link
}))
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
          v-if="config.public.tallyFormUrl"
          :href="config.public.tallyFormUrl"
          target="_blank"
          rel="noreferrer"
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
