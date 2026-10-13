// Topics of the TIL notes at /til. A closed list, like BlogPostTag, because
// each topic is also a hub page (/til/topic/<id>) with its own copy: a hub is
// what search engines rank once it holds a few dozen notes, and a templated
// "all notes about X" description would read as thin content.
//
// `category` links a hub to the blog category that covers the same ground,
// so a reader who liked the short version finds the long one.

export interface TilTopic {
  id: string
  name: string
  /** Hub page intro and meta description. Unique per topic, 120–200 characters. */
  description: string
  /** Matching /categories/<tag>, when there is one. */
  category?: string
  /** For the ready-made LinkedIn and X posts, without the #. */
  hashtags: string[]
}

export const TIL_TOPICS: TilTopic[] = [
  {
    id: 'unity',
    name: 'Unity',
    description: 'Short notes from shipping Unity games: build pipelines, editor scripting, performance traps, rendering and the C# details the docs leave out.',
    category: 'games',
    hashtags: ['Unity', 'GameDev', 'CSharp'],
  },
  {
    id: 'gamedev',
    name: 'Game development',
    description: 'Small, practical lessons from making and releasing indie games: design, store pages, platform rules, live operations and the business side.',
    category: 'games',
    hashtags: ['GameDev', 'IndieDev'],
  },
  {
    id: 'ai',
    name: 'AI engineering',
    description: 'Notes on building with language models: Claude Code, MCP servers, agents, prompts that hold up in production and the costs nobody mentions.',
    category: 'ai',
    hashtags: ['AI', 'LLM', 'ClaudeCode'],
  },
  {
    id: 'web',
    name: 'Web development',
    description: 'Vue, Nuxt, TypeScript and the browser platform: fixes, configuration details and patterns found while building real web products.',
    category: 'dev',
    hashtags: ['WebDev', 'Vue', 'Nuxt'],
  },
  {
    id: 'devops',
    name: 'DevOps and tooling',
    description: 'CI, hosting, Firebase, Git and the command line: the one-line fixes and settings that save an afternoon the next time.',
    category: 'dev',
    hashtags: ['DevOps', 'Firebase'],
  },
  {
    id: 'leadership',
    name: 'Engineering leadership',
    description: 'Lessons from leading engineering teams and running a studio: hiring, planning, reviews, processes and decisions a CTO actually makes.',
    hashtags: ['EngineeringLeadership', 'CTO'],
  },
]

export const TIL_TOPIC_IDS = TIL_TOPICS.map(t => t.id)

export function tilTopic(id: string): TilTopic | undefined {
  return TIL_TOPICS.find(t => t.id === id)
}

export function tilTopicPath(id: string): string {
  return `/til/topic/${id}`
}

/** Copy for /til itself. */
export const tilPage = {
  title: 'Today I Learned',
  description: 'Short technical notes by Andrei Rovnyi: one problem and its fix per note, from Unity and game development to AI engineering, web platforms and leading teams.',
  intro: 'One problem and the fix, a few lines each. Things I ran into while building games, web products and AI tools, written down so the next person searching for them finds an answer.',
}
