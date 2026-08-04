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
  gap: var(--bct-space-6);
}

.section-header-copy {
  min-width: 0;
}

.section-kicker {
  margin: 0 0 var(--bct-space-3);
  color: var(--bct-accent);
  font-size: var(--bct-text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  color: var(--bct-primary);
  font-family: var(--bct-font-serif);
  font-size: var(--bct-text-xl);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.12;
}

.section-description {
  max-width: 60ch;
  margin: var(--bct-space-3) 0 0;
  color: var(--bct-text-muted);
  line-height: 1.7;
}

.section-link {
  flex-shrink: 0;
  color: var(--bct-primary);
  font-size: var(--bct-text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
}

.section-link:hover,
.section-link:focus-visible {
  color: var(--bct-accent);
  text-decoration: underline;
}

@media (max-width: 700px) {
  .section-header {
    align-items: start;
    flex-direction: column;
  }
}
</style>
