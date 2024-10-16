export interface BlogPost {
  title: string
  date: string
  description: string
  image: string
  alt: string
  ogImage: string
  tags: string[]
  published: boolean
  theme?: string
  publishTime: string
  modifyTime: string
  locale: string
}
