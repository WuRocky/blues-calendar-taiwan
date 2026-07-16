// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    notionToken: process.env.NOTION_TOKEN,
    notionEventsDatabaseId: process.env.NOTION_EVENTS_DATABASE_ID,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      tallyFormUrl: process.env.NUXT_PUBLIC_TALLY_FORM_URL || ''
    }
  },
  i18n: {
    defaultLocale: 'zh-TW',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    detectBrowserLanguage: false,
    locales: [
      { code: 'zh-TW', name: '繁中', language: 'zh-TW', file: 'zh-TW.json' },
      { code: 'en', name: 'EN', language: 'en-US', file: 'en.json' },
      { code: 'ja', name: '日本語', language: 'ja-JP', file: 'ja.json' },
      { code: 'ko', name: '한국어', language: 'ko-KR', file: 'ko.json' }
    ]
  }
})
