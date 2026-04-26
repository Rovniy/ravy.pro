# ravy.pro

Personal blog and portfolio of Andrei Rovniy. Built with Nuxt 4, markdown-based content via `@nuxt/content`, and TinaCMS as a visual editor layer.

**Live site:** https://ravy.pro

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4.1 + Vue 3 |
| Content | @nuxt/content v3 (SQLite + markdown) |
| CMS | TinaCMS 3.7 (visual editor at `/admin`) |
| Styling | Tailwind CSS v4 via @tailwindcss/postcss |
| Icons | @nuxt/icon v2 (bundled at build time) |
| Images | @nuxt/image v2 (WebP/AVIF conversion) |
| OG Images | nuxt-og-image v6 with Satori renderer |
| SEO | @nuxtjs/sitemap, @nuxtjs/robots |
| Fonts | Space Grotesk via @fontsource (self-hosted) |
| Runtime | Node.js 22 + Nitro server |
| Container | Docker (multi-stage) + docker-compose |
| Reverse proxy | Nginx with Gzip + Brotli |
| SSL | Let's Encrypt (Certbot) |

---

## Local Development

### Prerequisites

- Node.js 22+
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

# Production build
npm run build

# Start production server locally
npm run start
```

Dev server runs at **http://localhost:3000**.

### Environment

No `.env` file is required for local development. All site-wide configuration (author name, social links, SEO defaults) lives in `data/index.ts`.

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

## Server Setup (first time)

These steps are required once on a fresh VPS before CI/CD can deploy automatically.

### 1. Install dependencies

```bash
# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# Docker Compose
apt install docker-compose-plugin

# Nginx
apt install nginx

# Certbot (SSL)
apt install certbot python3-certbot-nginx

# Brotli module for Nginx
apt install libnginx-mod-http-brotli-filter
```

### 2. Clone repository

```bash
mkdir -p /home/ravy_pro
cd /home/ravy_pro
git clone https://github.com/Rovniy/ravy.pro.git .
```

### 3. Configure Nginx

```bash
cp ravy.pro.nginx /etc/nginx/sites-available/ravy.pro
ln -s /etc/nginx/sites-available/ravy.pro /etc/nginx/sites-enabled/ravy.pro
nginx -t && systemctl reload nginx
```

The app is proxied from port `3030` (Docker) → `3000` (container internal).

Cache strategy configured in `ravy.pro.nginx`:
- `/_nuxt/*` — `max-age=31536000, immutable` (hashed filenames, safe to cache forever)
- Static files (images, fonts) — `max-age=604800` (1 week)
- HTML / API — `max-age=0, must-revalidate` (always fresh after deploy)

### 4. Obtain SSL certificate

```bash
certbot --nginx -d ravy.pro -d www.ravy.pro
```

Certbot auto-patches the nginx config with SSL directives and sets up auto-renewal.

### 5. Initial Docker build

```bash
cd /home/ravy_pro
docker build . -t xploitravy/ravy_pro:latest
docker-compose up -d
```

---

## CI/CD (GitHub Actions)

Deploys automatically on every push to `master`.

**Pipeline steps:**
1. SSH into VPS → `git pull origin master`
2. Update nginx config → test config → reload nginx (rolls back on failure)
3. Rebuild Docker image
4. `docker-compose down && docker-compose up -d`
5. Send Discord notification

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `VPS_SERVER_HOST` | VPS IP address or hostname |
| `VPS_SERVER_USERNAME` | SSH user (e.g. `root`) |
| `VPS_SERVER_SSH_KEY` | Private SSH key (the VPS must have the matching public key in `~/.ssh/authorized_keys`) |

### SSH Key Setup

Generate a dedicated deploy key:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/ravy_pro_deploy
cat ~/.ssh/ravy_pro_deploy.pub >> ~/.ssh/authorized_keys
```

Copy the private key (`~/.ssh/ravy_pro_deploy`) into the `VPS_SERVER_SSH_KEY` GitHub secret.

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
