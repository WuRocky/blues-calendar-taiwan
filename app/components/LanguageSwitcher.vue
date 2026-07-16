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
  gap: 8px;
  flex-wrap: wrap;
}

.language-link {
  padding: 8px 10px;
  border: 1px solid rgba(241, 228, 200, 0.22);
  border-radius: 999px;
  color: #f1e4c8;
  text-decoration: none;
  font-size: 0.82rem;
}

.language-link-active {
  border-color: #c79b52;
  background: #c79b52;
  color: #10151f;
  font-weight: 700;
}
</style>
