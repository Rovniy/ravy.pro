import { useAuth } from '~/composables/useAuth'

// Shared Bearer-token fetch with a single force-refresh retry on 401. Extracted
// from the duplicated helpers in useShortify / account.vue.
export function useAuthedFetch() {
  const { getIdToken } = useAuth()

  async function authedFetch<T>(url: string, init: RequestInit = {}, retried = false): Promise<T> {
    const token = await getIdToken(retried)
    if (!token)
      throw new Error('Not authenticated')

    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    if (init.body && !headers.has('Content-Type'))
      headers.set('Content-Type', 'application/json')

    const res = await fetch(url, { ...init, headers })
    if (res.status === 401 && !retried)
      return authedFetch<T>(url, init, true)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json() as Promise<T>
  }

  return { authedFetch }
}
