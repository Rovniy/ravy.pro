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
]

export const navbarData = {
  homeTitle: baseData.me.name,
}

export const footerData = {
  author: baseData.me.name,
  aboutAuthor: 'Hello! I\'m Andrei, a technology enthusiast, problem solver, and software developer. Currently employed at Gaijin.net.',
  authorTitle: 'Get in Touch',
  authorInterest: 'As a Founder, Inventor, and Creator, I have solid experience with Software Development. If you have an exciting idea, whether it\'s open source or a paid project, let\'s connect!',
  aboutTheSite: 'This is the personal blog of Andrei Rovnyi. Feel free to contact me with any questions you may have.',
  copyright: `© 2020-${currentYear} XPLOIT LLC. All trademarks, names and logos belong to their respective copyright holders.`,
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
    description: 'Get News, Software Development, Related Articles, Tips, Learning resources and more.',
  },
  meta: {
    title: 'Home',
    description: 'Andrei Rovnyi, Software Engineer with over 12+ years experience in software development.',
  },
  og: {
    headline: 'Greetings 👋',
    title: navbarData.homeTitle,
    description: 'Join me on a journey to build craft seamless digital experiences together!',
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
    description: 'Here you will find all the blog posts I have written & published on this site.',
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
    description: 'Discover helpful resources for learning, tools, and personal growth. We\'ve curated links to platforms, articles, and services to support your productivity and success.',
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
    description: 'Founder. Inventor. Creator.',
    aboutMe: 'Hello, fellow human! I\'m Andrei Rovnyi, a software sorcerer with over 13 years of experience, leading teams and building robust systems.<br/><br/>Currently, I wield my code powers as a full-stack developer at Gaijin Entertainment, helping launch massive games like War Thunder, Crossout and each other while also development Web-apps. When I\'m not leading the charge in the digital battlefield, I’m crafting game mechanics or experimenting with new tech.<br/><br/>I won\'t cast love spells, but if you\'re looking for someone to magically optimize systems or create game-changing solutions, I\'m your wizard!',
  },
  meta: {
    title: 'About',
    description: footerData.aboutAuthor,
  },
  og: {
    headline: 'Greetings 👋',
    title: navbarData.homeTitle,
    description: 'Join me on a journey to build craft seamless digital experiences together!',
    link: '/open_graph/og_image_default.png',
  },
}

export const seoData = {
  theme: 'Gamedev',
  author: baseData.me.name,
  description: 'Andrei Rovnyi, Software Engineer with over 12+ years experience in software development.',
  ogTitle: 'Personal blog by Andrei Rovnyi',
  twitterDescription: 'Andrei Rovnyi, Software Engineer with over 12+ years experience in software development.',
  image: `${baseData.site.url}/blog-cover/10012.account-deletion-for-tiny-boo.webp`,
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
