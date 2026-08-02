<script setup lang="ts">
const localePath = useLocalePath()
const imageFailed = ref(false)
const heroImageSrc = '/images/home-hero-taipei.webp'
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

    <div class="hero-copy">
      <p class="hero-brand">{{ $t('site.title') }}</p>
      <h1 class="hero-title">{{ $t('home.heroTitle') }}</h1>
      <p class="hero-description">{{ $t('home.heroDescription') }}</p>
      <NuxtLink class="hero-link" :to="localePath('calendar')">
        {{ $t('home.viewAllEvents') }} <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.hero{position:relative;min-height:clamp(340px,34vw,430px);overflow:hidden;border:1px solid var(--bct-panel-border);border-radius:calc(var(--bct-radius-lg) + 2px);background:linear-gradient(135deg,var(--bct-bg),var(--bct-bg-soft));isolation:isolate}.hero-media{position:absolute;inset:0;background:linear-gradient(135deg,var(--bct-bg),var(--bct-bg-soft))}.hero-media::after{content:'';position:absolute;inset:0;background:linear-gradient(270deg,rgba(7,17,31,.84) 0%,rgba(7,17,31,.5) 44%,rgba(7,17,31,.08) 76%),linear-gradient(0deg,rgba(7,17,31,.38) 0%,transparent 58%)}.hero-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 47%}.hero-media-fallback{background:radial-gradient(circle at 18% 24%,var(--bct-gold-soft) 0,transparent 28%),linear-gradient(135deg,var(--bct-bg),var(--bct-bg-soft) 70%,var(--bct-copper))}.hero-copy{position:absolute;z-index:1;right:clamp(24px,5vw,64px);top:50%;width:min(520px,45%);transform:translateY(-50%);color:var(--bct-cream-strong)}.hero-brand{margin:0;color:var(--bct-gold);font-size:.78rem;font-weight:800;letter-spacing:.17em;text-transform:uppercase}.hero-title{max-width:12ch;margin:12px 0 0;font:700 clamp(2.15rem,4.4vw,3.85rem)/1 Georgia,"Times New Roman",serif;letter-spacing:-.035em;text-shadow:0 1px 2px rgba(0,0,0,.28)}.hero-description{max-width:36rem;margin:16px 0 0;color:rgba(248,237,210,.86);font-size:clamp(.96rem,1.5vw,1.08rem);line-height:1.65;white-space:pre-line}.hero-link{display:inline-flex;align-items:center;gap:8px;min-height:44px;margin-top:20px;color:var(--bct-cream-strong);font-weight:800;text-decoration-color:var(--bct-gold);text-decoration-line:underline;text-decoration-thickness:2px;text-underline-offset:6px;transition:color .18s ease,gap .18s ease}.hero-link:hover{gap:12px;color:var(--bct-gold)}.hero-link:focus-visible{outline:2px solid var(--bct-gold);outline-offset:5px}
@media(max-width:760px){.hero{min-height:clamp(360px,112vw,430px)}.hero-media::after{background:linear-gradient(0deg,rgba(7,17,31,.92) 0%,rgba(7,17,31,.58) 58%,rgba(7,17,31,.1) 100%)}.hero-media img{object-position:43% 44%}.hero-copy{top:auto;right:clamp(20px,6vw,30px);bottom:clamp(20px,6vw,28px);left:clamp(20px,6vw,30px);width:auto;transform:none}.hero-title{max-width:14ch;font-size:clamp(2rem,9.5vw,3rem)}.hero-description{max-width:32rem;margin-top:12px;font-size:.94rem;line-height:1.55}.hero-link{margin-top:14px}}
@media(max-width:390px){.hero{min-height:390px}.hero-title{font-size:clamp(1.9rem,9.5vw,2.45rem)}}
</style>
