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
    <HomeSectionHeader :title="$t('home.quickExplore.title')" />

    <div class="explore-row" role="list">
        <NuxtLink
          v-for="item in items"
          :key="item.key"
          :to="item.to"
          class="explore-card"
          role="listitem"
        >
          <strong>{{ item.label }}</strong><span>{{ item.description }}</span>
        </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.explore-panel {
  display: grid;
  gap: 18px;
}

.explore-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.explore-card {
  display: grid;
  gap: 8px;
  align-content: center;
  min-height: 116px;
  padding: 18px;
  border: 1px solid rgba(200, 155, 70, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--bct-cream-strong);
  font-weight: 700;
  text-decoration: none;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.explore-card span{color:rgba(248,237,210,.68);font-size:.88rem;line-height:1.5}.explore-card:hover,
.explore-card:focus-visible {
  border-color: rgba(200, 155, 70, 0.52);
  background: rgba(200, 155, 70, 0.12);
  color: var(--bct-cream);
  transform: translateY(-1px);
}
@media(max-width:900px){.explore-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:420px){.explore-card{padding:14px;min-height:124px}}
</style>
