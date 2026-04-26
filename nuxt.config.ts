import { navbarData, seoData } from './data'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
		'~/assets/css/tailwind.css',
		'@fontsource/space-grotesk/400.css',
		'@fontsource/space-grotesk/700.css'
	],

  components: {
    dirs: ['~/components'],
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width,initial-scale=1',
      title: navbarData.homeTitle,
      titleTemplate: `%s - ${navbarData.homeTitle}`,
      link: [],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in',
    },
  },

  image: {
    quality: 70,
    format: ['avif', 'webp'],
    screens: {
      sm: 320,
      md: 640,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  ogImage: {
    height: 630,
    renderer: 'satori',
  },

  site: {
    url: seoData.mySite,
    identity: {
      type: 'Person',
    },
    twitter: seoData.twitterHandle,
    autoLastmod: true,
  },

  socialShare: {
    styled: true,
    label: true,
    icon: true,
  },

  typescript: {
    strict: true,
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/rss.xml',
      ],
    },
  },

  // https://nuxtseo.com/docs/robots/guides/nuxt-config
  robots: {
    credits: true,
    groups: [
      {
        userAgent: '*',
        allow: '/',
        contentUsage: {
          'bots': 'y',
          'train-ai': 'n',
        },
        contentSignal: {
          'ai-train': 'no',
          'search': 'yes',
        },
      },
      {
        userAgent: ['Yandex'],
        cleanParam: ['p', '_ym_debug'],
      },
      {
        userAgent: ['GPTBot'],
        allow: ['/'],
      },
      {
        userAgent: ['OAI-SearchBot'],
        allow: ['/'],
      },
      {
        userAgent: ['ChatGPT-User'],
        allow: ['/'],
      },
    ],
    disallow: [
      '/projects/altcover/',
      '/author/xploitravy/',
      '/tag/customization/',
      '/projects',
      '/projects/',
    ],
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'light',
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  modules: [
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@nuxt/content',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@nuxtjs/fontaine',
    '@nuxtjs/color-mode',
    '@stefanobartoletti/nuxt-social-share',
  ],

  // gtm: {
  //   id: 'GTM-57T2XCRL',
  //   nonce: '3464ff42c5',
  // },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: 'dracula',
        },
      },
    },
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: true,
        mangle: true,
      },
    },
  },

  compatibilityDate: '2025-04-26',
})
