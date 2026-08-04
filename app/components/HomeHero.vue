<script setup lang="ts">
import { resolveTallyFormUrl } from '~~/lib/event-report'

const localePath = useLocalePath()
const config = useRuntimeConfig()
const imageFailed = ref(false)
const heroImageSrc = '/images/home-hero-taipei.webp'
const submissionUrl = computed(() => resolveTallyFormUrl(config.public.eventSubmissionFormUrl).url)
</script>

<template>
  <section class="hero">
    <div class="hero-media" :class="{ 'hero-media-fallback': imageFailed }">
      <img
        v-if="!imageFailed"
        :src="heroImageSrc"
        :alt="$t('home.heroImageAlt')"
        width="2000"
        height="3000"
        loading="eager"
        fetchpriority="high"
        @error="imageFailed = true"
      >
    </div>

    <div class="hero-content bct-container">
      <div class="hero-copy">
        <p class="hero-brand">{{ $t('site.kicker') }}</p>
        <h1 class="hero-title">{{ $t('home.heroTitle') }}</h1>
        <p class="hero-description">{{ $t('home.heroDescription') }}</p>
        <div class="hero-actions">
          <NuxtLink class="bct-button hero-primary-action" :to="localePath('calendar')">
            {{ $t('home.heroExploreAction') }} <span aria-hidden="true">→</span>
          </NuxtLink>
          <a v-if="submissionUrl" class="hero-secondary-action" :href="submissionUrl" target="_blank" rel="noopener noreferrer">
            {{ $t('home.heroSubmitAction') }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero{position:relative;min-height:clamp(430px,45vw,620px);overflow:hidden;background:var(--bct-bg-soft);isolation:isolate}.hero-media{position:absolute;inset:0;background:linear-gradient(135deg,var(--bct-bg-soft),var(--bct-surface-strong))}.hero-media::after{position:absolute;inset:0;content:"";background:linear-gradient(90deg,rgba(19,48,72,.74) 0%,rgba(24,58,89,.55) 37%,rgba(24,58,89,.12) 69%,rgba(24,58,89,.02) 100%),linear-gradient(0deg,rgba(20,42,58,.22),transparent 46%)}.hero-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 50%;filter:saturate(.84) contrast(.96)}.hero-media-fallback{background:radial-gradient(circle at 18% 24%,rgba(183,123,53,.28),transparent 28%),linear-gradient(135deg,#254d6a,#b37648)}.hero-content{position:relative;z-index:1;min-height:inherit}.hero-copy{display:flex;flex-direction:column;justify-content:center;min-height:inherit;width:min(780px,66%);padding-block:clamp(44px,8vw,112px) clamp(44px,7vw,90px);color:#fffdf8}.hero-brand{margin:0;color:#f3d7a5;font-size:var(--bct-text-xs);font-weight:700;letter-spacing:.15em;line-height:1.4;text-transform:uppercase}.hero-title{max-width:none;margin:var(--bct-space-4) 0 0;font-family:var(--bct-font-serif);font-size:clamp(2.25rem,4.1vw,4.4rem);font-weight:500;letter-spacing:-.04em;line-height:1.04}.hero-description{max-width:34rem;margin:var(--bct-space-6) 0 0;color:rgba(255,253,248,.9);font-size:var(--bct-text-lg);line-height:1.65}.hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:var(--bct-space-6);margin-top:clamp(24px,4vw,40px)}.hero-primary-action{border-color:#fffdf8;background:#fffdf8;color:var(--bct-primary)}.hero-primary-action:hover{border-color:var(--bct-accent-soft);background:var(--bct-accent-soft);color:var(--bct-primary-active)}.hero-secondary-action{color:#fffdf8;font-size:var(--bct-text-sm);font-weight:700;text-decoration-color:rgba(255,253,248,.62);text-decoration-thickness:1px;text-underline-offset:.35em}.hero-secondary-action:hover{color:#f3d7a5;text-decoration-color:currentColor}.hero-secondary-action:focus-visible{outline-color:#fffdf8}@media(min-width:761px){.hero-title{white-space:nowrap}}
@media(max-width:760px){.hero{min-height:clamp(480px,132vw,620px)}.hero-media::after{background:linear-gradient(0deg,rgba(19,48,72,.76) 0%,rgba(24,58,89,.5) 48%,rgba(24,58,89,.12) 100%)}.hero-media img{object-position:46% 48%}.hero-copy{width:auto;min-height:inherit;padding-block:clamp(170px,44vw,270px) clamp(32px,8vw,48px)}.hero-title{max-width:10ch}.hero-description{max-width:29rem;font-size:var(--bct-text-base)}.hero-actions{gap:var(--bct-space-4)}}
@media(prefers-reduced-motion:reduce){.hero *{scroll-behavior:auto;transition-duration:0ms!important}}
</style>
