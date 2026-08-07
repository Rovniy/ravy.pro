const currentYear = new Date().getFullYear()

export const baseData = {
  me: {
    name: 'Andrei Rovnyi',
    nick: 'Ravy',
    email: 'contact@ravy.pro',
  },
  site: {
    url: 'https://ravy.pro',
    licence: 'MIT',
  },
}

export const BlogPostTag = [
  'ai',
  'dev',
  'diva-rogue',
  'games',
  'idled',
  'music',
  'policy',
  'tabs-broadcast',
  'tiny-boo',
  'zynthar',
  'animation',
]

// Unique per-tag copy for /categories/<tag> pages — a templated
// "you will find all the X posts here" reads as thin/duplicate content
// to search engines and to people.
export const categoryDescriptions: Record<string, string> = {
  'ai': 'Posts on putting AI to work: agents, AI-assisted coding, music generation, and building products around language models.',
  'dev': 'Software engineering notes — web platforms, JavaScript, tooling, and lessons from shipping real projects.',
  'diva-rogue': 'Diva Rogue — an AI-assisted music project: releases, process, and experiments.',
  'games': 'Game development posts: design, engineering, releases, and the business side of making games.',
  'idled': 'IDLED Survival — devlog and engine internals of an idle survival mobile game.',
  'music': 'Making music with AI tools — from first experiments to released tracks.',
  'policy': 'Privacy policies, platform rules, and compliance notes for apps and games.',
  'tabs-broadcast': 'Tabs Broadcast — a tiny JavaScript library for messaging between browser tabs.',
  'tiny-boo': 'Tiny Boo: Homecoming — devlogs, art, level design, and the animated series built on the same character.',
  'zynthar': 'Zynthar — an AI-assisted metal music project: releases and behind-the-scenes.',
  'animation': 'Making an animated series with AI tools — pipeline, episodes, and lessons learned.',
}

export const navbarData = {
  homeTitle: baseData.me.name,
}

// Access-gated tools live in `data/services.ts` (GATED_TOOLS) and are surfaced
// per-user via the access-grant system, not listed here.

export interface PublicService {
  name: string
  path: string
  icon: string
  blurb?: string
  /** Flagship product — rendered as a large card on the homepage instead of a compact utility row. */
  featured?: boolean
  /** Audience chip on featured cards ("For game devs"). */
  tag?: string
  /** Action-oriented CTA verb on featured cards; compact rows use an arrow only. */
  action?: string
  /** Mono meta line with the pricing/format facts ("Free check · $10 full report"). */
  meta?: string
}

export const publicServices: PublicService[] = [
  {
    name: 'Steam AI Disclosure',
    path: '/tools/steam-ai-disclosure',
    icon: 'mdi:steam',
    blurb: 'Answer a short guided wizard about how your game uses AI and get Steam\'s AI content disclosure filled correctly.',
    featured: true,
    tag: 'For game devs',
    action: 'Start check',
    meta: 'Free check · paid disclosure pack',
  },
  {
    name: 'Contract Red-Flag Scanner',
    path: '/tools/contract-red-flag-scanner',
    icon: 'mdi:shield-search',
    blurb: 'Upload an influencer or brand contract and spot risky clauses — exclusivity traps, payment terms, usage rights — before you sign.',
    featured: true,
    tag: 'For creators',
    action: 'Scan a contract',
    meta: 'Free risk check · $10 full report',
  },
  {
    name: 'XPLOIT Translator',
    path: '/tools/xploit-translator',
    icon: 'mdi:translate',
    blurb: 'Windows tray app: copy text or a screenshot, press Ctrl+Alt+T, and read it in your language.',
    featured: true,
    tag: 'For Windows',
    action: 'Download',
    meta: 'Free app · your own OpenAI key',
  },
  { name: 'QR Code Generator', path: '/tools/qr-code-generator', icon: 'mdi:qrcode', blurb: 'Styled QR codes with a logo, export as PNG.' },
  { name: 'Credit Card Generator', path: '/tools/credit-card-generator', icon: 'mdi:credit-card-outline', blurb: 'Luhn-valid test card numbers for QA.' },
  { name: 'JWT Decoder', path: '/tools/jwt-decoder', icon: 'mdi:shield-key-outline', blurb: 'Decode and verify JWTs in your browser.' },
  { name: 'Image Converter', path: '/tools/image-converter', icon: 'mdi:image-sync-outline', blurb: 'Convert PNG, JPEG and WebP locally.' },
]

export const footerData = {
  author: baseData.me.name,
  aboutAuthor: 'Engineering manager, founder, and software developer building web platforms, game systems, real-time services, and automation tools. 15 years of shipped work — currently at Gaijin.net.',
  authorTitle: 'Get in Touch',
  authorInterest: 'Building an MVP, shipping a game feature, or automating a team workflow? Open source or paid — let\'s talk.',
  aboutTheSite: 'Personal blog of Andrei Rovnyi — notes on engineering, game tech, automation, and the craft of shipping software.',
  copyright: `© 2020-${currentYear} XPLOIT FZE. All trademarks, names and logos belong to their respective copyright holders.`,
  newsletter: {
    title: 'Newsletter',
    blurb: 'Occasional notes on engineering, game tech, and new tools — no spam, unsubscribe anytime.',
  },
}

export const page404 = {
  meta: {
    title: '404',
    description: 'Page not found',
  },
  og: {
    headline: 'Wrong Path',
    title: '404',
    description: 'Page Not Found',
    link: '/not-found.png',
  },
}

export const homePage = {
  hero: {
    greeting: 'Welcome! I\'m',
    name: baseData.me.name,
    roles: ['Software Developer', 'Engineering Leader', 'Founder', 'Game Systems Architect'],
    tagline: 'I build production-ready web platforms, game systems, automation tools, and AI-assisted workflows — from early product ideas to shipped systems used by real people.',
    // Evidence, not another claim. Everything here is already stated on /about.
    // Deliberately NOT the numbers from data/mentorship.ts (`50+ placed`,
    // `~10 wks median`) — those are mentorship-specific and would be false as
    // general facts about the work.
    // Kept short on purpose: five items wrapped to four mono lines at 375px,
    // which reads as a paragraph rather than a row of facts. The full history
    // is on /about, which the secondary CTA points at.
    proof: ['15+ years in production', 'Gaijin', 'Wargaming', 'VKontakte'],
    // Primary points at the commercial offer: it's what the page leads with.
    // Secondary keeps /about — it's the recruiter's next click and the only
    // route to the experience and shipped work. The blog has the nav and its
    // own section below.
    ctaPrimary: { label: 'Work with me', href: '/services' },
    ctaSecondary: { label: 'About me', href: '/about' },
    status: 'Open to new projects',
  },
  meta: {
    title: 'Andrei Rovnyi — Mentorship, Consulting & Engineering Help',
    description: 'Work with Andrei Rovnyi: one-on-one IT mentorship paid after you are hired, product and engineering consulting, and part-time engineering help for your team. Plus an engineering blog and free developer tools.',
  },
  og: {
    headline: 'Greetings 👋',
    title: navbarData.homeTitle,
    description: 'Engineering blog and practical web tools, including QR Code Generator.',
    link: '/open_graph/og_image_default.png',
  },
}

export const blogsPage = {
  content: {
    title: 'All Blogs',
    description: 'Here, you\'ll find all the blog posts I\'ve written and shared on this site.',
  },
  meta: {
    title: 'Blogs',
    description: 'Here you will find all the blog posts I have written & published on this site.',
  },
  og: {
    headline: 'Greetings 👋',
    title: 'Blogs',
    description: 'Articles on game development, full-stack engineering, mobile games, AI music, and automation by Andrei Rovnyi.',
    link: '/open_graph/og_blogs.png',
  },
}

export const linksPage = {
  content: {
    title: 'Links',
    description: 'Discover helpful resources for learning, tools, and personal growth. We\'ve curated links to platforms, articles, and services to support your productivity and success.',
  },
  meta: {
    title: 'Links',
    description: 'Discover helpful resources for learning, tools, and personal growth. We\'ve curated links to platforms, articles, and services to support your productivity and success.',
  },
  og: {
    headline: 'Greetings 👋',
    title: 'Links',
    description: 'Curated resources for software development, game engines, AI tools, and learning platforms.',
    link: '/open_graph/pages/links.png',
  },
}

// Commercial offerings live in `OFFERINGS` (data/offerings.ts); long-form
// landing copy lives in its own module (data/mentorship.ts). Only nav + SEO
// copy belongs here, same as every other page blob in this file.
export const servicesPage = {
  content: {
    eyebrow: 'Working together',
    title: 'Services',
    lede: 'Ways to work with me directly — all of them starting with a conversation rather than a checkout. I do this alongside a full-time engineering job, so I take on a small number of things at a time, and say no to the rest quickly.',
    facts: ['Reply within 24 h', 'Telegram or email', 'Remote, any time zone'],
    pickNote: 'Not sure which one? Describe the situation below and I\'ll tell you which of these it is — or that it\'s none of them.',
  },
  meta: {
    title: 'Services',
    description: 'Work directly with Andrei Rovnyi: one-on-one IT mentorship paid only after you are hired, product and engineering consulting, and part-time engineering support for your team.',
  },
  og: {
    headline: 'Services',
    title: 'Working together',
    description: 'IT mentorship paid after you are hired, product and engineering consulting, and part-time engineering support for teams.',
    link: '/open_graph/og_image_default.png',
  },
}

export const mentorshipPage = {
  meta: {
    title: 'Mentorship & Job Placement in IT',
    description: 'One-on-one mentorship to your first IT job offer: a personal plan, weekly calls, mock interviews, and referrals. Nothing upfront — you pay 20% of your gross salary for six months after you start work, and nothing at all if you never get an offer.',
  },
  og: {
    headline: 'Mentorship',
    title: 'Until you have an offer',
    description: '0 upfront. 20% of your gross salary for six months after you start work. No offer, no payment.',
    link: '/open_graph/og_image_default.png',
  },
}

export const categoryPage = {
  title: 'Categories',
  description: 'Below, you\'ll find this category, which is generated from all the tags mentioned across various blog posts.',
}

export const socialNetworks = [
  {
    href: 'https://www.linkedin.com/in/Rovniy/',
    icon: 'fa:linkedin',
    name: 'LinkedIn',
  },
  {
    href: 'https://t.me/xploitravy',
    icon: 'fa:telegram',
    name: 'Telegram',
  },
  {
    href: 'https://x.com/xploitravy',
    icon: 'fa:twitter',
    name: 'Twitter',
  },
  {
    href: 'https://www.instagram.com/ravygo',
    icon: 'fa:instagram',
    name: 'Instagram',
  },
  {
    href: 'https://github.com/Rovniy',
    icon: 'fa:github',
    name: 'Github',
  },
  {
    href: `mailto:${baseData.me.email}`,
    icon: 'mdi:mail-outline',
    name: 'Email',
  },
]

// Contacts page (/contacts) business-card links. Items with `href` render as
// links; items without `href` render as copy-to-clipboard rows (for networks
// like WeChat that have no profile URLs). Entries whose `handle` or `href`
// still contain 'TODO' are hidden on the page until filled in.
// `brand` is the network's brand color (drives the card accent);
// `brandGradient` overrides the icon chip background for gradient logos.
export interface ContactLink {
  name: string
  icon: string
  handle: string
  href?: string
  method: string
  brand: string
  brandGradient?: string
}

export const contactLinks: ContactLink[] = [
  {
    name: 'LinkedIn',
    icon: 'fa:linkedin',
    handle: 'in/Rovniy',
    href: 'https://www.linkedin.com/in/Rovniy/',
    method: 'linkedin',
    brand: '#0A66C2',
  },
  {
    name: 'Instagram',
    icon: 'fa:instagram',
    handle: '@ravygo',
    href: 'https://www.instagram.com/ravygo',
    method: 'instagram',
    brand: '#D62976',
    brandGradient: 'linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)',
  },
  {
    name: 'Email',
    icon: 'mdi:mail-outline',
    handle: baseData.me.email,
    href: `mailto:${baseData.me.email}`,
    method: 'email',
    brand: '#EA4335',
  },
  {
    name: 'Telegram',
    icon: 'fa:telegram',
    handle: '@xploitravy',
    href: 'https://t.me/xploitravy',
    method: 'telegram',
    brand: '#26A5E4',
  },
  {
    name: 'WhatsApp',
    icon: 'bi:whatsapp',
    handle: '+971585503210',
    href: 'https://wa.me/971585503210',
    method: 'whatsapp',
    brand: '#25D366',
  },
  {
    name: 'Zalo',
    icon: 'simple-icons:zalo',
    handle: '84888189407',
    href: 'https://zalo.me/84888189407',
    method: 'zalo',
    brand: '#0068FF',
  },
  {
    name: 'WeChat',
    icon: 'bi:wechat',
    handle: 'xploitravy',
    method: 'wechat',
    brand: '#07C160',
  },
  {
    name: 'Discord',
    icon: 'bi:discord',
    handle: '273147095337140227',
    href: 'https://discordapp.com/users/273147095337140227/',
    method: 'discord',
    brand: '#5865F2',
  },
  {
    name: 'Steam',
    icon: 'fa:steam',
    handle: 'TODO',
    href: 'https://steamcommunity.com/id/xploit-gaming/',
    method: 'steam',
    brand: '#66C0F4',
    brandGradient: 'linear-gradient(135deg, #66C0F4, #1B2838)',
  },
  {
    name: 'YouTube',
    icon: 'fa:youtube-play',
    handle: 'TODO',
    href: 'https://www.youtube.com/@xploit-games',
    method: 'youtube',
    brand: '#FF0000',
  },
  {
    name: 'GitHub',
    icon: 'fa:github',
    handle: '@Rovniy',
    href: 'https://github.com/Rovniy',
    method: 'github',
    brand: '#24292F',
    brandGradient: 'linear-gradient(135deg, #57606A, #24292F)',
  },
  {
    name: 'X (Twitter)',
    icon: 'fa:twitter',
    handle: '@xploitravy',
    href: 'https://x.com/xploitravy',
    method: 'twitter',
    brand: '#1D9BF0',
  },
]

export const contactsPage = {
  content: {
    title: baseData.me.name,
    description: 'Software Developer · Engineering Manager · Founder',
  },
  meta: {
    title: 'Contacts — Andrei Rovnyi',
    description: 'All the ways to reach Andrei Rovnyi: LinkedIn, Telegram, Instagram, email, and other social networks and messengers.',
  },
  og: {
    headline: 'Contacts',
    title: navbarData.homeTitle,
    description: 'All the ways to reach Andrei Rovnyi — social networks, messengers, and email.',
    link: '/open_graph/og_image_default.png',
  },
}

export const categoriesPage = {
  content: {},
  meta: {
    title: 'Categories',
    description: 'Below All the topics are listed on which either I have written a blog or will write a blog in near future.',
  },
  og: {
    headline: 'Greetings 👋',
    title: 'Categories',
    description: 'Below All the topics are listed on which either I have written a blog or will write a blog in near future.',
    image: '/open_graph/og_categories.png',
  },
}

export const aboutPage = {
  content: {
    title: baseData.me.name,
    description: 'Software Developer · Engineering Manager · Founder',
    aboutMe: 'I\'m a software developer, engineering manager, and founder with 15 years of experience building web platforms, game systems, real-time services, and digital products. Currently an Engineering Manager at Gaijin Entertainment and founder of the game studio XPLOIT — turning rough ideas into systems people can actually use.',
  },
  meta: {
    title: 'About Andrei Rovnyi — Software Developer, Engineering Manager, Founder',
    description: 'Andrei Rovnyi is a software developer, engineering manager, and founder with 15 years of experience — from World of Tanks and War Thunder Mobile to his own game studio XPLOIT, real-time platforms, and AI-powered tools.',
  },
  og: {
    headline: 'About',
    title: navbarData.homeTitle,
    description: 'Software developer, engineering manager, and founder with 15 years building web products, game systems, real-time platforms, and AI-powered tools.',
    link: '/open_graph/og_image_default.png',
  },
}

export const seoData = {
  theme: 'Gamedev',
  author: baseData.me.name,
  description: 'Andrei Rovnyi — software developer and engineering manager with 15 years building web platforms, game systems, and automation tools.',
  ogTitle: 'Personal blog by Andrei Rovnyi',
  twitterDescription: 'Andrei Rovnyi — software developer and engineering manager with 15 years building web platforms, game systems, and automation tools.',
  image: `${baseData.site.url}/og-image.webp`,
  mySite: baseData.site.url,
  twitterHandle: '@xploitravy',
  mailAddress: baseData.me.email,
  locale: 'en_US',
  ogImageWidth: 1200,
  ogImageHeight: 750,
}

export const siteMetaData = [
  { name: 'description', content: seoData.description },
  { property: 'og:site_name', content: seoData.author },
  { property: 'og:type', content: 'website' },
  { property: 'og:url', content: seoData.mySite },
  { property: 'og:title', content: seoData.ogTitle },
  { property: 'og:description', content: seoData.description },
  { property: 'og:image', content: seoData.image },
  { property: 'og:image:alt', content: seoData.description },
  { property: 'og:image:width', content: seoData.ogImageWidth },
  { property: 'og:image:height', content: seoData.ogImageHeight },
  { property: 'og:locale', content: seoData.locale },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:site', content: seoData.twitterHandle },
  { name: 'twitter:url', content: seoData.mySite },
  { name: 'twitter:title', content: seoData.ogTitle },
  { name: 'twitter:description', content: seoData.twitterDescription },
  { name: 'twitter:image', content: seoData.image },
]
