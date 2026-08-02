import assert from 'node:assert/strict'
import fs from 'node:fs'

const hero = fs.readFileSync(new URL('../app/components/HomeHero.vue', import.meta.url), 'utf8')
const locales = ['zh-TW', 'en', 'ja', 'ko'].map(locale =>
  JSON.parse(fs.readFileSync(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
)

assert.match(hero, /const heroImageSrc = '\/images\/home-hero-taipei\.webp'/)
assert.match(hero, /:src="heroImageSrc"/)
assert.match(hero, /v-if="!imageFailed"/)
assert.match(hero, /@error="imageFailed = true"/)
assert.match(hero, /hero-media-fallback/)
assert.match(hero, /loading="eager"/)
assert.match(hero, /fetchpriority="high"/)
assert.match(hero, /width="2000"/)
assert.match(hero, /height="3000"/)
assert.match(hero, /:alt="\$t\('home\.heroImageAlt'\)"/)
assert.match(hero, /<NuxtLink class="hero-link" :to="localePath\('calendar'\)"/)
assert.match(hero, /@media\(max-width:760px\)/)
assert.match(hero, /\.hero-copy\{position:absolute/)
assert.match(hero, /background:linear-gradient\(135deg,var\(--bct-bg\),var\(--bct-bg-soft\)\)/)
assert.match(hero, /min-height:clamp\(340px,34vw,430px\)/)
assert.match(hero, /object-fit:cover;object-position:center 47%/)
assert.match(hero, /linear-gradient\(270deg,rgba\(7,17,31,\.84\)/)
assert.doesNotMatch(hero, /hero-copy\{[^}]*background:/)
assert.doesNotMatch(hero, /hero-copy\{[^}]*border:/)
assert.match(hero, /\.hero-link\{[^}]*text-decoration-line:underline/)
assert.doesNotMatch(hero, /--color-/)
assert.doesNotMatch(hero, /carousel|slider|autoplay|hero-rhythm|hero-ring/i)
assert.ok(locales.every(messages => messages.home.heroImageAlt))
assert.ok(locales.every(messages => messages.footer.heroPhotoPrefix))

const footer = fs.readFileSync(new URL('../app/components/AppFooter.vue', import.meta.url), 'utf8')
assert.match(footer, /https:\/\/www\.pexels\.com\/zh-tw\/photo\/1717931\//)
assert.match(footer, /target="_blank" rel="noopener noreferrer"/)
assert.match(footer, /Timo Volz／Pexels/)

console.log('Home Hero verification passed.')
