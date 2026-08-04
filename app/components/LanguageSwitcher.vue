<script setup lang="ts">
const switchLocalePath = useSwitchLocalePath()

const locales = [
  { code: 'zh-TW', label: '繁中' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' }
] as const

const { locale } = useI18n()
</script>

<template>
  <nav class="language-switcher" aria-label="Language switcher">
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      class="language-link"
      :class="{ 'language-link-active': locale === item.code }"
      :to="switchLocalePath(item.code)"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.language-switcher {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.language-link {
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: var(--bct-radius-sm);
  color: var(--bct-text-muted);
  text-decoration: none;
  font-size: var(--bct-text-xs);
  line-height: 1.35;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.language-link:hover {
  background: var(--bct-surface-strong);
  color: var(--bct-primary);
}

.language-link-active {
  border-color: var(--bct-panel-border);
  background: var(--bct-surface);
  color: var(--bct-primary);
  font-weight: 700;
}
</style>
