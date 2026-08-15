import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
// Explicit import: Nuxt 4's split tsconfig (project references) leaves the
// `defineNuxtConfig` global unresolved in some IDE type contexts.
import { defineNuxtConfig } from 'nuxt/config'
import { baseData, navbarData, seoData } from './data'
import { GTM_CONSENT_DEFAULTS, GTM_NOSCRIPT_HTML } from './data/gtm'

// pdfjs-dist (used by the contract scanner's PDF text extraction + OCR) lazily
// imports its worker via a runtime-computed path, so Nitro's tracer never bundles
// it — and the deployed server then crashes with "Cannot find module pdf.worker.mjs".
// Resolve the legacy worker at build time and force it into the trace.
const nodeRequire = createRequire(import.meta.url)
const PDF_WORKER_INCLUDES = ['pdfjs-dist/legacy/build/pdf.worker.mjs', 'pdfjs-dist/legacy/build/pdf.worker.min.mjs']
  .map((m) => {
    try {
      return nodeRequire.resolve(m)
    }
    catch {
      return ''
    }
  })
  .filter(Boolean)

// The four legal/terms documents under content/docs are the only prerendered
// pages that aren't named in `nitro.prerender.routes` by hand. They used to be
// found by the link crawler, which is now off (see the comment on `crawlLinks`),
// so they are enumerated here instead. @nuxt/content derives `/docs/<name>`
// from the filename, which is already the slug for every one of these.
const DOCS_ROUTES = readdirSync(fileURLToPath(new URL('./content/docs', import.meta.url)))
  .filter(name => name.endsWith('.md'))
  .map(name => `/docs/${name.replace(/\.md$/, '')}`)

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

// Cache policy for prerendered HTML: browsers always revalidate, the CDN
// keeps a copy for 10 minutes and refreshes it in the background for a day.
// Firebase App Hosting purges its CDN by cache-tag on rollout, so a deploy
// still invalidates these immediately.
const CONTENT_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
}

// Blog posts live in Firestore and are published from /studio without a
// rebuild, so their pages are rendered per request rather than prerendered.
// App Hosting has no on-demand CDN purge, which makes s-maxage the only lever
// on publish-to-visible latency — 60s is that latency, and the long
// stale-while-revalidate keeps the origin off the critical path meanwhile.
const LIVE_CONTENT_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
}

// Paths no crawler should follow: auth-gated, admin, per-user, or dead legacy
// URLs. Declared once because robots.txt groups do NOT inherit — a named
// user-agent group gets only its own rules, so this list has to be repeated into
// every group rather than sitting at the top level. It previously sat only at the
// top level, which merged it into `*` and left the named AI groups with nothing.
const PRIVATE_PATHS = [
  '/projects/',
  '/projects/altcover/',
  '/author/xploitravy/',
  '/tag/customization/',
  '/account',
  '/admin',
  '/shortify',
  '/studio',
  '/s/',
]

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
        // Space Mono drives the "data layer" (eyebrows, dates, tags, code) that
        // appears above the fold on most pages — preload the regular weight.
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/space-mono-400.woff2',
          crossorigin: 'anonymous',
        },
        // DNS warm-up for third parties that load late or conditionally: GTM is
        // deferred to idle, Firebase auth only calls Google when a returning user
        // has a session, and Stripe is reached via redirect (no Stripe.js here).
        // None are on the critical path, so dns-prefetch (DNS only) is the right
        // hint — a preconnect would burn a TLS handshake every page for
        // connections most visits never use.
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
        { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
        { rel: 'dns-prefetch', href: 'https://identitytoolkit.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://securetoken.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://apis.google.com' },
        { rel: 'dns-prefetch', href: 'https://accounts.google.com' },
        { rel: 'dns-prefetch', href: 'https://checkout.stripe.com' },
        // The feed existed but was undiscoverable — reachable only from one
        // footer anchor, absent from robots.txt, and with no rel="alternate"
        // anywhere. Feed readers and several AI crawlers look for exactly this.
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: `${seoData.author} — Blog`,
          href: `${seoData.mySite}/rss.xml`,
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
    // Post images live in Cloud Storage behind the `/media/blog/**` Nitro route,
    // so they are not files under `public/` — and IPX resolves a root-relative
    // id against the filesystem, which is why every `/_ipx/…/media/blog/…` URL
    // came back 404 (and then tripped CSP, because the `onerror` attribute
    // @nuxt/image puts on a server-rendered <img> only *runs* when the image
    // fails).
    //
    // IPX picks its storage by whether the resolved id has a protocol, and it
    // applies `alias` before that check. Aliasing the prefix to the absolute
    // site URL therefore routes these ids to IPX's HTTP storage, which fetches
    // them over HTTP like any remote image. `domains` is what creates that
    // storage and allow-lists the host.
    //
    // The browser-facing URL does not change: the alias is resolved server-side,
    // so markup and cached `/_ipx/**` paths stay exactly as they are.
    domains: [new URL(baseData.site.url).host],
    alias: {
      '/media/blog': `${baseData.site.url}/media/blog`,
    },
    screens: {
      sm: 320,
      md: 640,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  ogImage: {
    // Dimensions belong under `defaults` — a bare `height` is not a module
    // option, so it was silently ignored and every page advertised the module's
    // default `og:image:height = 600` while the Satori template
    // (components/OgImage/Blog.satori.vue) drew a 1200x630 canvas. Three
    // different numbers were in play; this is the one that matches the render.
    defaults: {
      width: 1200,
      height: 630,
    },
    renderer: 'satori',
  },

  site: {
    name: seoData.ogTitle,
    url: seoData.mySite,
    identity: {
      type: 'Person',
    },
    twitter: seoData.twitterHandle,
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
    // Steam AI Disclosure service — server-only secrets.
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePriceId: '',
    resendApiKey: '',
    resendSegmentId: '',
    steamAuditTokenSecret: '',
    // Contract Red-Flag Scanner — public paid tool (own Stripe Price + token secret).
    contractScanPriceId: '',
    contractScanTokenSecret: '',
    // Cloud Storage bucket holding blog post images uploaded from /studio.
    // Empty falls back to `<project>.firebasestorage.app`.
    firebaseStorageBucket: '',
    public: {
      adminEmail: '',
      steamAudit: {
        priceUsd: '',
        currency: 'usd',
      },
      contractScan: {
        priceUsd: '',
        currency: 'usd',
      },
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
      },
    },
  },

  nitro: {
    // Pre-compress everything in .output/public at build time so the origin can
    // serve .br/.gz instead of raw bytes. Measured before this was on: the CDN
    // returned no `content-encoding` at all, so the homepage shipped 845 kB with
    // encodedBodySize === decodedBodySize on every request. Brotli takes the
    // critical path (HTML + entry CSS + main chunk) from 592 kB to 132 kB.
    // Everything user-facing is prerendered, so this covers HTML and payloads
    // too, not just assets.
    compressPublicAssets: { gzip: true, brotli: true },

    // Force the pdfjs worker into the server trace so the deployed bundle can
    // resolve it at runtime (see PDF_WORKER_INCLUDES above).
    externals: {
      traceInclude: PDF_WORKER_INCLUDES,
    },
    prerender: {
      // Off deliberately. @nuxtjs/sitemap prerenders /sitemap.xml whenever the
      // crawler is enabled alongside any prerender route, and a static
      // sitemap.xml in .output/public shadows the runtime route — which would
      // freeze the post list at build time and quietly undo the whole point of
      // publishing from /studio. Every prerendered page is named below instead.
      crawlLinks: false,
      failOnError: false,
      routes: [
        '/about',
        '/contacts',
        '/links',
        '/services',
        '/services/fractional-cto',
        '/services/mentorship',
        '/tools',
        '/tools/qr-code-generator',
        '/tools/contract-red-flag-scanner',
        '/tools/credit-card-generator',
        '/tools/jwt-decoder',
        '/tools/image-converter',
        '/tools/steam-ai-disclosure',
        '/tools/xploit-translator',
        ...DOCS_ROUTES,
      ],
    },
    routeRules: {
      '/**': {
        headers: SECURITY_HEADERS,
      },
      // Prerendered HTML: let the CDN serve it (s-maxage) and refresh in the
      // background instead of forwarding every page view to the origin.
      // Browsers still revalidate (max-age=0) so a deploy shows up quickly.
      // The home page carries "Recent Posts", so it moves with the blog: a
      // prerendered copy would freeze the newest three at deploy time.
      '/': { ssr: true, prerender: false, headers: LIVE_CONTENT_CACHE_HEADERS },
      '/blogs': { ssr: true, prerender: false, headers: LIVE_CONTENT_CACHE_HEADERS },
      '/about': { headers: CONTENT_CACHE_HEADERS },
      '/links': { headers: CONTENT_CACHE_HEADERS },
      '/contacts': { headers: CONTENT_CACHE_HEADERS },
      // `/categories/**` does not match the bare index, so it needs its own
      // entry — without it this page went to origin on every hit.
      '/categories': { ssr: true, prerender: false, headers: LIVE_CONTENT_CACHE_HEADERS },
      '/services': { prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/services/fractional-cto': { prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/services/mentorship': { prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/api/services/**': { prerender: false },
      '/blogs/**': { ssr: true, prerender: false, headers: LIVE_CONTENT_CACHE_HEADERS },
      '/categories/**': { ssr: true, prerender: false, headers: LIVE_CONTENT_CACHE_HEADERS },
      // The blog API is the source those pages render from; prerendering it
      // would bake the post list into the build.
      '/api/blog/**': { prerender: false },
      // Image upload from the studio. The panel converts to WebP client-side
      // first, so this ceiling is for the pathological case.
      '/api/blog/admin/media': { prerender: false, maxBodySize: '10mb' },
      // Post images proxied out of Cloud Storage. Object names carry a nanoid
      // and are never reused, so the year-long immutable cache is accurate.
      '/media/**': { ssr: true, prerender: false, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/studio': { ssr: true, prerender: false },
      '/studio/**': { ssr: true, prerender: false },
      '/rss.xml': { prerender: false },
      '/docs/**': { prerender: true, headers: CONTENT_CACHE_HEADERS },
      // Auth-gated / dynamic routes stay SSR.
      '/shortify': { ssr: true, prerender: false },
      '/account': { ssr: true, prerender: false },
      '/scan-share/**': { ssr: true, prerender: false },
      // A bare `redirect: '<path>'` is served by Nitro as a *temporary* redirect
      // (307), which consolidates no link equity. The legacy-URL middleware sets
      // 301 for this path but never runs — the routeRule fires first, at the
      // server level — so the status code has to be explicit here.
      '/qr-code': { redirect: { to: '/tools/qr-code-generator', statusCode: 301 } },
      // Every tool page is prerendered, so each one also needs the content cache
      // headers; without them they ship no `Cache-Control`, the CDN refuses to
      // hold them, and every single view is forwarded to the origin.
      '/tools': { headers: CONTENT_CACHE_HEADERS },
      '/tools/qr-code-generator': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/tools/contract-red-flag-scanner': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/tools/contract-red-flag-scanner/result/**': { ssr: true, prerender: false },
      '/tools/credit-card-generator': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/tools/jwt-decoder': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/tools/image-converter': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/tools/steam-ai-disclosure': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      '/tools/steam-ai-disclosure/result/**': { ssr: true, prerender: false },
      '/tools/xploit-translator': { ssr: true, prerender: true, headers: CONTENT_CACHE_HEADERS },
      // The release lookup must stay live — prerendering it would freeze the
      // version the download card shows at build time.
      '/api/xploit-translator/**': { prerender: false },
      '/api/steam-audit/**': { prerender: false },
      '/s/**': { prerender: false },
      // Static asset cache hints. Firebase App Hosting CDN honours these
      // as-is; `s-maxage` lets the edge cache longer than the browser if we
      // ever want that, today both are the same. `immutable` tells browsers
      // never to revalidate — safe for content-addressed (`/_nuxt/`) and for
      // hand-managed image folders where filenames change when content
      // changes.
      '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/_ipx/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/fonts/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      // No longer asset folders: the blog images live in Cloud Storage and these
      // three prefixes are now 301s to `/media/blog/**`
      // (server/routes/blog-*/[...path].get.ts). A day, not a year — an
      // immutable redirect would be permanent in every browser cache.
      '/blog-cover/**': { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' } },
      '/blog-content/**': { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' } },
      '/blog-opengraph/**': { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' } },
      '/open_graph/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/misc/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      // Hand-managed image folders that were left out of the list above, so the
      // CDN had no policy for them at all. Same reasoning as `/blog-cover`.
      '/photos/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/instagram/**': { headers: { 'Cache-Control': 'public, max-age=2592000' } },
      // Machine-readable descriptors: short cache so an edit shows up the same
      // day. Never prerendered — both read the live post list from Firestore.
      '/llms.txt': { prerender: false, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } },
      '/llms-full.txt': { prerender: false, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } },
      '/favicon.ico': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/apple-touch-icon.webp': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/android-chrome-192x192.webp': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/android-chrome-512x512.webp': { headers: { 'Cache-Control': 'public, max-age=604800' } },
      '/og-image.webp': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/not-found.png': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
      '/api/contract-scanner/**': { maxBodySize: '15mb' }, // sane cap
    },
  },

  // https://nuxtseo.com/docs/robots/guides/nuxt-config
  robots: {
    credits: true,
    groups: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: ['Yandex'],
        cleanParam: ['p', '_ym_debug'],
        disallow: PRIVATE_PATHS,
      },
      // AI crawlers are welcome on the content, but they were previously the ONLY
      // agents allowed everywhere: robots.txt group matching is winner-take-all
      // on the most specific user-agent, so a named group inherits nothing from
      // `*`. GPTBot and friends had an empty disallow list and could crawl
      // /account, /admin, /shortify and /s/ while every other bot was blocked.
      // Each named group now carries the same private paths.
      //
      // Named rather than left to fall through `*`: the agents below are allowed
      // deliberately, and saying so in the file is the difference between a
      // decision and an accident. Anything not listed still matches `*`.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-User',
          'Claude-SearchBot',
          'anthropic-ai',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot-Extended',
          'Google-Extended',
          'meta-externalagent',
          'Amazonbot',
          'cohere-ai',
        ],
        allow: ['/'],
        disallow: PRIVATE_PATHS,
      },
    ],
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    // `autoLastmod` is a sitemap option, and it used to sit in the `site: {}`
    // block above where the module never reads it — so it was silently ignored
    // and 30 of 61 URLs shipped with no `lastmod` at all (every non-blog URL:
    // the static pages, all 11 categories, all 4 docs, all 7 tools, both
    // services). Blog posts carry a real `lastUpdated` from frontmatter via the
    // custom source; this fills in the rest from the build.
    autoLastmod: true,
    // Auto-discovery scrapes <img> from prerendered HTML and re-escapes the
    // already-escaped `&amp;` in /_ipx/ srcset URLs, producing broken
    // `&amp;amp;` image locs. Post images are provided explicitly by the
    // custom source above, so discovery adds nothing but the bug.
    discoverImages: false,
    // Gated / private / per-user routes must stay out of the sitemap even though
    // some of them are prerendered (the module auto-includes prerendered routes).
    exclude: [
      '/tools/contract-red-flag-scanner/result/**',
      '/shortify',
      '/studio',
      '/studio/**',
      '/account',
      '/scan-share/**',
      '/tools/steam-ai-disclosure/result/**',
    ],
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
        // Dynamically-bound icons (registry / tabs / code copy) the scanner can't see.
        'mdi:link-variant',
        'mdi:note-edit-outline',
        'mdi:shield-search',
        'mdi:account-outline',
        'mdi:steam',
        'mdi:account-key-outline',
        'mdi:content-copy',
        'mdi:history',
        // Auth control + /account sign-out (the latter is a ternary binding).
        'mdi:login',
        'mdi:logout',
        // Home "Tools" cards (per-tool icons bound dynamically).
        'mdi:qrcode',
        'mdi:credit-card-outline',
        'mdi:shield-key-outline',
        'mdi:image-sync-outline',
        'mdi:translate',
        // Services (/services, /services/mentorship) — bound dynamically via
        // OFFERINGS[].icon; the rest are literal but sit outside the scanner's
        // reach in the inquiry form's conditional branches.
        'mdi:account-star-outline',
        'mdi:account-tie-outline',
        'mdi:compass-outline',
        'mdi:account-group-outline',
        'mdi:arrow-down',
        'mdi:check',
        'mdi:check-circle-outline',
        'mdi:send-outline',
        'mdi:open-in-new',
        // Contacts page (/contacts) — icons bound dynamically via contactLinks.
        'mdi:mail-outline',
        'bi:whatsapp',
        'simple-icons:zalo',
        'bi:wechat',
        'bi:discord',
        'fa:steam',
        'fa:youtube-play',
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
      { family: 'Space Mono', fallbacks: ['ui-monospace', 'monospace'] },
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
