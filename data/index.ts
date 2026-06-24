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

export const navbarData = {
  homeTitle: baseData.me.name,
}

export const adminServices: { name: string, path: string }[] = [
  { name: 'Shortify', path: '/shortify' },
  { name: 'Red-Flag Scanner', path: '/tools/contract-red-flag-scanner' },
]

export const publicServices: { name: string, path: string }[] = [
  { name: 'Steam AI Disclosure', path: '/tools/steam-ai-disclosure' },
  { name: 'QR Code Generator', path: '/tools/qr-code-generator' },
  { name: 'Credit Card Generator', path: '/tools/credit-card-generator' },
  { name: 'JWT Decoder', path: '/tools/jwt-decoder' },
  { name: 'Image Converter', path: '/tools/image-converter' },
]

export const footerData = {
  author: baseData.me.name,
  aboutAuthor: 'Engineering leader, founder, and software developer building web platforms, game systems, and automation tools. 13 years of shipped work — currently at Gaijin.net.',
  authorTitle: 'Get in Touch',
  authorInterest: 'Building an MVP, shipping a game feature, or automating a team workflow? Open source or paid — let\'s talk.',
  aboutTheSite: 'Personal blog of Andrei Rovnyi — notes on engineering, game tech, automation, and the craft of shipping software.',
  copyright: `© 2020-${currentYear} XPLOIT FZE. All trademarks, names and logos belong to their respective copyright holders.`,
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
  content: {
    title: 'Welcome to my personal blog!',
    description: 'Notes on engineering, game development, automation, and the craft of building digital products that ship.',
  },
  hero: {
    greeting: 'Welcome! I\'m',
    name: baseData.me.name,
    roles: ['Software Developer', 'Engineering Leader', 'Founder', 'Game Systems Architect'],
    tagline: 'I build production-ready web platforms, game systems, automation tools, and AI-assisted workflows — from early product ideas to shipped systems used by real people.',
    ctaPrimary: { label: 'Read the Blog', href: '/blogs' },
    ctaSecondary: { label: 'About me', href: '/about' },
    status: 'Open to new projects',
  },
  meta: {
    title: 'Andrei Rovnyi — Blog, Tools, and Engineering Notes',
    description: 'Personal site of Andrei Rovnyi: engineering blog, public tools like QR Code Generator, and software delivery insights from real projects.',
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
    description: 'Software Developer · Engineering Leader · Founder',
    aboutMe: 'I\'m a software developer and engineering leader with 13+ years of experience building web platforms, game-related systems, internal tools, and digital products. I work at the intersection of engineering, product thinking, automation, and creativity — turning rough ideas into systems people can actually use.',
  },
  meta: {
    title: 'About Andrei Rovnyi — Software Developer, Engineering Leader, Founder',
    description: 'Andrei Rovnyi is a software developer, engineering leader, and founder with 13+ years of experience building web products, game systems, automation tools, and digital platforms.',
  },
  og: {
    headline: 'About',
    title: navbarData.homeTitle,
    description: 'Software developer, engineering leader, and founder with 13+ years building web products, game systems, automation tools, and digital platforms.',
    link: '/open_graph/og_image_default.png',
  },
}

export const seoData = {
  theme: 'Gamedev',
  author: baseData.me.name,
  description: 'Andrei Rovnyi — software developer and engineering leader with 13 years building web platforms, game systems, and automation tools.',
  ogTitle: 'Personal blog by Andrei Rovnyi',
  twitterDescription: 'Andrei Rovnyi — software developer and engineering leader with 13 years building web platforms, game systems, and automation tools.',
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
  { property: 'og:site_name', content: seoData.mySite },
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
