<script setup lang="ts">
import { resolveTallyFormUrl } from '~~/lib/event-report'
const config = useRuntimeConfig()
const currentYear = new Date().getFullYear()
const submissionUrl = computed(() => resolveTallyFormUrl(config.public.eventSubmissionFormUrl).url)
const reportUrl = computed(() => resolveTallyFormUrl(config.public.eventReportFormUrl).url)
const instagramUrl = 'https://www.instagram.com/rocky_wide?igsh=MW1keTBld3ZpcXJpYg%3D%3D&utm_source=qr'
</script>
<template>
  <footer class="footer bct-container">
    <div class="footer-grid">
      <section><h2>{{ $t('site.title') }}</h2><p>{{ $t('footer.siteDescription') }}</p></section>
      <section><h2>{{ $t('footer.createdBy') }}</h2><p class="roles">{{ $t('footer.creatorRoles') }}</p><p>{{ $t('footer.creatorMessage') }}</p></section>
      <section><h2>{{ $t('footer.community') }}</h2><nav aria-label="Footer"><a v-if="submissionUrl" :href="submissionUrl" target="_blank" rel="noopener noreferrer">{{ $t('footer.submitEvent') }}</a><a v-if="reportUrl" :href="reportUrl" target="_blank" rel="noopener noreferrer">{{ $t('footer.reportEvent') }}</a><a :href="instagramUrl" target="_blank" rel="noopener noreferrer" :aria-label="$t('footer.instagramAria')">@rocky_wide</a><a href="mailto:rockywu971@gmail.com">{{ $t('footer.email') }}</a></nav></section>
    </div>
    <div class="footer-meta">
      <p class="copyright">{{ $t('footer.copyright', { year: currentYear }) }}</p>
      <p class="photo-credit">
        {{ $t('footer.heroPhotoPrefix') }}
        <a href="https://www.pexels.com/zh-tw/photo/1717931/" target="_blank" rel="noopener noreferrer">Timo Volz／Pexels</a>
      </p>
    </div>
  </footer>
</template>
<style scoped>
.footer{padding-block:var(--bct-section-gap) var(--bct-space-8);border-top:1px solid var(--bct-panel-border)}.footer-grid{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:clamp(28px,5vw,72px)}h2{margin:0 0 var(--bct-space-3);color:var(--bct-primary);font-family:var(--bct-font-serif);font-size:var(--bct-text-lg);font-weight:500;line-height:1.25}p{margin:0;color:var(--bct-text-muted);line-height:1.75}.roles{margin-bottom:var(--bct-space-3);color:var(--bct-accent);font-size:var(--bct-text-sm);font-weight:700}nav{display:grid;gap:2px}nav a{display:flex;align-items:center;min-height:38px;color:var(--bct-primary);font-size:var(--bct-text-sm);text-decoration:none}nav a:hover{color:var(--bct-accent);text-decoration:underline}.footer-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:var(--bct-space-2) var(--bct-space-6);margin-top:clamp(32px,5vw,56px);padding-top:var(--bct-space-6);border-top:1px solid var(--bct-panel-border)}.copyright,.photo-credit{font-size:var(--bct-text-xs)}.photo-credit a{color:var(--bct-primary)}@media(max-width:760px){.footer-grid{grid-template-columns:1fr}.footer-meta{display:grid}}
</style>
