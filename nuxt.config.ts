import { createHash } from 'node:crypto'
import { navbarData, seoData } from './data'
import { GTM_BOOTSTRAP, GTM_NOSCRIPT_HTML } from './data/gtm'

const isDev = process.env.NODE_ENV !== 'production'

// SHA-256 of the inline GTM bootstrap. Same constant feeds <script innerHTML>
// and the CSP `script-src` directive, so the hash always matches what ships.
const GTM_BOOTSTRAP_HASH = createHash('sha256').update(GTM_BOOTSTRAP).digest('base64')

// Strict-CSP per https://web.dev/strict-csp/. 'strict-dynamic' propagates trust
// from the hashed bootstrap to every script it loads (gtm.js → GA tags → …),
// so no host allowlist is required. 'unsafe-inline' + https: are silently
// ignored by browsers that understand 'strict-dynamic' (Chrome 52+, FF 52+,
// Safari 15.4+) and serve as fallbacks for old ones.
const CSP_HEADER = [
  `default-src 'self'`,
  `script-src 'sha256-${GTM_BOOTSTRAP_HASH}' 'strict-dynamic' 'unsafe-inline' https:`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https: wss:`,
  `frame-src https://www.googletagmanager.com`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ')

const BASE_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
}

// CSP would break Vite's inline HMR scripts in dev — apply only in builds.
const SECURITY_HEADERS = isDev
  ? BASE_SECURITY_HEADERS
  : { ...BASE_SECURITY_HEADERS, 'Content-Security-Policy': CSP_HEADER }

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
        '/rss.xml',
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
