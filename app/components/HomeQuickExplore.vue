<script setup lang="ts">
defineProps<{
  items: Array<{
    key: string
    label: string
    to: string
  }>
}>()
</script>

<template>
  <section class="explore-panel">
    <HomeSectionHeader :title="$t('home.quickExplore')" />

    <div class="explore-scroll">
      <div class="explore-row" role="list">
        <NuxtLink
          v-for="item in items"
          :key="item.key"
          :to="item.to"
          class="explore-chip"
          role="listitem"
        >
          {{ item.label }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.explore-panel {
  display: grid;
  gap: 18px;
}

.explore-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
}

.explore-row {
  display: inline-flex;
  gap: 12px;
  min-width: 100%;
  padding-bottom: 2px;
}

.explore-chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(200, 155, 70, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--bct-cream-strong);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.explore-chip:hover,
.explore-chip:focus-visible {
  border-color: rgba(200, 155, 70, 0.52);
  background: rgba(200, 155, 70, 0.12);
  color: var(--bct-cream);
  transform: translateY(-1px);
}
</style>
