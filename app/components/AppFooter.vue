<script setup lang="ts">
import { resolveTallyFormUrl } from '~~/lib/event-report'
const config = useRuntimeConfig()
const currentYear = new Date().getFullYear()
const submissionUrl = computed(() => resolveTallyFormUrl(config.public.eventSubmissionFormUrl).url)
const reportUrl = computed(() => resolveTallyFormUrl(config.public.eventReportFormUrl).url)
const instagramUrl = 'https://www.instagram.com/rocky_wide?igsh=MW1keTBld3ZpcXJpYg%3D%3D&utm_source=qr'
</script>
<template>
  <footer class="footer">
    <div class="footer-grid">
      <section><h2>{{ $t('site.title') }}</h2><p>{{ $t('footer.siteDescription') }}</p></section>
      <section><h2>{{ $t('footer.createdBy') }}</h2><p class="roles">{{ $t('footer.creatorRoles') }}</p><p>{{ $t('footer.creatorMessage') }}</p></section>
      <section><h2>{{ $t('footer.community') }}</h2><nav aria-label="Footer"><a v-if="submissionUrl" :href="submissionUrl" target="_blank" rel="noopener noreferrer">{{ $t('footer.submitEvent') }}</a><a v-if="reportUrl" :href="reportUrl" target="_blank" rel="noopener noreferrer">{{ $t('footer.reportEvent') }}</a><a :href="instagramUrl" target="_blank" rel="noopener noreferrer" :aria-label="$t('footer.instagramAria')">@rocky_wide</a><a href="mailto:rockywu971@gmail.com">{{ $t('footer.email') }}</a></nav></section>
    </div>
    <p class="copyright">{{ $t('footer.copyright', { year: currentYear }) }}</p>
  </footer>
</template>
<style scoped>
.footer{max-width:var(--bct-page-max);margin:0 auto;padding:44px var(--bct-page-gutter) 24px;border-top:1px solid var(--bct-panel-border)}.footer-grid{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:clamp(28px,5vw,64px)}h2{margin:0 0 14px;color:var(--bct-cream-strong);font-size:1.05rem}p{margin:0;color:rgba(248,237,210,.68);line-height:1.7}.roles{margin-bottom:10px;color:var(--bct-gold);font-weight:700}nav{display:grid;gap:5px}nav a{display:flex;align-items:center;min-height:44px;color:var(--bct-cream-strong);text-decoration:none}nav a:hover,nav a:focus-visible{color:var(--bct-gold)}nav a:focus-visible{outline:2px solid var(--bct-gold);outline-offset:2px}.copyright{margin-top:34px;padding-top:20px;border-top:1px solid rgba(200,155,70,.13);font-size:.85rem}@media(max-width:760px){.footer-grid{grid-template-columns:1fr}.footer{padding-top:36px}}
</style>
