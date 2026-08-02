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
    :class="{ 'highlight-card-muted': eventItem.eventStatus !== 'scheduled' }"
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
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border: 1px solid rgba(200, 155, 70, 0.28);
  border-radius: var(--bct-radius-lg);
  background: rgba(8, 18, 32, 0.92);
  box-shadow: var(--bct-shadow);
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.highlight-card:hover,
.highlight-card:focus-visible {
  transform: translateY(-4px);
  border-color: rgba(200, 155, 70, 0.48);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.26);
}

.highlight-card:focus-visible {
  outline: 2px solid var(--bct-gold);
  outline-offset: 3px;
}

.highlight-card-muted {
  opacity: 0.88;
}

.highlight-media {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #14243d;
}

.highlight-image,
.highlight-placeholder {
  width: 100%;
  height: 100%;
}

.highlight-image {
  display: block;
  object-fit: cover;
}

.highlight-placeholder {
  background:
    radial-gradient(circle at top right, rgba(200, 155, 70, 0.28), transparent 34%),
    linear-gradient(135deg, rgba(159, 58, 36, 0.4), rgba(14, 28, 47, 0.98));
}

.highlight-content {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.highlight-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.highlight-type {
  margin: 0;
  color: var(--bct-gold);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.highlight-title {
  margin: 0;
  color: var(--bct-cream-strong);
  font-size: 1.45rem;
  line-height: 1.18;
}

.highlight-date {
  margin: 0;
  color: rgba(248, 237, 210, 0.84);
  font-weight: 700;
}

.highlight-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.highlight-meta-item {
  margin: 0;
  color: rgba(248, 237, 210, 0.72);
}

.highlight-status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.highlight-status-cancelled {
  background: rgba(122, 31, 31, 0.18);
  color: #f3b4ad;
}

.highlight-status-postponed {
  background: rgba(122, 82, 8, 0.18);
  color: #f0d59c;
}

.highlight-status-ongoing {
  background: rgba(123, 45, 38, 0.2);
  color: #f4d0c7;
}
</style>
