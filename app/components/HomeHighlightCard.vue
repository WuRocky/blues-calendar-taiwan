<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getEventDisplayStatus, getEventDisplayStatusLabel } from '~~/lib/event-status'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps<{
  eventItem: EventItem
  variant?: 'featured' | 'supporting'
}>()

const localePath = useLocalePath()
const imageFailed = ref(false)

watch(() => props.eventItem.coverImageUrl, () => {
  imageFailed.value = false
})

function getStatusLabel(eventItem: EventItem) {
  return getEventDisplayStatusLabel(getEventDisplayStatus(eventItem))
}

function getStatusClass(eventItem: EventItem) {
  if (eventItem.eventStatus === 'cancelled') {
    return 'highlight-status highlight-status-cancelled'
  }

  if (eventItem.eventStatus === 'postponed') {
    return 'highlight-status highlight-status-postponed'
  }

  return 'highlight-status highlight-status-ongoing'
}

function getDateLine(eventItem: EventItem) {
  if (!eventItem.startTime) {
    return ''
  }

  const start = dayjs.utc(eventItem.startTime).tz('Asia/Taipei')

  if (!eventItem.endTime) {
    return start.format('YYYY/MM/DD HH:mm')
  }

  const end = dayjs.utc(eventItem.endTime).tz('Asia/Taipei')

  if (start.isSame(end, 'day')) {
    return `${start.format('YYYY/MM/DD HH:mm')}–${end.format('HH:mm')}`
  }

  return `${start.format('YYYY/MM/DD HH:mm')}–${end.format('MM/DD HH:mm')}`
}
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
    class="highlight-card"
    :class="[`highlight-card-${variant ?? 'supporting'}`, { 'highlight-card-muted': eventItem.eventStatus !== 'scheduled' }]"
    :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
  >
    <div class="highlight-media">
      <img
        v-if="eventItem.coverImageUrl && !imageFailed"
        :src="eventItem.coverImageUrl"
        :alt="eventItem.name"
        class="highlight-image"
        loading="lazy"
        @error="imageFailed = true"
      >
      <div v-else class="highlight-placeholder" aria-hidden="true" />
    </div>

    <div class="highlight-content">
      <div class="highlight-head">
        <p class="highlight-type">{{ $t(`filters.${eventItem.eventType === 'workshop' ? 'workshop' : 'event'}`) }}</p>
        <span v-if="getStatusLabel(eventItem)" :class="getStatusClass(eventItem)">
          {{ getStatusLabel(eventItem) }}
        </span>
      </div>

      <h3 class="highlight-title">{{ eventItem.name }}</h3>
      <p class="highlight-date">{{ getDateLine(eventItem) }}</p>

      <div class="highlight-meta">
        <p v-if="eventItem.city" class="highlight-meta-item">{{ eventItem.city }}</p>
        <p v-if="eventItem.organizer" class="highlight-meta-item">{{ eventItem.organizer }}</p>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.highlight-card {
  display: grid;
  overflow: clip;
  border-top: 1px solid var(--bct-panel-border);
  background: var(--bct-surface);
  color: var(--bct-text);
  text-decoration: none;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.highlight-card:hover,
.highlight-card:focus-visible {
  border-color: var(--bct-accent);
  background: var(--bct-bg-soft);
}

.highlight-card:focus-visible {
  outline: 2px solid var(--bct-focus);
  outline-offset: 3px;
}

.highlight-card-muted {
  opacity: 0.88;
}

.highlight-media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--bct-surface-strong);
}

.highlight-image,
.highlight-placeholder {
  width: 100%;
  height: 100%;
}

.highlight-image {
  display: block;
  object-fit: cover;
  transition: transform 300ms ease;
}

.highlight-placeholder {
  background:
    radial-gradient(circle at 82% 22%, rgba(183, 123, 53, 0.48), transparent 24%),
    linear-gradient(135deg, #234967 0%, #183a59 48%, #a84d36 130%);
}

.highlight-content {
  display: grid;
  gap: var(--bct-space-3);
  padding: clamp(20px, 2.5vw, 30px) clamp(20px, 2.5vw, 32px) clamp(28px, 3.4vw, 40px);
}

.highlight-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.highlight-type {
  margin: 0;
  color: var(--bct-accent);
  font-size: var(--bct-text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.highlight-title {
  margin: 0;
  color: var(--bct-primary);
  font-family: var(--bct-font-serif);
  font-size: clamp(1.45rem, 2.3vw, 2.4rem);
  font-weight: 500;
  line-height: 1.12;
}

.highlight-date {
  margin: 0;
  color: var(--bct-text);
  font-size: var(--bct-text-sm);
  font-weight: 700;
}

.highlight-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.highlight-meta-item {
  margin: 0;
  color: var(--bct-text-muted);
  font-size: var(--bct-text-sm);
}

.highlight-status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 7px;
  border-radius: var(--bct-radius-sm);
  font-size: var(--bct-text-xs);
  font-weight: 800;
}

.highlight-status-cancelled {
  background: #f2d9d3;
  color: #7a1f1f;
}

.highlight-status-postponed {
  background: #f3e4c8;
  color: #71500e;
}

.highlight-status-ongoing {
  background: #dce8e5;
  color: #244e4c;
}

.highlight-card-featured .highlight-media {
  aspect-ratio: 4 / 3;
}

.highlight-card-featured .highlight-content {
  max-width: 48rem;
}

.highlight-card-supporting {
  grid-template-columns: minmax(112px, .72fr) minmax(0, 1fr);
  gap: var(--bct-space-4);
  align-items: start;
}

.highlight-card-supporting .highlight-media {
  align-self: start;
  aspect-ratio: 1 / 1;
}

.highlight-card-supporting .highlight-content {
  align-content: start;
  padding: 0 var(--bct-space-3) var(--bct-space-6) 0;
}

.highlight-card-supporting .highlight-title {
  font-size: clamp(1.25rem, 1.7vw, 1.65rem);
}

@media (hover: hover) {
  .highlight-card:hover .highlight-image {
    transform: scale(1.025);
  }
}

@media (max-width: 760px) {
  .highlight-card-supporting {
    grid-template-columns: minmax(124px, .58fr) minmax(0, 1fr);
  }
}

@media (max-width: 440px) {
  .highlight-card-supporting {
    grid-template-columns: 108px minmax(0, 1fr);
  }

  .highlight-card-supporting .highlight-meta {
    display: grid;
    gap: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .highlight-image {
    transition: none;
  }
}
</style>
