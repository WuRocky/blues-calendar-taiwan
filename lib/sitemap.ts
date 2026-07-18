import { buildLocaleAlternates, buildLocalizedEventUrl, buildLocalizedUrl, isValidPublicSitemapEvent, SEO_LOCALES } from '~~/lib/event-seo'
import type { EventItem } from '~~/types/event'

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '\'': '&apos;',
    '"': '&quot;'
  })[character] || character)
}

export function buildSitemapXml(siteUrl: string, events: readonly EventItem[]) {
  const staticPaths = ['/', '/calendar']
  const urls = [
    ...staticPaths.flatMap(path => SEO_LOCALES.flatMap(locale => {
      const loc = buildLocalizedUrl(siteUrl, locale, path)
      return loc ? [{ loc, alternates: buildLocaleAlternates(siteUrl, path), priority: path === '/' ? '1.0' : '0.8' }] : []
    })),
    ...events.filter(isValidPublicSitemapEvent).flatMap(event =>
      SEO_LOCALES.flatMap(locale => {
        const loc = buildLocalizedEventUrl(siteUrl, locale, event.slug)
        return loc ? [{ loc, alternates: buildLocaleAlternates(siteUrl, `/events/${event.slug}`), priority: '0.7' }] : []
      })
    )
  ]

  const body = urls.map(({ loc, alternates, priority }) => [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    ...alternates.map(alternate => `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`),
    `    <changefreq>weekly</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n')).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`
}
