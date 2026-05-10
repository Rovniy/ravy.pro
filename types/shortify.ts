export interface ShortLink {
  code: string
  url: string
  clicks: number
  createdAt: string | null
  lastClickedAt: string | null
}
