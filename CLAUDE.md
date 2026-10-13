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
- **Rendering.** `server/utils/blog-render.ts` parses markdown at request time with `parseMarkdown` from `@nuxtjs/mdc/runtime` (installed as a dependency of @nuxt/content, whose module generates the `#mdc-imports` plugin set — so remark-mdc and remark-emoji apply exactly as they did at build time). The Shiki highlighter must be passed **explicitly** (`highlight: { highlighter }` from `#mdc-highlighter`): left to itself the rehype plugin `$fetch`es `/api/_mdc/highlight`, which @nuxt/content never registers, and every code fence silently renders as plain text. Highlightable languages are the `langs` list under `content.build.markdown.highlight` in `nuxt.config.ts` — a fence in any other language renders unhighlighted. The result feeds the existing `<ContentRenderer>` unchanged: it only converts `value.body` from minimark when `body.type === 'minimark'` and otherwise passes the tree straight to `MDCRenderer`. Prose overrides in `components/content/` **must be `*.global.vue`**: in a production build @nuxt/content gives `<ContentRenderer>` only the components used by files under `content/` plus global ones, so a non-global `ProsePre` is dropped (posts aren't in `content/`), the page emits a literal `<ProsePre>` tag and code blocks collapse to one line — dev skips that filter, so it only breaks in prod (`tests/unit/prose-components-global.test.ts`). The toc is nested onto `body` because `components/blog/toc.vue` reads `articles.body.toc.links`.
- **Pure helpers** live in `utils/blog-post.ts` (slug rules, `normalizeRecord`, `recordFromDoc`, `toCardData`) and `utils/blog-embeds.ts`, both unit-tested. `toCardData` is the single copy of the card defaulting the three list views used to duplicate.
- **Embed rules are enforced at save time.** `findEmbedProblems()` rejects an `<iframe>` with width/height attributes, a fixed inline width, or no `title` — the same invariants a repo-scanning test used to enforce, moved to where posts are now authored.
- **Routes.** Public: `GET /api/blog/posts` (published metadata) and `GET /api/blog/post/[slug]` (metadata + rendered body; drafts 404, raw markdown never sent). Admin, all behind `requireToolAccess(event, 'studio')`: `admin/posts`, `admin/post/[slug]`, `admin/post` (PUT), `admin/post/[slug]` (DELETE), `admin/preview`, `admin/reindex`, `admin/media`, and the dev-only `admin/migrate`.

**Consequence for prerendering.** `/`, `/blogs`, `/blogs/**`, `/categories`, `/categories/**` are SSR with `s-maxage=60, stale-while-revalidate=600`, since App Hosting has no on-demand CDN purge — 60s *is* the publish-to-visible latency. A list or post page whose Firestore read fails throws **503**, never 404 or an empty 200, and `server/plugins/no-cache-errors.ts` overrides those cache headers with `no-store` on any 5xx so the CDN can't keep serving the error. `nitro.prerender.crawlLinks` is **off**: @nuxtjs/sitemap prerenders `/sitemap.xml` whenever the crawler runs alongside any prerender route, and a static `sitemap.xml` in `.output/public` shadows the runtime route and would freeze the post list at build time. Every prerendered page is therefore named in `nitro.prerender.routes`, with the docs enumerated from `content/docs` by `DOCS_ROUTES`. `/`, `/blogs` and `/categories` are listed explicitly in `server/api/__sitemap__/urls.ts` because they used to reach the sitemap through prerender auto-discovery.

#### The studio (`/studio`)

Gated exactly like `/shortify`: the `studio` key in `GATED_TOOLS` (`data/services.ts`) puts it in the Tools dropdown for grantees and in `/account` → Access, and every route re-checks server-side. `<AccountGrantedTools>` also links it (and every other granted tool) at the top of `/account`, driven by `accessibleServices` — so granting a new gated tool needs no edit there either. `components/studio/Gate.vue` renders the sign-in / access-denied states, and only mounts its slot when access is granted, so the editor never fires a request it would get a 403 for.

The editor is a markdown textarea with a live preview that goes through the **same** `renderMarkdown` and the same `prose` classes as the real post page. Images are converted to WebP and downscaled to 1600px **in the browser** before upload (`useBlogStudio` → `toUploadBlob`), then POSTed to `/api/blog/admin/media`, which writes to Cloud Storage at `blog/<slug>/<nanoid>.<ext>`.

**Images are served same-origin** by `server/routes/media/blog/[...path].get.ts` at `/media/blog/**`, not from `storage.googleapis.com`. That is deliberate: it needs no extra host in the CSP (`server/plugins/csp.ts`), lets satori fetch them while rendering OG cards, and leaves `storage.rules` deny-all like `firestore.rules`.

**`/_ipx/` needs `image.alias` to reach them.** IPX picks filesystem or HTTP storage by whether the resolved id has a protocol, and a root-relative id always goes to the filesystem — where these images do not exist. `nuxt.config.ts` therefore sets `image.alias['/media/blog']` to the absolute site URL and lists the host in `image.domains` (which is what creates the HTTP storage). The alias is resolved server-side, so the browser-facing `/_ipx/…` URL is unchanged. Without it every optimized post image 404s silently in production — and each failure then trips CSP, because the `onerror` attribute @nuxt/image puts on a server-rendered `<img>` only *executes* when the image fails. `tests/unit/image-alias.test.ts` guards the invariant. Object names are never reused — a nanoid for a new upload, a content hash for an imported file — so the year-long `immutable` cache header is accurate. The bucket comes from `runtimeConfig.firebaseStorageBucket` (`NUXT_FIREBASE_STORAGE_BUCKET` in `apphosting.yaml`).

Uploads accept images only (`ALLOWED_IMAGE_TYPES`). The serving map is wider (`svg`, `pdf`) purely because the imported archive carried a Google Play badge and a presentation; both are sent under `Content-Security-Policy: default-src 'none'; sandbox` plus `nosniff`, since a same-origin SVG is otherwise a script.

**No blog image lives in `/public` any more.** (Project images are the exception: they ship with the repo, see Projects below.) `public/blog-cover`, `public/blog-content` and `public/blog-opengraph` were imported into Storage by the dev-only `POST /api/blog/admin/migrate-media` (a button in the studio), which uploads every file, rewrites `image` / `ogImage` / the markdown, and records each old URL in `blog_media/redirects`. Those three prefixes are now Nitro routes (`server/routes/blog-*/[...path].get.ts`) that **301 to `/media/blog/**`** — the old paths are indexed by Google Images, appear as `<image:loc>` in the sitemap, and one of them (a presentation PDF) is linked from `/links`, so dropping them would have 404'd all of that. The importer is idempotent: a path already in the map is skipped, and object names are content-hashed.

The import deliberately does **not** bump `lastUpdated` — a URL rewrite is not a revision, and 30 posts all claiming to be edited the same minute is a bad signal. That is also why `renderMarkdown` caches on the markdown string itself rather than on `slug + lastUpdated`: a metadata-preserving edit would leave such a key identical while the body changed underneath it.

#### MCP server (`/mcp`) — Claude writes and publishes posts

`server/routes/mcp.ts` is a **stateless** MCP server over Streamable HTTP: one JSON-RPC message per POST, a JSON response, no SSE and no session id (App Hosting runs two instances, so a session would break). The JSON-RPC dispatch is hand-rolled in `server/utils/mcp/protocol.ts`. There is no SDK dependency. Tools live in `server/utils/mcp/blog-tools.ts`: `list_posts`, `get_post`, `list_tags`, `create_post`, `update_post`, `publish_post`, `unpublish_post` and `upload_image`. They save through the same `normalizeRecord` → `savePost` path as the studio, so every save invariant holds. On top of that, tags are checked against `BlogPostTag`. `update_post` can never flip `published`, and there is **deliberately no delete tool**. A tool throws `ToolInputError` for a mistake the model can fix, which becomes an `isError` result the model sees. Any other error is reported to the logs and returned to the model as a generic message.

**Auth is OAuth 2.1, with the site as its own authorization server.** That is what lets claude.ai web, Desktop, mobile and Claude Code connect by URL alone. The discovery chain is: `401` with `WWW-Authenticate: resource_metadata` → `/.well-known/oauth-protected-resource[/mcp]` → `/.well-known/oauth-authorization-server` → DCR at `/oauth/register` → consent at the **page** `/oauth/authorize` → `/oauth/token`, with PKCE S256 required and refresh tokens rotated. Every token carries a `familyId`; a used refresh token is kept (not deleted) until it expires, and presenting it again after a 30s grace window revokes the whole family. An error the consent page could send back to the client is returned automatically only to a loopback `redirect_uri` — anywhere else it waits for a click, since open registration means any https URL could be an attacker's. The consent page sits behind `<StudioGate>` (Google sign-in plus the `studio` grant). It validates the request through `GET /api/oauth/client` **before** it will redirect anywhere, so it cannot act as an open redirector, and approves through `POST /api/oauth/authorize`. Codes and tokens are stored only as SHA-256 hashes in `mcp_oauth_codes` / `mcp_oauth_tokens`, and registered clients live in `mcp_oauth_clients`. Every MCP call re-checks `hasToolAccess(email, 'studio')`, so revoking the grant cuts off clients that are already connected. `/account` → **MCP** tab (`AccountMcpConnect`, shown to anyone with `hasTool('studio')`) has per-client setup steps (Claude, Claude Code, Codex, ChatGPT, Cursor, VS Code, Gemini CLI, mcp-remote), the list of connected clients and a "Disconnect all" button. `/studio` links to it. In production, issuer and resource are pinned to `baseData.site.url` (`siteOrigin`). Note that nested `server/utils/mcp/*` exports are Nitro auto-imports: do not reuse h3 names (the CORS helper is `applyMcpCors`, not `handleCors`).

#### TIL notes (`/til`)

Short "Today I Learned" notes, written in **English** (the goal is international search and LinkedIn reach). A note is a question as its title, a few lines of markdown, one or more topics, and no cover. Its description is derived from the body.

- **Storage.** The store is `server/utils/til-store.ts`, built the same way as the blog's.
  - Firestore holds each note in `til_notes/{slug}` and the metadata index in `til_index/current`.
  - The index is memoised for 60s and the stale copy is served if Firestore fails.
  - `getNotes(slugs)` reads bodies in one `getAll`.
- **Pure helpers.** These live in `utils/til.ts`, tested in `tests/unit/til.util.test.ts`.
  - `normalizeNote` checks the note:
    - the title is at most `NOTE_TITLE_MAX` (110) characters;
    - the markdown is at most `NOTE_MAX_CHARS` (4000) characters;
    - every topic is in `TIL_TOPICS`;
    - embeds follow `findEmbedProblems`.
  - Other helpers: `excerptOf`, `relatedNotes`, `topicCounts` and `notePingPaths`.
  - `noteWarnings` gives advice that never blocks a save: add code or a link, the note is too short or too long, the title is long, Cyrillic text found.
  - `linkedInPost` and `xPost` build ready-to-paste share texts. `xPost` counts the URL as 23 characters.
  - `path` is stored and never re-derived.
  - Reserved note slugs: `new`, `topic`, `rss`. The blog's `RESERVED_SLUGS` gains `notes`.
- **Topics.** `TIL_TOPICS` in `data/til.ts` is a closed list: unity, gamedev, ai, web, devops, leadership.
  - Each topic has a unique 100–200 character description (the hub's meta description), optional hashtags, and an optional blog `category` that the hub links to.
- **Pages.**
  - Routes: `/til`, `/til/[slug]` and `/til/topic/[topic]`, SSR with the same live cache headers as the blog.
  - Shared parts: `components/til/*`. `Feed.vue` renders the list and `AuthorBox.vue` is the "who wrote this" block under every note, which fires `cta_click` `til_author_*`.
  - An unknown topic returns 404. A hub with no notes is `noindex` and left out of the sitemap.
  - When Firestore is down, the pages return 503, not 404.
- **API.**
  - Public: `GET /api/til/notes` (metadata), `GET /api/til/feed?topic&limit` (rendered bodies plus archive and counts) and `GET /api/til/note/[slug]` (drafts 404).
  - Admin, behind `requireToolAccess(event, 'studio')`: `admin/notes`, `admin/note/[slug]` (GET and DELETE) and `admin/note` (PUT).
  - The PUT returns 409 when `mode: 'create'` hits an existing slug. It returns the note plus `warnings`.
- **Studio.** `/studio?tab=notes` lists notes, and `/studio/notes/[slug]` (`components/studio/NoteEditor.vue`) edits one.
  - The editor shows live warnings, a search snippet, and a preview through the blog's `renderMarkdown`.
  - Once a note is published, a "Share it" panel shows the LinkedIn and X texts.
- **MCP.** The tools are in `server/utils/mcp/til-tools.ts` and are merged into the one `/mcp` server: `TOOLS = [...blogTools, ...tilTools]`, with `TIL_MCP_INSTRUCTIONS` appended.
  - Tools: `list_notes`, `get_note`, `list_topics`, `create_note`, `update_note`, `publish_note` (with an optional `redate`) and `unpublish_note`.
  - `update_note` never changes `published`, and there is no delete tool.
  - A publish returns `share: { linkedin, x }`.
- **IndexNow.** `pingIndexNow(paths)` in `server/utils/indexnow.ts` tells Bing and Yandex when a URL changes.
  - Key: `INDEXNOW_KEY` in `utils/indexnow.ts`, served at `/indexnow-key.txt`.
  - It runs after a save of a note or post that is, or was, published. It covers the page, its feed and its hubs.
  - It runs only in production (never in dev or vitest) and is best-effort: a failure is logged as a WARNING.
  - Google ignores IndexNow and relies on the sitemap.
- **Distribution.**
  - Feeds: the sitemap, `/til/rss.xml` (50 newest), and `llms.txt` / `llms-full.txt`. Each fails soft, so a notes outage leaves the blog's output intact.
  - In the ⌘K palette, notes are the `note` type in the Posts scope, loaded from `/api/til/notes`.
  - Header nav: "TIL".
- **Schema and OG.**
  - A note page emits `TechArticle`, whose author is the `#person` node (`useTilNoteSchema`).
  - `/til` and the hubs emit `CollectionPage` + `ItemList` (`useTilCollectionSchema`).
  - The OG card is `components/OgImage/Note.satori.vue`.
  - Satori drops Tailwind's `border` utilities, so use inline `border` styles in that file.

### Data & Configuration

Site-wide metadata (nav links, social networks, SEO defaults) lives in `/data/index.ts` — not in nuxt.config.ts or environment variables. This is the single source of truth for site identity.

### Routing & Pages

Standard Nuxt file-based routing in `/pages/`. Key non-obvious routes:
- `/rss.xml` — generated by Nitro server route at `/server/routes/rss.xml.ts`; post bodies are rendered from markdown by `renderMarkdown` and serialised by `mdcToHtml` (`server/utils/mdc-html.ts`)
- `/media/blog/**` — post images proxied out of Cloud Storage (see Content Pipeline)
- `/studio`, `/studio/[slug]` — the blog panel; gated, `noindex`, excluded from the sitemap and listed in `PRIVATE_PATHS`
- Legacy URL redirects handled in `/middleware/old-url-redirects.global.ts`

### Command palette (⌘K)

One dialog searches posts, tools, games, albums, pages, services and socials, and runs quick actions (write, copy email, switch theme, copy page link, subscribe). Opened by ⌘K / Ctrl+K anywhere, `/` outside text fields (`plugins/command-palette.client.ts`, matched on `e.code` so a Russian layout works), the Search pill in the header, the magnifier in the mobile bar, and the search field plus suggestion chips in the home hero (`homePage.hero.searchSuggestions`).

- **Index:** `utils/command-index.ts` builds it from the registries (`publicServices`, `GAMES`, `MUSIC_PROJECTS`, `OFFERINGS`, socials…), so a new game, album or tool shows up with no palette edit. Posts come from `GET /api/blog/posts` on first open. Each item has up to three `actions`: the first runs on Enter, the second on ⌘/Ctrl+Enter, all are buttons on the active row. `navigate` goes through the router; same-origin files (`/rss.xml`, the CV) must be `external`, or the router 404s them.
- **Search:** `utils/command-search.ts`, pure, no dependency. Exact → prefix → word start → substring → keyword → fuzzy; every token must match; a query that finds nothing is retried on the other keyboard layout ("ешт? ищщ" → "tiny boo"). Russian synonyms go in `keywords`.
- **Component:** `components/command/Palette.vue` is a WAI-ARIA combobox in a native `<dialog>`, mounted only after the first open (`useCommandPalette().requested`, `layouts/default.vue`), with the chunk prefetched on idle. Recents live in localStorage. Tab cycles the scope chips; a leading `>` limits results to actions.
- **Icons:** item icons are bound at runtime, so `commandIcons()` is spread into `icon.clientBundle.icons`. `tests/unit/command-index.test.ts` fails if one is missing, an internal action points at a page that doesn't exist, or a hero chip finds nothing.
- **Analytics:** `command_palette_open` ({ source }), `command_palette_action` ({ item_type, item_id, action, position, query_length, scope }), and the GA4 standard `search` when a result is picked after typing.

### Tools

Interactive client-side utilities live in `/pages/tools/`. They are registered in `/data/index.ts` as `publicServices`; access-gated tools live separately in `/data/services.ts` as `GATED_TOOLS`. Tools emit structured data via the `useToolPageSchema()` composable (`/composables/useStructuredData.ts`), which sets SEO meta, JSON-LD `SoftwareApplication`/FAQ schema, and the OG image. One entry (XPLOIT Translator) is a *documentation/download* page for an external desktop app rather than a browser utility — `useToolPageSchema()` takes `appOperatingSystem` / `appDownloadUrl` / `appSoftwareVersion` for that case (the last accepts a ref or getter, since the app node is rebuilt reactively).

- **QR Code Generator** (`/tools/qr-code-generator`, public): builds styled QR codes with `qr-code-styling`. Customizable size, margin, dot/corner styles, colors, and a center logo image; renders to canvas and downloads as PNG. Prefills from a `?data=` query param.
- **Credit Card Generator** (`/tools/credit-card-generator`, public): generates Luhn-valid **test** card numbers and validates/detects brands. Core logic is in `/utils/credit-card.ts` (`generateCard`, `validateCardNumber`, `getBrandSpec`, `BRAND_SPECS`), unit-tested in `/tests/unit/credit-card.util.test.ts`. Supports Visa, MasterCard, Amex, Discover, JCB, Diners Club, UnionPay, plus optional custom BIN prefixes. Numbers are fake test data — not real cards.
- **JWT Decoder** (`/tools/jwt-decoder`, public): decodes and verifies JSON Web Tokens fully client-side. Pure decode/claim-interpretation logic is in `/utils/jwt.ts` (`decodeJwt`, `getAlgInfo`, `getTokenStatus`, `getClaimTime`, `interpretClaims`, `base64UrlDecode`), unit-tested in `/tests/unit/jwt.util.test.ts`. Renders a color-coded token + Header/Payload JSON panels, friendly claim/expiry interpretation, and signature verification for HMAC (HS*), RSA, RSA-PSS, and ECDSA (ES*) via secret or public key (PEM/JWK). Signature verification uses `jose` (lazy-imported in the page, not in the util) so the util stays synchronous/testable; verify uses `compactVerify` (not `jwtVerify`) so expired-but-valid signatures still verify. Prefills from a `?token=` query param.
- **Image Converter** (`/tools/image-converter`, public): converts images between PNG, JPEG, and WebP fully client-side via the Canvas API (`createImageBitmap` → `canvas.toBlob`). Pure helpers (format registry, `buildOutputName`, `formatBytes`, `savingsPercent`, `isSupportedInput`) are in `/utils/image-convert.ts`, unit-tested in `/tests/unit/image-convert.util.test.ts`; the async canvas/queue/lifecycle logic lives in the page. Features: global target-format selector + quality slider (lossy only), drag-drop/click/paste input, sequential batch queue with per-file status, and "Download all (ZIP)" via lazy-imported `fflate`. GIF is intentionally excluded (canvas can't encode it / only decodes the first frame). JPEG output paints a white background to avoid black transparency; object URLs are revoked on remove/clear/unmount; a `runVersion` token discards stale results when format/quality/color-mode change mid-queue. **ICC color management**: a "Color profile" control offers *Convert to sRGB* (color-manages wide-gamut input to sRGB via lazy-loaded `lcms-wasm` / Little CMS) and *Preserve original* (re-embeds the source profile). Pure byte-level ICC parse/embed (`extractIccProfile`, `embedIccProfile`, `readIccDescription`, `crc32`) is in `/utils/icc.ts` (unit-tested in `/tests/unit/icc.util.test.ts`); the async WASM transform is in `/utils/color-transform.ts` (lazy `import('lcms-wasm')` + `lcms.wasm?url`). Embedding supports JPEG (APP2) and PNG (iCCP, zlib via `fflate`); WebP can't embed (falls back to sRGB). Raw pixels are decoded with `createImageBitmap(file, { colorSpaceConversion: 'none' })` so Little CMS sees profile-encoded values. **CSP**: `server/plugins/csp.ts` includes `'wasm-unsafe-eval'` in `script-src` so the WASM can instantiate.
- **Contract Red-Flag Scanner** (`/tools/contract-red-flag-scanner`, admin-only).
- **XPLOIT Translator** (`/tools/xploit-translator`, public): landing/docs page for the Windows tray app built in `C:\Users\OS\WebstormProjects\windows-translater` (Tauri 2, repo `Rovniy/windows-translater`) — copy text or a screenshot, press `Ctrl+Alt+T`, read the translation in an overlay. Nothing runs on the page; it explains the app and serves the current download. The download card is fed by `GET /api/xploit-translator/release`, a Nitro route that queries `api.github.com/.../releases/latest` with a **15-minute module-level memo** (unauthenticated GitHub allows 60 req/h per IP, so this must never be a per-visitor call) and **fails open** — a GitHub outage returns `{ ok: false }` at status 200, or the last good memo tagged `stale`, never a 5xx. Pure parsing + the repo constants are in `/utils/github-release.ts` (`parseRelease` matches assets by **suffix** — `-setup.exe`, `-portable.exe`, `SHA256SUMS.txt` — never by index); tested in `/tests/unit/github-release.util.test.ts` and `/tests/server/xploit-translator-release.api.test.ts`. The page fetches with `server: false` **on purpose**: it is prerendered, so an SSR fetch would freeze the build-time version into the static HTML — crawlers get plain `…/releases/latest` links and the exact version/sizes appear on hydration. Copy constraints (the repo has **no LICENSE**, builds are **unsigned**, users bring their **own OpenAI key**): never call it open source, always keep the SmartScreen note.
- **XPLOIT Game UI** (`/tools/xploit-game-ui`, public): short landing page for the Unity plugin in repo `Rovniy/xploit_game_ui` (HTML/CSS/JS game UI rendered by Skia on Unity's D3D12 device). Fully static — no release API: the download button points at `…/releases/latest`, where the UPM `.tgz` is attached. Unlike the translator it **is** open source (Apache-2.0), so saying so is correct.

#### Tool ratings

Every public tool page shows a like/dislike rating widget top-right in the header, pinned on the same line as the h1 (like = 5, dislike = 2). Counters live in Firestore `tool_ratings/{toolId}` — server-side Admin SDK only, docs are **lazily seeded** on first read with 300–2000 votes at a 4–5 average, so a new tool gets believable initial numbers with zero setup. API: `GET /api/ratings` (all tools at once, cacheable — iterates `TOOL_IDS`) and `POST /api/ratings/vote` (IP rate-limited, supports vote changes via client-claimed `previous`).

Where things live:
- Pure math/seed/format helpers: `/utils/rating.ts` (tested in `/tests/unit/rating.util.test.ts`)
- Firestore transactions: `/server/utils/ratings.ts`; routes in `/server/api/ratings/` (tested in `/tests/server/ratings.api.test.ts`)
- Client state: `useToolRatings()` (one shared fetch per session) / `useToolRating(toolId)` in `/composables/useToolRating.ts`; localStorage remembers the user's vote
- UI: `<ToolRatingWidget>` (tool page header; async, skeleton while loading, hides on error) and `<ToolRatingBadge :summary>` (compact star badge on homepage cards)

**Rule when adding a new tool — ratings are automatic once the tool id exists.** Register the id once in `data/analytics.ts` (add to `TOOL_IDS` and map the route in `toolIdFromPath()` — the same registration every tool already needs for analytics). That alone makes `GET /api/ratings` seed and serve the tool, and puts the rating badge on its homepage card (via `publicServices` + `toolIdFromPath`). The ratings are **never** emitted as `aggregateRating` in JSON-LD — the counters are seeded, and review markup on invented votes is a manual-action risk. The only markup step: drop `<ToolRatingWidget />` into the page header (no props — it resolves the tool id from the route; wrap the header as `flex items-start justify-between gap-x-6` with the text in a `min-w-0 flex-1` div, copy any existing tool page). Votes emit the `tool_rate` analytics event automatically.

### Projects (games, music, animation)

Creative work lives in typed registries, not in `content/`: `data/games.ts` (`GAMES`), `data/music.ts` (`MUSIC_PROJECTS`), `data/animation.ts` (`TINY_BOO_MOVIE`), with shared platform/status helpers in `data/projects.ts`. Pages: `/projects` (hub), `/games`, `/games/[slug]`, `/music`, `/music/[slug]`, `/animation/tiny-boo`, plus a home-page section (`components/main/projects.vue`).

- **Routes are derived.** `PROJECT_PAGE_PATHS` (`data/project-routes.ts`) feeds `nitro.prerender.routes`, `routeRules` and the sitemap (`projectSitemapEntries()`), so adding a game or album needs no config edit. `TAG_PROJECT_LINKS` puts a project link on the matching `/categories/<tag>` page.
- **Embeds are click-to-load.** `<UiEmbedFacade>` shows a poster and swaps in the YouTube (`youtube-nocookie.com`) or Spotify iframe on click, firing `video_play` / `music_play`. Both hosts are in `frame-src` in `server/plugins/csp.ts`. Store and streaming clicks fire `store_click`; page views fire `project_view`.
- **Platform icons are bound dynamically**, so every `PLATFORM_META` icon is spread into `icon.clientBundle.icons` in `nuxt.config.ts`.
- **Schema** comes from the pure builders in `utils/project-schema.ts` (`VideoGame` + `MobileApplication`, `MusicGroup`, `CreativeWorkSeries`) via `useGamePageSchema` / `useMusicPageSchema` / `useSeriesPageSchema`. **Never add `aggregateRating` or `Review`** — there is no rating source; tool ratings are seeded.
- **Music is presented openly as AI work.** `aiDisclosure` is required on every `MusicProject` and rendered on its page; Zynthar's members and Diva Rogue are fictional characters, and the schema says so.
- **Project images ship in the repo, not in Storage.** Game covers and screenshots live in `public/games/<slug>/` (`cover.webp`, `screenshot-1.webp`, …), album covers in `public/music/covers/<artist>/<album>.webp`, all WebP, at most 1600px. Ravy wants no hotlinked images here; the `COVER()` helper builds the album path, and `STORED_COVER()` is only a placeholder for an album whose cover file is not in the repo yet. Still external: the TCG cover and YouTube posters (`i.ytimg.com`).
- **Screenshots.** `screenshots(slug, [[w, h, alt], …])` in `data/games.ts` maps the list to `screenshot-N.webp` in order. `<ProjectGallery>` (`components/project/Gallery.vue`) renders them as a grid (two wide columns when every shot is landscape, square tiles otherwise) with a native `<dialog>` lightbox and ← → keys. Width and height must be the real pixel size: they set the aspect ratio before the image loads.
- **Press kits.** Every game has `/games/<slug>/press` (`pages/games/[slug]/press.vue`; the game page itself is `[slug]/index.vue`), built from the same registry entry: a fact sheet (`pressFacts`), the required `press.short` (~50 words) and `press.long` (paragraphs, 120–260 words, both checked in `tests/unit/projects.test.ts`), the trailer, the optional `icon` (512px PNG) plus cover and screenshots, and a press contact. "Download all" zips those images and a `fact-sheet.txt` **in the browser** with lazy-loaded `fflate`, so only same-origin files can go in (`pressFiles` drops hotlinked ones). Fires `press_kit_download` and `press_copy`. The streaming permission line is shown only once a game is playable.
- **Images reach search engines twice.** `gameNode` emits `screenshot` and every `MusicAlbum.image` as absolute URLs, and `projectSitemapEntries()` lists the cover, screenshots and album covers of each page as `<image:image>` rows. Only same-origin paths go in.
- Every trailer (`trailerUploadDate`) and episode (`uploadDate`) carries its YouTube publish date: Google treats a `VideoObject` without `uploadDate` as invalid.
- An unreleased game has no `releaseDate`; an in-development one gets no `offers`. Invariants are in `tests/unit/projects.test.ts`.

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

Event taxonomy: `tool_view`, `tool_action` (`tool_id`+`action`), `tool_download`, `tool_error`; `blog_view`, `blog_read_progress` (25/50/75), `blog_complete`, `blog_filter`, `blog_search`; `til_view`, `til_share` (`{ slug, network: copy | linkedin | x }`); `outbound_click`, `nav_click`, `cta_click`; `command_palette_open`, `command_palette_action`, `search`; `newsletter_subscribe`, `contact_click`, `login`/`logout`; and the paid funnel `scan_start` → `scan_submit` → `scan_result` → `paywall_view` → `begin_checkout` → `purchase` (purchase fires on the result pages when a Stripe `session_id` is present).

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
