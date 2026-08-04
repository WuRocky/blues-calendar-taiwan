<script setup lang="ts">
defineProps<{
  items: Array<{
    key: string
    label: string
    description: string
    to: string
  }>
}>()
</script>

<template>
  <section class="explore-panel">
    <HomeSectionHeader :title="$t('home.quickExplore.title')" :description="$t('home.quickExplore.description')" />

    <div class="explore-row" role="list">
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.to"
        class="explore-card"
        :class="`explore-card-${item.key}`"
        role="listitem"
      >
        <span class="explore-media" aria-hidden="true">
          <img src="/images/home-hero-taipei.webp" width="2000" height="3000" alt="">
        </span>
        <span class="explore-content">
          <strong>{{ item.label }}</strong>
          <span>{{ item.description }}</span>
          <span class="explore-arrow" aria-hidden="true">→</span>
        </span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.explore-panel {
  display: grid;
  gap: clamp(24px, 4vw, 44px);
}

.explore-row {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--bct-card-gap);
}

.explore-card {
  position: relative;
  display: grid;
  min-height: 240px;
  overflow: hidden;
  border-top: 1px solid var(--bct-panel-border);
  background: var(--bct-surface-strong);
  color: #fffdf8;
  text-decoration: none;
  transition: border-color 160ms ease;
}

.explore-card-class,
.explore-card-workshop {
  grid-column: span 4;
}

.explore-card-social {
  grid-column: span 5;
}

.explore-card-event {
  grid-column: span 7;
}

.explore-media,
.explore-media::after,
.explore-media img {
  position: absolute;
  inset: 0;
}

.explore-media::after {
  content: '';
  background: linear-gradient(0deg, rgba(16, 45, 70, .78), rgba(16, 45, 70, .08) 68%);
}

.explore-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.68) contrast(.93);
  transition: transform 300ms ease;
}

.explore-card-class .explore-media img { object-position: 28% 45%; }
.explore-card-workshop .explore-media img { object-position: 58% 46%; }
.explore-card-social .explore-media img { object-position: 38% 58%; }
.explore-card-event .explore-media img { object-position: 70% 48%; }

.explore-content {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  gap: var(--bct-space-2);
  padding: var(--bct-space-6);
}

.explore-content strong {
  font-family: var(--bct-font-serif);
  font-size: clamp(1.45rem, 2.5vw, 2.15rem);
  font-weight: 500;
  letter-spacing: -.02em;
  line-height: 1.1;
}

.explore-content > span:not(.explore-arrow) {
  max-width: 29ch;
  color: rgba(255, 253, 248, .84);
  font-size: var(--bct-text-sm);
  line-height: 1.55;
}

.explore-arrow {
  margin-top: var(--bct-space-2);
  color: #f3d7a5;
  font-size: 1.2rem;
}

.explore-card:hover,
.explore-card:focus-visible {
  border-color: var(--bct-accent-warm);
  color: #fffdf8;
}

@media (hover: hover) {
  .explore-card:hover .explore-media img {
    transform: scale(1.025);
  }
}

@media(max-width:900px){.explore-card-class,.explore-card-workshop,.explore-card-social,.explore-card-event{grid-column:span 6}.explore-card{min-height:220px}}
@media(max-width:560px){.explore-row{grid-template-columns:1fr;gap:var(--bct-space-4)}.explore-card-class,.explore-card-workshop,.explore-card-social,.explore-card-event{grid-column:auto;min-height:220px}.explore-content{padding:var(--bct-space-6)}.explore-content strong{font-size:1.7rem}}
@media(prefers-reduced-motion:reduce){.explore-media img{transition:none}}
</style>
