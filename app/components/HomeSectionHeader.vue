<script setup lang="ts">
defineProps<{
  description?: string
  kicker?: string
  linkLabel?: string
  linkTo?: string
  title: string
}>()
</script>

<template>
  <div class="section-header">
    <div class="section-header-copy">
      <p v-if="kicker" class="section-kicker">
        {{ kicker }}
      </p>
      <h2 class="section-title">
        {{ title }}
      </h2>
      <p v-if="description" class="section-description">
        {{ description }}
      </p>
    </div>

    <NuxtLink v-if="linkTo && linkLabel" :to="linkTo" class="section-link">
      {{ linkLabel }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.section-header-copy {
  min-width: 0;
}

.section-kicker {
  margin: 0 0 10px;
  color: var(--bct-gold);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  color: var(--bct-cream-strong);
  font-size: clamp(1.7rem, 3vw, 2.45rem);
  line-height: 1.02;
}

.section-description {
  max-width: 60ch;
  margin: 12px 0 0;
  color: rgba(248, 237, 210, 0.76);
  line-height: 1.7;
}

.section-link {
  flex-shrink: 0;
  color: var(--bct-gold);
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
}

.section-link:hover,
.section-link:focus-visible {
  color: var(--bct-cream-strong);
  text-decoration: underline;
}

@media (max-width: 700px) {
  .section-header {
    align-items: start;
    flex-direction: column;
  }
}
</style>
