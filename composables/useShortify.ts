import type { ShortLink } from '~/types/shortify'
import { useAuth } from './useAuth'

export function useShortify() {
  const { getIdToken } = useAuth()

  async function authedFetch<T>(url: string, init: RequestInit = {}, retried = false): Promise<T> {
    const token = await getIdToken(retried)
    if (!token)
      throw new Error('Not authenticated')

    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(url, { ...init, headers })
    if (res.status === 401 && !retried) {
      return authedFetch<T>(url, init, true)
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json() as Promise<T>
  }

  function listLinks(): Promise<ShortLink[]> {
    return authedFetch<ShortLink[]>('/api/shortify/links')
  }

  function createLink(url: string): Promise<ShortLink> {
    return authedFetch<ShortLink>('/api/shortify/links', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }

  return { listLinks, createLink }
}
