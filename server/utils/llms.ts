// Shared pieces of /llms.txt and /llms-full.txt, so the two can never disagree
// about who this site is or what it offers.
//
// This replaces a hand-maintained public/llms.txt. That file had no generator, so
// it listed none of the 31 posts, omitted two of the four docs, and drifted from
// `publicServices` / `OFFERINGS` every time a tool or service was added.
import { baseData, publicServices, seoData, toolsPage } from '~/data'
import { TINY_BOO_MOVIE } from '~/data/animation'
import { gamePath, gamePressPath, GAMES } from '~/data/games'
import { MUSIC_PROJECTS, musicPath } from '~/data/music'
import { OFFERINGS } from '~/data/offerings'
import { STATUS_LABEL } from '~/data/projects'

const SITE = baseData.site.url

export function abs(path: string): string {
  return path.startsWith('http') ? path : `${SITE}${path}`
}

/**
 * Rewrites root-relative markdown link and image targets to absolute URLs.
 *
 * /llms-full.txt is read far away from this origin, where `](/tools/x)` resolves
 * against whatever host the reader happens to be on. The old minimark renderer
 * did this while walking the AST; serving stored markdown means doing it here.
 */
export function absolutizeMarkdown(markdown: string): string {
  return markdown.replace(/(!?\[[^\]]*\]\()(\/[^)\s]*)/g, (_match, prefix, path) => `${prefix}${SITE}${path}`)
}

/** H1 + blockquote summary + the free-form section, per the llmstxt.org shape. */
export function llmsHeader(): string {
  return `# ${baseData.me.name} / Ravy.pro

> Personal site of ${baseData.me.name} (also known as ${baseData.me.nick}): an engineering blog, free browser-based developer tools, paid mentorship, consulting, and engineering services, and his creative work: indie games, AI music, and an AI-animated series. Content is in English except where a post is marked otherwise.

Preferred description of the author: ${baseData.me.name} is a software engineer, engineering leader, and founder building web platforms, game systems, automation tools, and AI-assisted products. He founded the indie game studio XPLOIT and makes AI music as Zynthar and Diva Rogue.

Recurring topics: software engineering; web development; Vue, Nuxt and TypeScript; game development; Unity and C#; mobile games; automation workflows; AI-assisted tools; AI music and animation; technical product development; founder notes.

On AI work: the music projects Zynthar and Diva Rogue and the Tiny Boo Movie series are made with generative AI tools, and this site says so openly. Zynthar's band members and Diva Rogue are fictional characters.

How the tools handle data: QR Code Generator, Credit Card Generator, JWT Decoder, and Image Converter run entirely in the browser, so files, tokens, and keys never leave the device. Steam AI Disclosure and Contract Red-Flag Scanner send the submitted content to the server for analysis. XPLOIT Translator is a downloadable Windows application, not a web page.`
}

export function llmsMainPages(): string {
  return `## Main pages

- [Home](${abs('/')}): overview of the services, tools, projects, and recent writing.
- [About](${abs('/about')}): background, 15 years of work history, shipped projects, and technical stack.
- [Blog](${abs('/blogs')}): all posts on engineering, game tech, automation, and AI-assisted workflows.
- [Today I Learned](${abs('/til')}): short technical notes, one problem and its fix each.
- [Tools](${abs('/tools')}): ${toolsPage.og.description}
- [Categories](${abs('/categories')}): posts grouped by topic.
- [Services](${abs('/services')}): paid, human-delivered offerings — mentorship, consulting, and part-time engineering help.
- [Projects](${abs('/projects')}): games, music and animation, with store and streaming links.
- [Games](${abs('/games')}): every XPLOIT game with trailers, screenshots and store links.
- [Music](${abs('/music')}): the AI music projects Zynthar and Diva Rogue, with the full discography.
- [Links](${abs('/links')}): profiles, projects, and music releases in one place.
- [Contacts](${abs('/contacts')}): ways to get in touch.`
}

/** Tools, generated from `publicServices` so a new tool appears automatically. */
export function llmsTools(): string {
  const rows = publicServices.map((tool) => {
    const notes = [tool.blurb, tool.meta].filter(Boolean).join(' ')
    const story = tool.story ? ` Write-up: ${abs(tool.story)}.` : ''
    return `- [${tool.name}](${abs(tool.path)}): ${notes}${story}`
  })
  return `## Tools\n\n${rows.join('\n')}`
}

/** Services, generated from `OFFERINGS`. */
export function llmsServices(): string {
  const rows = OFFERINGS.map((offering) => {
    const target = offering.cta.kind === 'page' ? offering.cta.path : '/services'
    const via = offering.cta.kind === 'page' ? '' : ' Enquiries go through the form on the services page.'
    return `- [${offering.name}](${abs(target)}): ${offering.tagline} ${offering.meta}.${via}`
  })
  return `## Services\n\n${rows.join('\n')}\n- [Mentorship payment terms](${abs('/docs/mentorship-terms')}): the full payment agreement for the mentorship program.`
}

/** Games, music and animation, from the registries in data/. */
export function llmsProjects(): string {
  const games = GAMES.map(g => `- [${g.title}](${abs(gamePath(g))}): ${g.tagline} ${STATUS_LABEL[g.status]}. [Press kit](${abs(gamePressPath(g))}).`)
  const music = MUSIC_PROJECTS.map(p => `- [${p.name}](${abs(musicPath(p))}): ${p.tagline} An AI music project written and produced by Andrei.`)
  return `## Projects

- [All projects](${abs('/projects')}): games, music and animation in one place.
- [XPLOIT](https://xploit.games): the independent game studio Andrei founded; every game below is made there.
${games.join('\n')}
${music.join('\n')}
- [${TINY_BOO_MOVIE.title}](${abs(TINY_BOO_MOVIE.path)}): ${TINY_BOO_MOVIE.tagline} An AI-animated YouTube series set in the world of Tiny Boo: Homecoming.
- [tabs-broadcast](https://www.npmjs.com/package/tabs-broadcast): npm library for communication between browser tabs.`
}

export function llmsOptional(docPaths: Array<{ path: string, title: string }>): string {
  const docs = docPaths.map(d => `- [${d.title}](${abs(d.path)}): site policy document.`)
  return `## Optional

- [Full text of every post](${abs('/llms-full.txt')}): this site's articles as one Markdown file.
- [RSS feed](${abs('/rss.xml')}): full-text feed of blog posts.
- [TIL RSS feed](${abs('/til/rss.xml')}): full-text feed of the short notes.
- [Sitemap](${abs('/sitemap.xml')}): every indexable URL.
- [Curriculum vitae (PDF)](${abs('/misc/andrei_rovnyi_cv.pdf')}): full professional history.
${docs.join('\n')}`
}

export const LLMS_SITE = SITE
export const LLMS_AUTHOR = seoData.author
