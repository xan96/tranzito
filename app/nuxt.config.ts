export default defineNuxtConfig({
  extends: [
    '../layers/base',
    '../layers/broker',
    '../layers/investor',
    '../layers/admin',
  ],

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },

  // Hybrid rendering
  routeRules: {
    // Public pages - prerender (static)
    '/': { prerender: true },
    '/login': { prerender: true },
    '/register': { prerender: true },
    '/register/success': { prerender: true },

    // Private cabinets - SPA mode (no SSR)
    '/broker/**': { ssr: false },
    '/investor/**': { ssr: false },
    '/admin/**': { ssr: false },
  },

  compatibilityDate: '2024-09-01',

  app: {
    head: {
      title: 'Tranzitum',
      meta: [
        { name: 'description', content: 'Платформа транзитного финансирования' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' },
      ],
    },
  },
})
