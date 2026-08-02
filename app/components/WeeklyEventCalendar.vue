<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { buildHomeWeek, getDefaultHomeDayKey, getTaipeiWeek } from '~~/lib/home-events'
import { getEventDisplayStatus } from '~~/lib/event-status'
import { TAIPEI_TIMEZONE } from '~~/lib/event-time'
import type { EventItem } from '~~/types/event'

dayjs.extend(utc); dayjs.extend(timezone)
const props = defineProps<{ events: EventItem[], loading: boolean, error: boolean }>()
const emit = defineEmits<{ refresh: [] }>()
const localePath = useLocalePath()
const { locale, t } = useI18n()
const weekOffset = ref(0)
const taipeiNow = () => dayjs().tz(TAIPEI_TIMEZONE)
const displayedWeek = computed(() => getTaipeiWeek(taipeiNow().add(weekOffset.value, 'week')))
const displayedWeekStart = computed(() => displayedWeek.value.start)
const displayedWeekEnd = computed(() => displayedWeek.value.end)
const displayedWeekDays = computed(() => buildHomeWeek(props.events, displayedWeekStart.value))
const days = displayedWeekDays
const todayKey = taipeiNow().format('YYYY-MM-DD')
const selectedKey = ref('')
watch(displayedWeekDays, (value) => {
  selectedKey.value = weekOffset.value === 0
    ? getDefaultHomeDayKey(value)
    : (value[0]?.key ?? '')
}, { immediate: true })
const previousWeek = () => { weekOffset.value -= 1 }
const nextWeek = () => { weekOffset.value += 1 }
const returnToCurrentWeek = () => { weekOffset.value = 0 }
const selectedDay = computed(() => days.value.find(day => day.key === selectedKey.value) ?? days.value[0])
const dateLocale = computed(() => locale.value === 'zh-TW' ? 'zh-TW' : locale.value)
const range = computed(() => {
  const start = displayedWeekStart.value
  const end = displayedWeekEnd.value
  return start.year() === end.year()
    ? `${start.format('M/D')}－${end.format('M/D')}`
    : `${start.format('YYYY/M/D')}－${end.format('YYYY/M/D')}`
})
const rangeLabel = computed(() => weekOffset.value === 0
  ? t('home.weeklyCalendar.currentWeekRange', { range: range.value })
  : range.value)
const weekday = (date: string, narrow = false) => new Intl.DateTimeFormat(dateLocale.value, { weekday: narrow ? 'narrow' : 'short', timeZone: TAIPEI_TIMEZONE }).format(new Date(date))
const dayNumber = (date: string) => dayjs(date).tz(TAIPEI_TIMEZONE).format('D')
const fullDay = (date: string) => new Intl.DateTimeFormat(dateLocale.value, { weekday: 'long', month: 'long', day: 'numeric', timeZone: TAIPEI_TIMEZONE }).format(new Date(date))
const time = (event: EventItem) => {
  const start = dayjs.utc(event.startTime!).tz(TAIPEI_TIMEZONE)
  const end = dayjs.utc(event.endTime ?? event.startTime!).tz(TAIPEI_TIMEZONE)
  return start.isSame(end, 'day') ? `${start.format('HH:mm')}–${end.format('HH:mm')}` : start.format('HH:mm')
}
const typeKey = (type: string) => type === 'class' ? 'class' : type === 'workshop' ? 'workshop' : ['social', 'open-floor'].includes(type) ? 'social' : 'event'
const statusKey = (event: EventItem) => {
  if (event.eventStatus === 'cancelled' || event.eventStatus === 'postponed') return event.eventStatus
  return event.timeStatus === 'ended' ? 'ended' : getEventDisplayStatus(event)
}
const isEnded = (event: EventItem) => event.eventStatus === 'scheduled' && event.timeStatus === 'ended'
</script>

<template>
  <section class="weekly" aria-labelledby="weekly-title">
    <header class="weekly-head"><h2 id="weekly-title">{{ t('home.weeklyCalendar.title') }}</h2></header>
    <nav class="week-navigation" :aria-label="t('home.weeklyCalendar.weekNavigation')">
      <button type="button" :aria-label="t('home.weeklyCalendar.previousWeek')" @click="previousWeek">← <span>{{ t('home.weeklyCalendar.previousWeek') }}</span></button>
      <div class="displayed-range"><strong>{{ rangeLabel }}</strong></div>
      <button type="button" :aria-label="t('home.weeklyCalendar.nextWeek')" @click="nextWeek"><span>{{ t('home.weeklyCalendar.nextWeek') }}</span> →</button>
      <div class="week-actions">
        <button v-if="weekOffset !== 0" type="button" class="return-current" @click="returnToCurrentWeek">{{ t('home.weeklyCalendar.returnToCurrentWeek') }}</button>
        <NuxtLink :to="localePath('calendar')">{{ t('home.weeklyCalendar.viewAll') }} →</NuxtLink>
      </div>
    </nav>
    <div v-if="loading" class="calendar-skeleton" aria-hidden="true"><span v-for="n in 7" :key="n" /></div>
    <div v-else-if="error" class="calendar-state"><p>{{ t('home.weeklyCalendar.loadError') }}</p><button type="button" @click="emit('refresh')">{{ t('home.weeklyCalendar.retry') }}</button></div>
    <div v-else>
      <div class="desktop-calendar">
        <article v-for="day in days" :key="day.key" class="day-column" :class="{ today: day.key === todayKey }">
          <header><span>{{ weekday(day.date) }}</span><strong>{{ dayjs(day.date).tz(TAIPEI_TIMEZONE).format('M/D') }}</strong><small v-if="day.key === todayKey">{{ t('home.weeklyCalendar.today') }}</small></header>
          <NuxtLink v-for="event in day.events.slice(0, 3)" :key="event.id" class="calendar-event" :class="[`type-${typeKey(event.eventType)}`, { 'is-ended': isEnded(event) }]" :to="localePath({ name: 'events-slug', params: { slug: event.slug } })">
            <time>{{ time(event) }}</time><strong>{{ event.name }}</strong><span>{{ t(`filters.${typeKey(event.eventType)}`) }} · {{ event.city || t('common.tbdCity') }}</span><em v-if="statusKey(event)">{{ t(`eventStatus.${statusKey(event)}`) }}</em>
          </NuxtLink>
          <NuxtLink v-if="day.events.length > 3" class="more" :to="localePath('calendar')">{{ t('home.weeklyCalendar.moreEvents', { count: day.events.length - 3 }) }}</NuxtLink>
        </article>
      </div>
      <div class="mobile-calendar">
        <div class="day-selector" role="group" :aria-label="t('home.weeklyCalendar.title')"><button v-for="day in days" :key="day.key" type="button" :class="{ selected: day.key === selectedKey, today: day.key === todayKey }" :aria-pressed="day.key === selectedKey" @click="selectedKey = day.key"><span>{{ weekday(day.date, true) }}</span><strong>{{ dayNumber(day.date) }}</strong><small v-if="day.key === todayKey">•</small></button></div>
        <div v-if="selectedDay" class="mobile-events"><h3>{{ fullDay(selectedDay.date) }}</h3><NuxtLink v-for="event in selectedDay.events" :key="event.id" class="calendar-event" :class="[`type-${typeKey(event.eventType)}`, { 'is-ended': isEnded(event) }]" :to="localePath({ name: 'events-slug', params: { slug: event.slug } })"><time>{{ time(event) }}</time><strong>{{ event.name }}</strong><span>{{ t(`filters.${typeKey(event.eventType)}`) }} · {{ event.city || t('common.tbdCity') }}</span><em v-if="statusKey(event)">{{ t(`eventStatus.${statusKey(event)}`) }}</em></NuxtLink></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.calendar-event.is-ended{border-color:rgba(248,237,210,.07);background:rgba(255,255,255,.02);opacity:.72}.calendar-event.is-ended:hover,.calendar-event.is-ended:focus-visible{opacity:.9}
.week-navigation{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px}.week-navigation button{min-height:42px;border:1px solid var(--bct-panel-border);border-radius:999px;padding:0 16px;background:rgba(255,255,255,.035);color:inherit;font-weight:700;cursor:pointer}.week-navigation button:hover{border-color:var(--bct-gold)}.displayed-range{display:grid;justify-items:center;gap:3px;color:var(--bct-gold)}.displayed-range small{color:rgba(248,237,210,.66)}.return-current{grid-column:1/-1;justify-self:center}
.weekly{display:grid;gap:20px}.weekly-head{display:flex;justify-content:space-between;align-items:end;gap:16px}.weekly-head h2{margin:0;font:700 clamp(1.8rem,3vw,2.5rem)/1.1 Georgia,serif}.weekly-head p{margin:7px 0 0;color:var(--bct-gold);font-weight:700}.weekly-head a,.more,.week-empty a,.day-empty a{color:var(--bct-gold);font-weight:700}.desktop-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid var(--bct-panel-border);border-radius:var(--bct-radius-lg);overflow:hidden;background:rgba(7,15,28,.72)}.day-column{min-width:0;min-height:290px;padding:12px 9px;border-right:1px solid rgba(200,155,70,.15)}.day-column:last-child{border:0}.day-column.today{background:rgba(200,155,70,.08)}.day-column>header{display:grid;gap:3px;padding:0 4px 10px}.day-column header span,.day-column header small{color:rgba(248,237,210,.66);font-size:.78rem}.day-column header strong{font-size:1.05rem}.calendar-event{position:relative;display:grid;gap:5px;margin:0 0 9px;padding:10px 8px 10px 12px;border:1px solid rgba(248,237,210,.1);border-radius:10px;background:rgba(255,255,255,.035);color:inherit;text-decoration:none;overflow:hidden}.calendar-event:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:var(--event-accent)}.type-social{--event-accent:var(--bct-wine)}.type-class{--event-accent:#315c91}.type-workshop{--event-accent:var(--bct-gold)}.type-event{--event-accent:var(--bct-copper)}.calendar-event time{color:var(--bct-gold);font-size:.76rem;font-weight:800}.calendar-event strong{display:-webkit-box;overflow:hidden;font-size:.88rem;line-height:1.35;-webkit-line-clamp:2;-webkit-box-orient:vertical}.calendar-event span{color:rgba(248,237,210,.65);font-size:.72rem}.calendar-event em{color:#f4c7b8;font-size:.72rem;font-style:normal;font-weight:800}.calendar-event:focus-visible,.day-selector button:focus-visible{outline:2px solid var(--bct-gold);outline-offset:2px}.more{display:block;padding:5px;font-size:.76rem}.mobile-calendar{display:none}.calendar-state,.week-empty,.day-empty{padding:20px;border:1px dashed var(--bct-panel-border);border-radius:var(--bct-radius-md);color:rgba(248,237,210,.75)}.calendar-state button{min-height:44px;border:0;border-radius:999px;padding:0 18px;background:var(--bct-gold);font-weight:700}.calendar-skeleton{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;overflow:hidden;border-radius:var(--bct-radius-lg)}.calendar-skeleton span{height:280px;background:linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,.08),rgba(255,255,255,.03));background-size:200% 100%;animation:pulse 1.4s infinite}@keyframes pulse{to{background-position:-200% 0}}
@media(max-width:900px){.desktop-calendar{display:none}.mobile-calendar{display:grid;gap:18px}.day-selector{display:flex;gap:8px;max-width:100%;overflow-x:auto;padding:2px 2px 8px}.day-selector button{position:relative;flex:1 0 58px;min-height:56px;border:1px solid var(--bct-panel-border);border-radius:13px;background:rgba(255,255,255,.035);color:inherit}.day-selector button span,.day-selector button strong{display:block}.day-selector button.selected{background:var(--bct-gold);color:var(--bct-text-dark)}.day-selector button.today:not(.selected){border-color:var(--bct-gold)}.day-selector small{position:absolute;right:7px;top:3px}.mobile-events{display:grid;gap:10px}.mobile-events h3{margin:0 0 4px;font-size:1.05rem}.calendar-event{padding:13px 13px 13px 17px}.calendar-skeleton{grid-template-columns:repeat(7,58px);overflow:hidden}.calendar-skeleton span{height:56px}.weekly-head{align-items:start}.weekly-head>a{font-size:.85rem;text-align:right}}
@media(max-width:900px){.week-navigation{grid-template-columns:52px 1fr 52px}.week-navigation>button:not(.return-current){padding:0}.week-navigation>button:not(.return-current) span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.week-navigation .return-current{width:auto;padding:0 16px}}
.week-navigation{min-height:96px}.week-navigation button:hover:not(:disabled){border-color:var(--bct-gold)}.week-navigation button:disabled{cursor:default;opacity:.45}.week-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:12px;min-height:42px}.week-actions a{display:inline-flex;align-items:center;min-height:42px;padding:0 16px;border-radius:999px;color:var(--bct-gold);font-weight:700}.week-navigation button:focus-visible,.week-actions a:focus-visible{outline:2px solid var(--bct-gold);outline-offset:2px}.weekly-head{min-height:44px}.desktop-calendar{min-height:290px}.calendar-skeleton{min-height:290px}
@media(max-width:900px){.week-actions{gap:4px}.week-actions button,.week-actions a{padding:0 10px;font-size:.82rem}.mobile-events{min-height:230px;align-content:start}.calendar-skeleton{min-height:304px}}
</style>
