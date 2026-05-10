import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const fb = config.public.firebase as {
    apiKey: string
    authDomain: string
    projectId: string
    appId: string
  }

  if (!fb.apiKey || !fb.projectId) {
    return {}
  }

  const app = getApps().length ? getApp() : initializeApp(fb)
  const auth = getAuth(app)

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
    },
  }
})
