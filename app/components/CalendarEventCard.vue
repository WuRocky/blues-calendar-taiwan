<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getEventDisplayStatus, getEventDisplayStatusLabel, isEventStatusMuted } from '~~/lib/event-status'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps<{
  eventItem: EventItem
}>()

const localePath = useLocalePath()
const { t } = useI18n()
const imageFailed = ref(false)

watch(() => props.eventItem.coverImageUrl, () => {
  imageFailed.value = false
})

function mapFilterType(eventType: string) {
  const normalized = eventType.toLowerCase()
  if (normalized === 'class') return 'class'
  if (normalized === 'workshop') return 'workshop'
  if (normalized === 'social' || normalized === 'open-floor') return 'social'
  return 'event'
}

function getDateBadge(eventItem: EventItem) {
  if (eventItem.recurring && eventItem.recurringText) {
    return { month: t('event.fixedBadge'), day: t('event.classBadge') }
  }

  if (!eventItem.startTime) {
    return { month: 'TBD', day: '--' }
  }

  const localDate = dayjs.utc(eventItem.startTime).tz('Asia/Taipei')
  return { month: localDate.format('MMM').toUpperCase(), day: localDate.format('DD') }
}

function getDisplayTime(eventItem: EventItem) {
  if (eventItem.startTime) {
    const start = dayjs.utc(eventItem.startTime).tz('Asia/Taipei')

    if (!eventItem.endTime) {
      return start.format('YYYY/MM/DD HH:mm')
    }

    const end = dayjs.utc(eventItem.endTime).tz('Asia/Taipei')
    return start.isSame(end, 'day')
      ? `${start.format('YYYY/MM/DD HH:mm')}–${end.format('HH:mm')}`
      : `${start.format('YYYY/MM/DD HH:mm')}–${end.format('MM/DD HH:mm')}`
  }

  if (eventItem.recurring && eventItem.recurringText) {
    return eventItem.recurringText
  }

  return t('common.timeToBeAnnounced')
}

const displayStatusLabel = computed(() => getEventDisplayStatusLabel(getEventDisplayStatus(props.eventItem)))
const typeLabel = computed(() => t(`filters.${mapFilterType(props.eventItem.eventType)}`))
const dateBadge = computed(() => getDateBadge(props.eventItem))
const displayTime = computed(() => getDisplayTime(props.eventItem))
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'events-slug', params: { slug: eventItem.slug } })"
    class="calendar-event-card"
    :class="{ 'calendar-event-card-muted': isEventStatusMuted(eventItem) }"
    :aria-label="`${$t('event.viewDetails')} ${eventItem.name}`"
  >
    <div class="calendar-event-media">
      <img
        v-if="eventItem.coverImageUrl && !imageFailed"
        :src="eventItem.coverImageUrl"
        :alt="eventItem.name"
        width="1600"
        height="1200"
        loading="lazy"
        @error="imageFailed = true"
      >
      <div v-else class="calendar-event-placeholder" aria-hidden="true" />
      <div class="calendar-date-badge" aria-hidden="true">
        <span>{{ dateBadge.month }}</span>
        <strong :class="{ 'calendar-date-badge-small': eventItem.recurring && eventItem.recurringText }">{{ dateBadge.day }}</strong>
      </div>
    </div>

    <div class="calendar-event-content">
      <div class="calendar-event-topline">
        <p class="calendar-event-type">{{ typeLabel }}</p>
        <span
          v-if="displayStatusLabel"
          class="calendar-event-status"
          :class="{
            'calendar-event-status-cancelled': eventItem.eventStatus === 'cancelled',
            'calendar-event-status-postponed': eventItem.eventStatus === 'postponed',
            'calendar-event-status-ongoing': eventItem.eventStatus === 'scheduled' && eventItem.timeStatus === 'ongoing'
          }"
        >
          {{ displayStatusLabel }}
        </span>
      </div>

      <h3>{{ eventItem.name }}</h3>
      <p class="calendar-event-time">{{ displayTime }}</p>
      <div class="calendar-event-meta">
        <p>{{ eventItem.city || $t('common.tbdCity') }} · {{ eventItem.venueName || $t('common.tbdVenue') }}</p>
        <p>{{ eventItem.organizer || $t('common.tbdOrganizer') }}</p>
        <p v-if="eventItem.price">{{ eventItem.price }}</p>
      </div>
      <p v-if="eventItem.summary" class="calendar-event-summary">{{ eventItem.summary }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.calendar-event-card{display:grid;grid-template-rows:auto 1fr;min-width:0;overflow:clip;border-top:1px solid var(--bct-panel-border);background:var(--bct-surface);color:var(--bct-text);text-decoration:none;transition:border-color 160ms ease,background-color 160ms ease}.calendar-event-card:hover,.calendar-event-card:focus-visible{border-color:var(--bct-accent);background:var(--bct-bg-soft);color:var(--bct-text)}.calendar-event-card:focus-visible{outline:2px solid var(--bct-focus);outline-offset:3px}.calendar-event-card-muted{opacity:.72}.calendar-event-media{position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--bct-surface-strong)}.calendar-event-media img,.calendar-event-placeholder{display:block;width:100%;height:100%}.calendar-event-media img{object-fit:cover;transition:transform 300ms ease}.calendar-event-placeholder{background:radial-gradient(circle at 80% 20%,rgba(183,123,53,.48),transparent 25%),linear-gradient(135deg,#234967 0%,#183a59 50%,#a84d36 140%)}.calendar-date-badge{position:absolute;top:var(--bct-space-3);left:var(--bct-space-3);display:grid;gap:2px;min-width:58px;padding:8px;border:1px solid rgba(255,253,248,.5);background:rgba(24,58,89,.9);color:#fffdf8;text-align:center}.calendar-date-badge span{font-size:10px;font-weight:700;letter-spacing:.1em}.calendar-date-badge strong{font-family:var(--bct-font-serif);font-size:1.6rem;font-weight:500;line-height:1}.calendar-date-badge .calendar-date-badge-small{font-family:var(--bct-font-sans);font-size:var(--bct-text-xs);letter-spacing:.06em}.calendar-event-content{display:grid;align-content:start;gap:var(--bct-space-3);padding:clamp(20px,2.25vw,28px) clamp(20px,2.25vw,28px) clamp(28px,3vw,36px)}.calendar-event-topline{display:flex;align-items:start;justify-content:space-between;gap:var(--bct-space-3)}.calendar-event-type{margin:0;color:var(--bct-accent);font-size:var(--bct-text-xs);font-weight:700;letter-spacing:.1em;line-height:1.35;text-transform:uppercase}.calendar-event-status{flex:0 0 auto;padding:3px 6px;border-radius:var(--bct-radius-sm);font-size:var(--bct-text-xs);font-weight:700;line-height:1.35}.calendar-event-status-cancelled{background:#f2d9d3;color:#7a1f1f}.calendar-event-status-postponed{background:#f3e4c8;color:#71500e}.calendar-event-status-ongoing{background:#dce8e5;color:#244e4c}.calendar-event-content h3{margin:0;color:var(--bct-primary);font-family:var(--bct-font-serif);font-size:clamp(1.35rem,1.6vw,1.8rem);font-weight:500;line-height:1.14;overflow-wrap:anywhere}.calendar-event-time{margin:0;color:var(--bct-text);font-size:var(--bct-text-sm);font-weight:700;line-height:1.5}.calendar-event-meta{display:grid;gap:2px}.calendar-event-meta p,.calendar-event-summary{margin:0;color:var(--bct-text-muted);font-size:var(--bct-text-sm);line-height:1.55}.calendar-event-summary{display:-webkit-box;overflow:hidden;margin-top:var(--bct-space-2);-webkit-box-orient:vertical;-webkit-line-clamp:2}@media(hover:hover){.calendar-event-card:hover .calendar-event-media img{transform:scale(1.025)}}@media(prefers-reduced-motion:reduce){.calendar-event-media img{transition:none}}
</style>
