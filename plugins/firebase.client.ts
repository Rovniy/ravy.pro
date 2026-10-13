import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'

// Firebase SDK (~40-60 KB gzip) is dynamic-imported on first call so it
// stays out of the initial chunk. `useAuth` decides when that is: on mount for
// a browser that has signed in before or a page that needs auth, otherwise on
// the first click of "Sign in" — so an anonymous visitor never downloads it.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const fb = config.public.firebase as {
    apiKey: string
    authDomain: string
    projectId: string
    appId: string
  }

  let cached: Promise<{ app: FirebaseApp, auth: Auth } | null> | null = null

  const ensureFirebase = (): Promise<{ app: FirebaseApp, auth: Auth } | null> => {
    if (!fb.apiKey || !fb.projectId)
      return Promise.resolve(null)
    if (cached)
      return cached
    cached = (async () => {
      const [{ getApp, getApps, initializeApp }, { getAuth }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ])
      const app = getApps().length ? getApp() : initializeApp(fb)
      const auth = getAuth(app)
      return { app, auth }
    })()
    return cached
  }

  return {
    provide: {
      ensureFirebase,
    },
  }
})
