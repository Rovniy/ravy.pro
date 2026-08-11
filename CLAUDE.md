# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run tina          # Dev server with TinaCMS visual editor (docs/pages only — posts live at /studio)
npm run dev           # Dev server without TinaCMS
npm run build         # Production build
npm run generate      # Static site generation
npm run start         # Run the built server locally (node .output/server/index.mjs)
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix ESLint issues
npm test              # Run vitest once
npm run test:watch    # Vitest watch mode
npm run test:coverage # Vitest with coverage report
```

## Architecture

**Nuxt 4** personal blog and portfolio site for Andrei Rovniy. Uses **@nuxt/content v3** for markdown-based content and **TinaCMS** as the visual CMS layer on top.

### Content Pipeline

There are **two** content sources, and which one applies depends on the kind of content:

| Content | Source | Edited via |
|---|---|---|
| **Blog posts** | Firestore (`blog_posts` + `blog_index`) | `/studio` — live, no rebuild |
| Docs, pages, instagram | markdown in `/content/` via @nuxt/content | TinaCMS (`npm run tina` → `/admin/`) or the files |

Blog tags are an enum: `BlogPostTag` in `data/index.ts`. Add a tag there (and a display name in `categoryNames`) before using it.

#### Blog posts (Firestore)

Posts moved out of `content/blogs/*.md` so they can be written and published from a phone. The whole read path:

- **Data model.** `blog_posts/{slug}` holds one post including its raw `markdown`; `blog_index/current` is a single document holding every post's metadata *without* the body. The index exists purely for read cost — the list is needed by `/blogs`, every category page, the home page, RSS, the sitemap and both llms routes, and reading 30+ documents per cache miss would burn the Firestore free-tier quota. `server/utils/blog-store.ts` memoises it for 60s and **serves the stale copy if Firestore fails**, rather than 500ing the blog. `rebuildIndex()` (also exposed as `POST /api/blog/admin/reindex` and a button in the studio) repairs any drift.
- **`path` is stored, never re-derived.** The migrated posts keep the exact URLs @nuxt/content generated, and `normalizeRecord` copies `path` from the existing record on every edit, so changing a slug cannot repoint a published post.
- **Rendering.** `server/utils/blog-render.ts` parses markdown at request time with `parseMarkdown` from `@nuxtjs/mdc/runtime` (installed as a dependency of @nuxt/content, whose module generates the `#mdc-imports` plugin set — so remark-mdc, remark-emoji and the lazy Shiki/dracula highlighter all apply exactly as they did at build time). The result feeds the existing `<ContentRenderer>` unchanged: it only converts `value.body` from minimark when `body.type === 'minimark'` and otherwise passes the tree straight to `MDCRenderer`. The toc is nested onto `body` because `components/blog/toc.vue` reads `articles.body.toc.links`.
- **Pure helpers** live in `utils/blog-post.ts` (slug rules, `normalizeRecord`, `recordFromDoc`, `toCardData`) and `utils/blog-embeds.ts`, both unit-tested. `toCardData` is the single copy of the card defaulting the three list views used to duplicate.
- **Embed rules are enforced at save time.** `findEmbedProblems()` rejects an `<iframe>` with width/height attributes, a fixed inline width, or no `title` — the same invariants a repo-scanning test used to enforce, moved to where posts are now authored.
- **Routes.** Public: `GET /api/blog/posts` (published metadata) and `GET /api/blog/post/[slug]` (metadata + rendered body; drafts 404, raw markdown never sent). Admin, all behind `requireToolAccess(event, 'studio')`: `admin/posts`, `admin/post/[slug]`, `admin/post` (PUT), `admin/post/[slug]` (DELETE), `admin/preview`, `admin/reindex`, `admin/media`, and the dev-only `admin/migrate`.

**Consequence for prerendering.** `/`, `/blogs`, `/blogs/**`, `/categories`, `/categories/**` are SSR with `s-maxage=60, stale-while-revalidate=600`, since App Hosting has no on-demand CDN purge — 60s *is* the publish-to-visible latency. `nitro.prerender.crawlLinks` is **off**: @nuxtjs/sitemap prerenders `/sitemap.xml` whenever the crawler runs alongside any prerender route, and a static `sitemap.xml` in `.output/public` shadows the runtime route and would freeze the post list at build time. Every prerendered page is therefore named in `nitro.prerender.routes`, with the docs enumerated from `content/docs` by `DOCS_ROUTES`. `/`, `/blogs` and `/categories` are listed explicitly in `server/api/__sitemap__/urls.ts` because they used to reach the sitemap through prerender auto-discovery.

#### The studio (`/studio`)

Gated exactly like `/shortify`: the `studio` key in `GATED_TOOLS` (`data/services.ts`) puts it in the Tools dropdown for grantees and in `/account` → Access, and every route re-checks server-side. `<AccountGrantedTools>` also links it (and every other granted tool) at the top of `/account`, driven by `accessibleServices` — so granting a new gated tool needs no edit there either. `components/studio/Gate.vue` renders the sign-in / access-denied states, and only mounts its slot when access is granted, so the editor never fires a request it would get a 403 for.

The editor is a markdown textarea with a live preview that goes through the **same** `renderMarkdown` and the same `prose` classes as the real post page. Images are converted to WebP and downscaled to 1600px **in the browser** before upload (`useBlogStudio` → `toUploadBlob`), then POSTed to `/api/blog/admin/media`, which writes to Cloud Storage at `blog/<slug>/<nanoid>.<ext>`.

**Images are served same-origin** by `server/routes/media/blog/[...path].get.ts` at `/media/blog/**`, not from `storage.googleapis.com`. That is deliberate: it needs no extra host in the CSP (`server/plugins/csp.ts`), lets satori fetch them while rendering OG cards, and leaves `storage.rules` deny-all like `firestore.rules`.

**`/_ipx/` needs `image.alias` to reach them.** IPX picks filesystem or HTTP storage by whether the resolved id has a protocol, and a root-relative id always goes to the filesystem — where these images do not exist. `nuxt.config.ts` therefore sets `image.alias['/media/blog']` to the absolute site URL and lists the host in `image.domains` (which is what creates the HTTP storage). The alias is resolved server-side, so the browser-facing `/_ipx/…` URL is unchanged. Without it every optimized post image 404s silently in production — and each failure then trips CSP, because the `onerror` attribute @nuxt/image puts on a server-rendered `<img>` only *executes* when the image fails. `tests/unit/image-alias.test.ts` guards the invariant. Object names are never reused — a nanoid for a new upload, a content hash for an imported file — so the year-long `immutable` cache header is accurate. The bucket comes from `runtimeConfig.firebaseStorageBucket` (`NUXT_FIREBASE_STORAGE_BUCKET` in `apphosting.yaml`).

Uploads accept images only (`ALLOWED_IMAGE_TYPES`). The serving map is wider (`svg`, `pdf`) purely because the imported archive carried a Google Play badge and a presentation; both are sent under `Content-Security-Policy: default-src 'none'; sandbox` plus `nosniff`, since a same-origin SVG is otherwise a script.

**Nothing image-related lives in `/public` any more.** `public/blog-cover`, `public/blog-content` and `public/blog-opengraph` were imported into Storage by the dev-only `POST /api/blog/admin/migrate-media` (a button in the studio), which uploads every file, rewrites `image` / `ogImage` / the markdown, and records each old URL in `blog_media/redirects`. Those three prefixes are now Nitro routes (`server/routes/blog-*/[...path].get.ts`) that **301 to `/media/blog/**`** — the old paths are indexed by Google Images, appear as `<image:loc>` in the sitemap, and one of them (a presentation PDF) is linked from `/links`, so dropping them would have 404'd all of that. The importer is idempotent: a path already in the map is skipped, and object names are content-hashed.

The import deliberately does **not** bump `lastUpdated` — a URL rewrite is not a revision, and 30 posts all claiming to be edited the same minute is a bad signal. That is also why `renderMarkdown` caches on the markdown string itself rather than on `slug + lastUpdated`: a metadata-preserving edit would leave such a key identical while the body changed underneath it.

### Data & Configuration

Site-wide metadata (nav links, social networks, SEO defaults) lives in `/data/index.ts` — not in nuxt.config.ts or environment variables. This is the single source of truth for site identity.

### Routing & Pages

Standard Nuxt file-based routing in `/pages/`. Key non-obvious routes:
- `/rss.xml` — generated by Nitro server route at `/server/routes/rss.xml.ts`; post bodies are rendered from markdown by `renderMarkdown` and serialised by `mdcToHtml` (`server/utils/mdc-html.ts`)
- `/media/blog/**` — post images proxied out of Cloud Storage (see Content Pipeline)
- `/studio`, `/studio/[slug]` — the blog panel; gated, `noindex`, excluded from the sitemap and listed in `PRIVATE_PATHS`
- Legacy URL redirects handled in `/middleware/old-url-redirects.global.ts`

### Tools

Interactive client-side utilities live in `/pages/tools/`. They are registered in `/data/index.ts` as `publicServices`; access-gated tools live separately in `/data/services.ts` as `GATED_TOOLS`. Tools emit structured data via the `useToolPageSchema()` composable (`/composables/useStructuredData.ts`), which sets SEO meta, JSON-LD `SoftwareApplication`/FAQ schema, and the OG image. One entry (XPLOIT Translator) is a *documentation/download* page for an external desktop app rather than a browser utility — `useToolPageSchema()` takes `appOperatingSystem` / `appDownloadUrl` / `appSoftwareVersion` for that case (the last accepts a ref or getter, since the app node is rebuilt reactively).

- **QR Code Generator** (`/tools/qr-code-generator`, public): builds styled QR codes with `qr-code-styling`. Customizable size, margin, dot/corner styles, colors, and a center logo image; renders to canvas and downloads as PNG. Prefills from a `?data=` query param.
- **Credit Card Generator** (`/tools/credit-card-generator`, public): generates Luhn-valid **test** card numbers and validates/detects brands. Core logic is in `/utils/credit-card.ts` (`generateCard`, `validateCardNumber`, `getBrandSpec`, `BRAND_SPECS`), unit-tested in `/tests/unit/credit-card.util.test.ts`. Supports Visa, MasterCard, Amex, Discover, JCB, Diners Club, UnionPay, plus optional custom BIN prefixes. Numbers are fake test data — not real cards.
- **JWT Decoder** (`/tools/jwt-decoder`, public): decodes and verifies JSON Web Tokens fully client-side. Pure decode/claim-interpretation logic is in `/utils/jwt.ts` (`decodeJwt`, `getAlgInfo`, `getTokenStatus`, `getClaimTime`, `interpretClaims`, `base64UrlDecode`), unit-tested in `/tests/unit/jwt.util.test.ts`. Renders a color-coded token + Header/Payload JSON panels, friendly claim/expiry interpretation, and signature verification for HMAC (HS*), RSA, RSA-PSS, and ECDSA (ES*) via secret or public key (PEM/JWK). Signature verification uses `jose` (lazy-imported in the page, not in the util) so the util stays synchronous/testable; verify uses `compactVerify` (not `jwtVerify`) so expired-but-valid signatures still verify. Prefills from a `?token=` query param.
- **Image Converter** (`/tools/image-converter`, public): converts images between PNG, JPEG, and WebP fully client-side via the Canvas API (`createImageBitmap` → `canvas.toBlob`). Pure helpers (format registry, `buildOutputName`, `formatBytes`, `savingsPercent`, `isSupportedInput`) are in `/utils/image-convert.ts`, unit-tested in `/tests/unit/image-convert.util.test.ts`; the async canvas/queue/lifecycle logic lives in the page. Features: global target-format selector + quality slider (lossy only), drag-drop/click/paste input, sequential batch queue with per-file status, and "Download all (ZIP)" via lazy-imported `fflate`. GIF is intentionally excluded (canvas can't encode it / only decodes the first frame). JPEG output paints a white background to avoid black transparency; object URLs are revoked on remove/clear/unmount; a `runVersion` token discards stale results when format/quality/color-mode change mid-queue. **ICC color management**: a "Color profile" control offers *Convert to sRGB* (color-manages wide-gamut input to sRGB via lazy-loaded `lcms-wasm` / Little CMS) and *Preserve original* (re-embeds the source profile). Pure byte-level ICC parse/embed (`extractIccProfile`, `embedIccProfile`, `readIccDescription`, `crc32`) is in `/utils/icc.ts` (unit-tested in `/tests/unit/icc.util.test.ts`); the async WASM transform is in `/utils/color-transform.ts` (lazy `import('lcms-wasm')` + `lcms.wasm?url`). Embedding supports JPEG (APP2) and PNG (iCCP, zlib via `fflate`); WebP can't embed (falls back to sRGB). Raw pixels are decoded with `createImageBitmap(file, { colorSpaceConversion: 'none' })` so Little CMS sees profile-encoded values. **CSP**: `server/plugins/csp.ts` includes `'wasm-unsafe-eval'` in `script-src` so the WASM can instantiate.
- **Contract Red-Flag Scanner** (`/tools/contract-red-flag-scanner`, admin-only).
- **XPLOIT Translator** (`/tools/xploit-translator`, public): landing/docs page for the Windows tray app built in `C:\Users\OS\WebstormProjects\windows-translater` (Tauri 2, repo `Rovniy/windows-translater`) — copy text or a screenshot, press `Ctrl+Alt+T`, read the translation in an overlay. Nothing runs on the page; it explains the app and serves the current download. The download card is fed by `GET /api/xploit-translator/release`, a Nitro route that queries `api.github.com/.../releases/latest` with a **15-minute module-level memo** (unauthenticated GitHub allows 60 req/h per IP, so this must never be a per-visitor call) and **fails open** — a GitHub outage returns `{ ok: false }` at status 200, or the last good memo tagged `stale`, never a 5xx. Pure parsing + the repo constants are in `/utils/github-release.ts` (`parseRelease` matches assets by **suffix** — `-setup.exe`, `-portable.exe`, `SHA256SUMS.txt` — never by index); tested in `/tests/unit/github-release.util.test.ts` and `/tests/server/xploit-translator-release.api.test.ts`. The page fetches with `server: false` **on purpose**: it is prerendered, so an SSR fetch would freeze the build-time version into the static HTML — crawlers get plain `…/releases/latest` links and the exact version/sizes appear on hydration. Copy constraints (the repo has **no LICENSE**, builds are **unsigned**, users bring their **own OpenAI key**): never call it open source, always keep the SmartScreen note.

#### Tool ratings

Every public tool page shows a like/dislike rating widget top-right in the header, pinned on the same line as the h1 (like = 5, dislike = 2). Counters live in Firestore `tool_ratings/{toolId}` — server-side Admin SDK only, docs are **lazily seeded** on first read with 300–2000 votes at a 4–5 average, so a new tool gets believable initial numbers with zero setup. API: `GET /api/ratings` (all tools at once, cacheable — iterates `TOOL_IDS`) and `POST /api/ratings/vote` (IP rate-limited, supports vote changes via client-claimed `previous`).

Where things live:
- Pure math/seed/format helpers: `/utils/rating.ts` (tested in `/tests/unit/rating.util.test.ts`)
- Firestore transactions: `/server/utils/ratings.ts`; routes in `/server/api/ratings/` (tested in `/tests/server/ratings.api.test.ts`)
- Client state: `useToolRatings()` (one shared fetch per session) / `useToolRating(toolId)` in `/composables/useToolRating.ts`; localStorage remembers the user's vote
- UI: `<ToolRatingWidget>` (tool page header; async, skeleton while loading, hides on error) and `<ToolRatingBadge :summary>` (compact star badge on homepage cards)

**Rule when adding a new tool — ratings are automatic once the tool id exists.** Register the id once in `data/analytics.ts` (add to `TOOL_IDS` and map the route in `toolIdFromPath()` — the same registration every tool already needs for analytics). That alone makes `GET /api/ratings` seed and serve the tool, puts the rating badge on its homepage card (via `publicServices` + `toolIdFromPath`), and adds `aggregateRating` to its JSON-LD through `useToolPageSchema()`. The only markup step: drop `<ToolRatingWidget />` into the page header (no props — it resolves the tool id from the route; wrap the header as `flex items-start justify-between gap-x-6` with the text in a `min-w-0 flex-1` div, copy any existing tool page). Votes emit the `tool_rate` analytics event automatically.

### Services

Paid, human-delivered offerings live under `/pages/services/`. Three registries exist and must not be confused:

| Registry | File | What it is |
|---|---|---|
| `publicServices` | `data/index.ts` | Self-serve **tools**. Drives the Tools dropdown, the homepage grid, and rating badges. |
| `GATED_TOOLS` | `data/services.ts` | Per-user access-granted tools. Rendered inside the **Tools** dropdown below a divider with a "private" chip, client-side only, so non-grantees never see them. There is no separate nav item for them, and no "Manage access" link — admins use `/account` → Access tab. |
| `OFFERINGS` | `data/offerings.ts` | Commercial **offerings** shown on `/services`. |

- `/services` (`pages/services/index.vue`) lists every offering. An offering's `cta` is either `{ kind: 'page', path }` (full landing page, rendered as the wide card) or `{ kind: 'inquiry' }` (links to `/services?service=<id>#inquiry`, which preselects the form).
- **Promoting an offering to a full page:** flip `cta.kind` to `'page'` in `data/offerings.ts`, add the page file, and add it to `nitro.prerender.routes` + `routeRules`. The sitemap and prerender list read `OFFERING_PAGE_PATHS`, so neither needs editing.
- **Mentorship & job placement** (`/services/mentorship`) is the one full page. Copy lives in `data/mentorship.ts`; the seven-section payment terms are markdown at `content/docs/mentorship-terms.md`, served by the existing `/docs/**` route so they stay Tina-editable. Copy invariants are enforced by `tests/unit/offerings.test.ts` — pricing reads currency-free wherever it leads, ₽ appears only in the labelled example and the case cards, and the section counts the JSON-LD advertises are asserted.
- **Schema:** `useServicePageSchema()` and `useServicesIndexSchema()` in `/composables/useStructuredData.ts` emit `Service` + `Offer` (no `price` — see the comment on `serviceNode`) plus `FAQPage`/`HowTo`. **Never add `aggregateRating` or `Review` to a service** — there is no rating source and the cases are anonymised.
- **Lead capture:** `POST /api/services/inquiry` → Resend, via `sendServiceInquiryEmail()` in `server/utils/email.ts` (the one send helper there that is *not* best-effort — it throws so the route can return a 502 the sender sees). Validation is shared between the form and the route by `utils/inquiry.ts`. A filled `company` honeypot returns **200 with nothing sent**, so a bot can't tell it was caught. Rate limit: 3/hour per IP on the `service-inquiry` bucket.
- **Analytics:** `service_view` fires from `useServicePageSchema` when `serviceId` is passed; `service_inquiry` fires on a successful submit with `{ service, location }`.

### Analytics

Event tracking flows **app → `window.dataLayer` → GTM (`GTM-57T2XCRL`) → GA4**. There is no Firebase Analytics SDK; GA is fed by the GTM container (`data/gtm.ts`, loaded deferred in `plugins/gtm.client.ts`). Firing is gated by **GCM v2 Consent Mode** (`composables/useCookieConsent.ts`) — GTM only forwards to GA4 once `analytics_storage` is granted, **so app code never checks consent**: always push the event, GTM decides. SPA page views are handled by GTM's History Change trigger (configured in the GTM UI), not in app code.

- **Single source of truth:** `data/analytics.ts` — the `EVENTS` constant (every event name), the `ToolId` union, and `toolIdFromPath()`. Event names follow GA4 conventions (snake_case). `begin_checkout`, `purchase`, `login`, `logout` are GA4 standard events (built-in funnel/monetization reports); the rest are custom.
- **API:** `useAnalytics()` (`composables/useAnalytics.ts`) — SSR-safe `track(event, params)` plus helpers `trackTool`, `trackDownload`, `trackToolError`, `trackOutbound`, `trackCta`, `trackPurchase`. Unit-tested in `tests/unit/analytics.test.ts`.
- **Auto-capture:** outbound link clicks (external host, `mailto:`, `tel:`) fire `outbound_click` via a delegated listener in `plugins/analytics.client.ts` — no per-link code needed. Every tool page fires `tool_view` automatically because `useToolPageSchema()` emits it on mount.

Event taxonomy: `tool_view`, `tool_action` (`tool_id`+`action`), `tool_download`, `tool_error`; `blog_view`, `blog_read_progress` (25/50/75), `blog_complete`, `blog_filter`, `blog_search`; `outbound_click`, `nav_click`, `cta_click`; `newsletter_subscribe`, `contact_click`, `login`/`logout`; and the paid funnel `scan_start` → `scan_submit` → `scan_result` → `paywall_view` → `begin_checkout` → `purchase` (purchase fires on the result pages when a Stripe `session_id` is present).

**Rule when adding features:** add any new event name to `EVENTS` in `data/analytics.ts` first (the `track()` type enforces this), then emit via `useAnalytics()`. New tools get `tool_view` free via `useToolPageSchema` — also wire `tool_action`/`tool_download` for their key actions. New paid flows use `begin_checkout` + `purchase`. New outbound links need no code (auto-tracked).

### Styling

Tailwind CSS v4 (via `@tailwindcss/postcss`) with dark mode as default (`colorMode.defaultValue: 'dark'` in nuxt.config.ts). Dark mode toggled via class. Custom font is Space Grotesk. Page transitions use a 0.4s blur effect configured in nuxt.config.ts.

### OG Images

`OgImage.vue` component + `nuxt-og-image` module generates open graph images. The Satori renderer is used. OG image template path per page is set via `defineOgImage()` in page components.

### Tests

Vitest with `happy-dom`. Specs live next to components/utils. Use `npm test` for one-shot runs, `npm run test:coverage` for coverage.

### Deployment

Deployed to **Firebase App Hosting** (backend `ravy-pro` in Firebase project `xploit-games`). Configuration:
- `apphosting.yaml` — runtime config (CPU, memory, instances, env vars)
- `firebase.json` — backend wiring + Firestore rules
- `.firebaserc` — Firebase project mapping

App Hosting builds on push to `master` via its own integrated GitHub connector — there is no `.github/workflows/` in this repo. Runtime is Node.js (App Hosting default), Nitro server entry is `.output/server/index.mjs` after `npm run build`.

### ESLint

Uses `@antfu/eslint-config`. The `/content/**` directory is excluded from linting. Run `lint:fix` before committing.
