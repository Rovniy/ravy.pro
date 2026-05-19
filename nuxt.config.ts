import { navbarData, seoData } from './data'
import { GTM_CONSENT_DEFAULTS, GTM_NOSCRIPT_HTML } from './data/gtm'

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
  // `same-origin-allow-popups` keeps cross-origin isolation but lets the
  // opener still see `window.closed` on its OAuth popup. Plain `same-origin`
  // breaks Firebase Auth's popup flow.
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
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
          innerHTML: GTM_CONSENT_DEFAULTS,
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
    // @ts-expect-error — nuxt-og-image type doesn't expose `height` here, but
    // the option is honoured at runtime by the satori renderer.
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
    openaiApiKey: '',
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
      failOnError: false,
      routes: [
        '/',
        '/blogs',
        '/categories',
        '/about',
        '/links',
        '/tools/qr-code-generator',
        '/tools/contract-red-flag-scanner',
      ],
    },
    routeRules: {
      '/**': {
        headers: SECURITY_HEADERS,
      },
      '/blogs/**': { prerender: true },
      '/categories/**': { prerender: true },
      '/docs/**': { prerender: true },
      // Auth-gated / dynamic routes stay SSR.
      '/shortify': { ssr: true, prerender: false },
      '/account': { ssr: true, prerender: false },
      '/qr-code': { redirect: '/tools/qr-code-generator' },
      '/tools/qr-code-generator': { ssr: true, prerender: true },
      '/tools/contract-red-flag-scanner': { ssr: true, prerender: true },
      '/s/**': { prerender: false },
      // Static asset cache hints. Firebase App Hosting CDN honours these
      // as-is; `s-maxage` lets the edge cache longer than the browser if we
      // ever want that, today both are the same. `immutable` tells browsers
      // never to revalidate — safe for content-addressed (`/_nuxt/`) and for
      // hand-managed image folders where filenames change when content
      // changes. `/blog-content` is shorter (30 days) because images there
      // are sometimes overwritten in place when posts get re-edited.
      '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/_ipx/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/fonts/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/blog-cover/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/blog-content/**': { headers: { 'Cache-Control': 'public, max-age=2592000' } },
      '/blog-opengraph/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/open_graph/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/misc/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/favicon.ico': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/apple-touch-icon.webp': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/android-chrome-192x192.webp': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/android-chrome-512x512.webp': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/og-image.webp': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/not-found.png': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
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
      '/account',
      '/shortify',
      '/s/',
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
      // `scan: true` catches every literal `<Icon name="..."/>`. Dynamic
      // names (e.g. social icons resolved at runtime via `item.icon`) are
      // listed explicitly so they're bundled too.
      scan: true,
      icons: [
        'fa:linkedin',
        'fa:telegram',
        'fa:twitter',
        'fa:instagram',
        'fa:github',
        'mdi:close',
        'mdi:menu',
        'mdi:weather-sunny',
        'mdi:weather-night',
      ],
      sizeLimitKb: 128,
    },
  },

  // Fallback metrics for the self-hosted Space Grotesk so the layout doesn't
  // shift when the web font swaps in. `fallbacks` lists the system fonts to
  // size-match against Space Grotesk's metrics from fontaine's registry.
  fontMetrics: {
    fonts: [
      { family: 'Space Grotesk', fallbacks: ['Inter', 'sans-serif'] },
    ],
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
