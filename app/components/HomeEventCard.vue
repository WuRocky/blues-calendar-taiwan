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
const { t } = useI18n()

function getDateBadge(eventItem: EventItem) {
  if (!eventItem.startTime) {
    return {
      month: 'TBD',
      day: '--'
    }
  }

  const start = dayjs.utc(eventItem.startTime).tz('Asia/Taipei')

  if (!eventItem.endTime) {
    return {
      month: start.format('MMM').toUpperCase(),
      day: start.format('DD')
    }
  }

  const end = dayjs.utc(eventItem.endTime).tz('Asia/Taipei')

  if (start.isSame(end, 'month')) {
    return {
      month: start.format('MMM').toUpperCase(),
      day: start.isSame(end, 'day') ? start.format('DD') : `${start.format('DD')}–${end.format('DD')}`
    }
  }

  return {
    month: start.format('MMM').toUpperCase(),
    day: start.format('DD')
  }
}

function formatTimeLine(eventItem: EventItem) {
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

  return `${start.format('YYYY/MM/DD HH:mm')}–${end.format('YYYY/MM/DD HH:mm')}`
}

function getStatusLabel(eventItem: EventItem) {
  return getEventDisplayStatusLabel(getEventDisplayStatus(eventItem))
}

function getStatusClass(eventItem: EventItem) {
  if (eventItem.eventStatus === 'cancelled') {
    return 'status-badge status-badge-cancelled'
  }

  if (eventItem.eventStatus === 'postponed') {
    return 'status-badge status-badge-postponed'
  }

  return 'status-badge status-badge-ongoing'
}

const primaryMeta = computed(() => {
  return [t(`filters.${mapPrimaryType(props.eventItem.eventType)}`), props.eventItem.city.trim()].filter(Boolean).join(' · ')
})

const secondaryMeta = computed(() => {
  return [props.eventItem.venueName.trim(), props.eventItem.organizer.trim(), props.eventItem.price.trim()].filter(Boolean)
})

function mapPrimaryType(eventType: string) {
  const normalized = eventType.toLowerCase()

  if (normalized === 'class') {
    return 'class'
  }

  if (normalized === 'workshop') {
    return 'workshop'
  }

  if (normalized === 'social' || normalized === 'open-floor') {
    return 'social'
  }

  return 'event'
}
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
    class="event-card"
    :class="{ 'event-card-muted': eventItem.eventStatus !== 'scheduled' }"
    :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
  >
    <div class="date-badge" aria-hidden="true">
      <span class="date-badge-month">{{ getDateBadge(eventItem).month }}</span>
      <span class="date-badge-day">{{ getDateBadge(eventItem).day }}</span>
    </div>

    <div class="event-content">
      <div class="event-head">
        <p v-if="primaryMeta" class="event-meta-top">
          {{ primaryMeta }}
        </p>
        <span v-if="getStatusLabel(eventItem)" :class="getStatusClass(eventItem)">
          {{ getStatusLabel(eventItem) }}
        </span>
      </div>

      <h3 class="event-title">
        {{ eventItem.name }}
      </h3>

      <p class="event-time">
        {{ formatTimeLine(eventItem) }}
      </p>

      <div v-if="secondaryMeta.length" class="event-meta-list">
        <p v-for="entry in secondaryMeta" :key="entry" class="event-meta">
          {{ entry }}
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.event-card {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 16px;
  min-height: 100%;
  padding: 18px;
  border: 1px solid rgba(200, 155, 70, 0.32);
  border-radius: var(--bct-radius-md);
  background: linear-gradient(180deg, #f4e4bf 0%, #ecdcbb 100%);
  box-shadow: inset 0 0 0 1px rgba(119, 75, 31, 0.06);
  color: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.event-card:hover,
.event-card:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(159, 58, 36, 0.42);
  box-shadow: 0 20px 30px rgba(16, 18, 24, 0.12);
}

.event-card:focus-visible {
  outline: 2px solid var(--bct-gold);
  outline-offset: 3px;
}

.event-card-muted {
  opacity: 0.86;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--bct-radius-sm);
  background: linear-gradient(180deg, #7f3029 0%, #5b2328 100%);
  color: var(--bct-cream-strong);
}

.date-badge-month {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.date-badge-day {
  margin-top: 6px;
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1;
}

.event-content {
  min-width: 0;
}

.event-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.event-meta-top {
  margin: 0;
  color: var(--bct-copper);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-title {
  margin: 10px 0 0;
  color: var(--bct-text-dark);
  font-size: 1.28rem;
  line-height: 1.22;
}

.event-time {
  margin: 12px 0 0;
  color: #2f405f;
  font-weight: 700;
  line-height: 1.5;
}

.event-meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 12px;
}

.event-meta {
  margin: 0;
  color: var(--bct-text-muted);
  line-height: 1.55;
}

.status-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1;
}

.status-badge-cancelled {
  border-color: rgba(122, 31, 31, 0.22);
  background: rgba(122, 31, 31, 0.12);
  color: #7a1f1f;
}

.status-badge-postponed {
  border-color: rgba(122, 82, 8, 0.24);
  background: rgba(122, 82, 8, 0.12);
  color: #7a5208;
}

.status-badge-ongoing {
  border-color: rgba(123, 45, 38, 0.22);
  background: rgba(123, 45, 38, 0.1);
  color: #7b2d26;
}

@media (max-width: 640px) {
  .event-card {
    grid-template-columns: 72px minmax(0, 1fr);
    padding: 16px;
  }

  .date-badge-day {
    font-size: 1.45rem;
  }
}
</style>
