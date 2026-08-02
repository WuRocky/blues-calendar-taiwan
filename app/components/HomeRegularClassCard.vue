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

function getStatusLabel(eventItem: EventItem) {
  return getEventDisplayStatusLabel(getEventDisplayStatus(eventItem))
}

function getStatusClass(eventItem: EventItem) {
  if (eventItem.eventStatus === 'cancelled') {
    return 'class-status class-status-cancelled'
  }

  if (eventItem.eventStatus === 'postponed') {
    return 'class-status class-status-postponed'
  }

  return 'class-status class-status-ongoing'
}

function getTimeLine(eventItem: EventItem) {
  if (eventItem.startTime && eventItem.endTime) {
    const start = dayjs.utc(eventItem.startTime).tz('Asia/Taipei')
    const end = dayjs.utc(eventItem.endTime).tz('Asia/Taipei')
    return `${start.format('HH:mm')}–${end.format('HH:mm')}`
  }

  if (eventItem.startTime) {
    return dayjs.utc(eventItem.startTime).tz('Asia/Taipei').format('HH:mm')
  }

  return eventItem.recurringText.trim()
}
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
    class="class-card"
    :class="{ 'class-card-muted': eventItem.eventStatus !== 'scheduled' }"
    :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
  >
    <div class="class-day">
      <span class="class-day-label">{{ eventItem.weekday || $t('event.fixedBadge') }}</span>
    </div>

    <div class="class-copy">
      <div class="class-head">
        <h3 class="class-title">{{ eventItem.name }}</h3>
        <span v-if="getStatusLabel(eventItem)" :class="getStatusClass(eventItem)">
          {{ getStatusLabel(eventItem) }}
        </span>
      </div>

      <p v-if="getTimeLine(eventItem)" class="class-time">
        {{ getTimeLine(eventItem) }}
      </p>

      <div class="class-meta-row">
        <p v-if="eventItem.organizer" class="class-meta">{{ eventItem.organizer }}</p>
        <p v-if="eventItem.city" class="class-meta">{{ eventItem.city }}</p>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.class-card {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 18px;
  border: 1px solid rgba(200, 155, 70, 0.24);
  border-radius: var(--bct-radius-md);
  background: rgba(247, 237, 214, 0.08);
  box-shadow: inset 0 0 0 1px rgba(200, 155, 70, 0.06);
  color: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.class-card:hover,
.class-card:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(200, 155, 70, 0.46);
  background: rgba(247, 237, 214, 0.11);
}

.class-card:focus-visible {
  outline: 2px solid var(--bct-gold);
  outline-offset: 3px;
}

.class-card-muted {
  opacity: 0.84;
}

.class-day {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 82px;
  padding: 10px;
  border-radius: var(--bct-radius-sm);
  background: linear-gradient(180deg, rgba(200, 155, 70, 0.18), rgba(200, 155, 70, 0.05));
  color: var(--bct-gold);
}

.class-day-label {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.class-copy {
  min-width: 0;
}

.class-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.class-title {
  margin: 0;
  color: var(--bct-cream-strong);
  font-size: 1.16rem;
  line-height: 1.28;
}

.class-time {
  margin: 10px 0 0;
  color: rgba(248, 237, 210, 0.84);
  font-weight: 700;
}

.class-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 10px;
}

.class-meta {
  margin: 0;
  color: rgba(248, 237, 210, 0.72);
}

.class-status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.class-status-cancelled {
  background: rgba(122, 31, 31, 0.18);
  color: #f3b4ad;
}

.class-status-postponed {
  background: rgba(122, 82, 8, 0.18);
  color: #f0d59c;
}

.class-status-ongoing {
  background: rgba(123, 45, 38, 0.2);
  color: #f4d0c7;
}

@media (max-width: 640px) {
  .class-card {
    grid-template-columns: 82px minmax(0, 1fr);
    padding: 16px;
  }

  .class-day {
    min-height: 74px;
  }
}
</style>
