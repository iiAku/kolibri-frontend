import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineNuxtConfig({
  compatibilityDate: '2025-06-01',
  ssr: false,

  css: [
    '~/assets/sass/app.scss',
  ],

  modules: [
    '@pinia/nuxt',
  ],

  vite: {
    plugins: [
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'util', 'process'],
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "~/assets/sass/globals";',
          silenceDeprecations: ['legacy-js-api', 'import', 'color-functions', 'global-builtin', 'if-function'],
        },
      },
    },
  },

  app: {
    baseURL: process.env.IPFS_BUILD ? './' : '/',
    head: {
      title: 'Kolibri',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Kolibri is an algorithmic stablecoin built on the Tezos blockchain by Hover Labs.' },
        { property: 'og:title', content: 'Kolibri' },
        { property: 'og:description', content: 'Kolibri is an algorithmic stablecoin built on the Tezos blockchain by Hover Labs.' },
        { property: 'og:image', content: 'https://kolibri.finance/favicon.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700&display=fallback',
        },
      ],
    },
  },

  nitro: {
    preset: 'static',
  },

  router: {
    options: {
      hashMode: !!process.env.IPFS_BUILD,
    },
  },
})
