import { navbarData, seoData } from './data'
import { GTM_BOOTSTRAP, GTM_NOSCRIPT_HTML } from './data/gtm'

// CSP is set per-route by `server/plugins/csp.ts`, which hashes every inline
// <script> in the actually-rendered HTML — including Nuxt's payload, JSON-LD,
// and unhead — and lists all those hashes in `script-src`. A single hash baked
// in nuxt.config can never cover Nuxt's payload, since that script differs per
// route.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/tailwind.css',
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
      link: [
        // Self-hosted Space Grotesk woff2 (latin subset) — preloaded so the
        // browser starts the font request while still parsing HTML, before
        // the @font-face in entry CSS would have triggered it.
        // crossorigin is required even for same-origin font requests.
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/space-grotesk-400.woff2',
          crossorigin: 'anonymous',
        },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/space-grotesk-700.woff2',
          crossorigin: 'anonymous',
        },
      ],
      script: [
        {
          innerHTML: GTM_BOOTSTRAP,
        },
      ],
      noscript: [
        {
          innerHTML: GTM_NOSCRIPT_HTML,
          tagPosition: 'bodyOpen',
        },
      ],
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
		// @ts-ignore
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

  runtimeConfig: {
    shortifyAdminEmail: '',
    public: {
      adminEmail: '',
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
      },
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
    },
    routeRules: {
      '/**': {
        headers: SECURITY_HEADERS,
      },
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
      '/shortify',
      '/s/',
      '/qr-code',
    ],
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'dark',
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

  compatibilityDate: '2026-05-11',
})
