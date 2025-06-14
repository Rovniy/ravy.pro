export interface BlogPost {
  _path?: string
  title: string
  description: string
  image: string
  alt: string
  ogImage: string
  tags: string[]
  published: boolean
  theme?: string
  createdAt: string
  lastUpdated?: string
  locale: string
}
