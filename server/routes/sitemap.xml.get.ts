import { resolveSiteUrl } from '~~/lib/event-calendar'
import { getSitemapEvents } from '~~/lib/notion'
import { buildSitemapXml } from '~~/lib/sitemap'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = resolveSiteUrl(config.public.siteUrl)

  if (!siteUrl || /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(siteUrl)) {
    setResponseStatus(event, 404)
    return ''
  }

  const events = await getSitemapEvents()
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return buildSitemapXml(siteUrl, events)
})
