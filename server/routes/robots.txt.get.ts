import { resolveSiteUrl } from '~~/lib/event-calendar'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const siteUrl = resolveSiteUrl(config.public.siteUrl)
  const sitemap = siteUrl && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(siteUrl)
    ? `\nSitemap: ${siteUrl}/sitemap.xml`
    : ''

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /${sitemap}\n`
})
