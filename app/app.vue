<script setup lang="ts">
import { getOgLocale, resolveSeoImage, SITE_NAME } from '~~/lib/event-seo'
import { resolveTallyFormUrl } from '~~/lib/event-report'

const localePath = useLocalePath()
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const isMenuOpen = ref(false)
const submissionUrl = computed(() => resolveTallyFormUrl(config.public.eventSubmissionFormUrl).url)
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

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="site-header bct-container" :class="{ 'site-header-menu-open': isMenuOpen }">
      <NuxtLink class="site-brand" :to="localePath('index')">
        {{ $t('site.title') }}
      </NuxtLink>

      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-controls="site-navigation"
        :aria-label="isMenuOpen ? $t('nav.closeMenu') : $t('nav.openMenu')"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <nav id="site-navigation" class="site-nav" :class="{ 'site-nav-open': isMenuOpen }" :aria-label="$t('nav.primaryNavigation')">
        <NuxtLink :to="localePath('index')" @click="closeMenu">
          {{ $t('nav.home') }}
        </NuxtLink>
        <NuxtLink :to="localePath('calendar')" @click="closeMenu">
          {{ $t('nav.calendar') }}
        </NuxtLink>
        <a v-if="submissionUrl" class="site-nav-submit" :href="submissionUrl" target="_blank" rel="noopener noreferrer" @click="closeMenu">
          {{ $t('nav.submit') }}
        </a>
        <div class="site-activity-types" :aria-label="$t('nav.activityTypes')">
          <span>{{ $t('filters.class') }}</span>
          <span>{{ $t('filters.social') }}</span>
          <span>{{ $t('filters.workshop') }}</span>
          <span>{{ $t('filters.event') }}</span>
        </div>
        <div class="mobile-language-switcher">
          <LanguageSwitcher />
        </div>
      </nav>

      <div class="desktop-language-switcher">
        <LanguageSwitcher />
      </div>
    </header>

    <NuxtPage />
    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.site-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bct-space-6);
  padding-top: clamp(20px, 3vw, 36px);
}

.site-brand,
.site-nav a {
  color: var(--bct-primary);
  text-decoration: none;
}

.site-brand {
  flex-shrink: 0;
  font-family: var(--bct-font-serif);
  font-size: var(--bct-text-lg);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.site-nav {
  display: flex;
  gap: clamp(14px, 2vw, 28px);
  align-items: center;
}

.site-nav a {
  flex-shrink: 0;
  font-size: var(--bct-text-sm);
  font-weight: 600;
  white-space: nowrap;
}

.site-nav-submit {
  color: var(--bct-accent) !important;
}

.site-nav a.router-link-exact-active {
  color: var(--bct-accent);
}

.site-activity-types {
  display: none;
}

.menu-toggle,
.mobile-language-switcher {
  display: none;
}

@media (max-width: 840px) {
  .site-header {
    align-items: center;
    min-height: 72px;
  }

  .site-nav {
    position: absolute;
    z-index: 10;
    top: calc(100% + var(--bct-space-3));
    right: var(--bct-page-gutter);
    left: var(--bct-page-gutter);
    display: none;
    grid-template-columns: 1fr;
    gap: 0;
    padding: var(--bct-space-3) 0;
    border-top: 1px solid var(--bct-panel-border);
    border-bottom: 1px solid var(--bct-panel-border);
    background: var(--bct-surface);
  }

  .site-nav-open {
    display: grid;
  }

  .site-nav a {
    min-height: 46px;
    padding: 0 var(--bct-space-4);
    display: flex;
    align-items: center;
  }

  .site-nav a:hover {
    background: var(--bct-bg-soft);
  }

  .site-activity-types {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: var(--bct-space-3) var(--bct-space-4) var(--bct-space-4);
    padding-top: var(--bct-space-4);
    border-top: 1px solid var(--bct-panel-border);
    color: var(--bct-text-subtle);
    font-size: var(--bct-text-xs);
  }

  .site-activity-types span:not(:last-child)::after {
    margin-left: 6px;
    color: var(--bct-accent-warm);
    content: '·';
  }

  .desktop-language-switcher {
    display: none;
  }

  .mobile-language-switcher {
    display: block;
    padding: var(--bct-space-3) var(--bct-space-4) 0;
    border-top: 1px solid var(--bct-panel-border);
  }

  .menu-toggle {
    display: grid;
    width: 44px;
    height: 44px;
    margin-left: auto;
    padding: 12px 9px;
    border: 0;
    background: transparent;
    color: var(--bct-primary);
    cursor: pointer;
  }

  .menu-toggle span {
    display: block;
    width: 100%;
    height: 1px;
    background: currentColor;
    transition: transform 160ms ease;
  }

  .site-header-menu-open .menu-toggle span:first-child {
    transform: translateY(5px) rotate(45deg);
  }

  .site-header-menu-open .menu-toggle span:last-child {
    transform: translateY(-5px) rotate(-45deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-toggle span {
    transition: none;
  }
}
</style>
