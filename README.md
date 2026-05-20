# ravy.pro

Personal blog and portfolio of Andrei Rovniy. Built with Nuxt 4, markdown-based content via `@nuxt/content`, and TinaCMS as a visual editor layer.

**Live site:** https://ravy.pro

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 + Vue 3 |
| Content | @nuxt/content v3 (SQLite + markdown) |
| CMS | TinaCMS 3.7 (visual editor at `/admin`) |
| Styling | Tailwind CSS v4 via @tailwindcss/postcss |
| Icons | @nuxt/icon v2 (bundled at build time) |
| Images | @nuxt/image v2 (WebP/AVIF conversion) |
| OG Images | nuxt-og-image v6 with Satori renderer |
| SEO | @nuxtjs/sitemap, @nuxtjs/robots |
| Fonts | Space Grotesk via @fontsource (self-hosted) |
| Runtime | Node.js 20 + Nitro server |
| Tests | Vitest + happy-dom |
| Hosting | Firebase App Hosting |
| Backend services | Firebase / Firestore |

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
git clone https://github.com/Rovniy/ravy.pro.git
cd ravy.pro
npm ci
```

### Commands

```bash
# Dev server without CMS (faster)
npm run dev

# Dev server with TinaCMS visual editor (preferred for content work)
# Admin UI available at http://localhost:3000/admin
npm run tina

# Lint
npm run lint

# Auto-fix lint issues (run before committing)
npm run lint:fix

# Tests
npm test
npm run test:watch
npm run test:coverage

# Production build
npm run build

# Start the production server locally (after build)
npm run start
```

Dev server runs at **http://localhost:3000**.

### Environment

Local development does not require a `.env` file for the public site. All site-wide configuration (author name, social links, SEO defaults) lives in `data/index.ts`. Firebase-related features rely on credentials provided by App Hosting at runtime; see `.env.example` for any values needed locally.

---

## Content Management

Content is stored as markdown files with YAML frontmatter in the `/content` directory:

```
content/
  blogs/     # Blog posts
  docs/      # Documentation pages (Privacy Policy, Terms of Use, etc.)
  pages/     # Static pages (About)
```

### Adding a Blog Post

**Option A — TinaCMS (recommended):**
1. Run `npm run tina`
2. Open http://localhost:3000/admin
3. Navigate to Blog / Posts → New Post
4. Fill in the fields and publish

**Option B — manually:**
Create a file in `content/blogs/` with this frontmatter:

```md
---
title: 'Post Title'
description: 'Short description'
image: /blog-cover/filename.webp
ogImage: /blog-opengraph/filename.png
tags:
  - dev
createdAt: 2025-01-01T12:00:00.000Z
lastUpdated: 2025-01-01T12:00:00.000Z
published: true
trending: false
---

Content here...
```

### Tags

Available tags are defined as an enum in `tina/config.ts` (exported as `BlogPostTag` from `data/index.ts`). Add new tags there before using them in posts.

### Images

Place blog images in:
- `/public/blog-cover/` — card thumbnails (recommended: 800×500 WebP)
- `/public/blog-opengraph/` — OG images (recommended: 1200×630 PNG)

---

## Deployment

The site is hosted on **Firebase App Hosting** (backend `ravy-pro` in Firebase project `xploit-games`). Pushes to `master` trigger an automatic rebuild via App Hosting's GitHub connector — there is no GitHub Actions workflow in this repo.

### Configuration files

| File | Purpose |
|---|---|
| `apphosting.yaml` | Runtime config: instance count, CPU/memory, env vars (`HOST`, `NITRO_HOST`) |
| `firebase.json` | Backend wiring and Firestore rules path |
| `.firebaserc` | Firebase project alias (`xploit-games`) |
| `firestore.rules` | Firestore security rules |

### Manual operations

Most changes flow through `git push`. For ad-hoc operations use the Firebase CLI:

```bash
# Install CLI (one-time)
npm i -g firebase-tools
firebase login

# Deploy Firestore rules without touching App Hosting
firebase deploy --only firestore:rules

# Tail backend logs
firebase apphosting:backends:logs ravy-pro
```

Tune scaling (instance count, CPU, memory) by editing `apphosting.yaml` and pushing — App Hosting picks up the change on the next deploy.

---

## Project Structure

```
ravy.pro/
├── assets/css/          # Tailwind CSS entry point + custom base styles
├── components/          # Vue components (auto-imported)
│   ├── OgImage/         # Satori OG image templates
│   ├── archive/         # Blog list page components
│   ├── blog/            # Single post components (header, TOC, card)
│   ├── footer/          # Footer sub-components
│   ├── main/            # Layout components (header, hero, recent, trending)
│   └── content/         # Markdown renderer overrides
├── content/             # Markdown content (blogs, docs, pages)
├── data/                # Site-wide config (navbarData, seoData, footerData, etc.)
├── layouts/             # Nuxt layouts (default)
├── middleware/          # Route middlewares (legacy URL redirects)
├── pages/               # File-based routing
├── public/              # Static assets (images, icons, robots.txt, rss.xml)
├── server/
│   ├── routes/          # Nitro server routes (rss.xml)
│   └── api/             # API endpoints (__sitemap__/urls.ts)
├── tina/                # TinaCMS config and schema
├── types/               # TypeScript types
└── utils/               # Auto-imported utility functions
```

---

## Useful URLs (local)

| URL | Description |
|---|---|
| http://localhost:3000 | Homepage |
| http://localhost:3000/admin | TinaCMS editor (requires `npm run tina`) |
| http://localhost:3000/rss.xml | RSS feed |
| http://localhost:3000/sitemap.xml | Sitemap |
| http://localhost:3000/__og_image__ | OG image debug (Nuxt DevTools) |
