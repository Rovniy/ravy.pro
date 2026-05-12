import type { Auth, User } from 'firebase/auth'
import { useNuxtApp, useRuntimeConfig, useState } from 'nuxt/app'
import { computed, onMounted } from 'vue'

interface AuthState {
  user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null } | null
  ready: boolean
}

let listenerAttached = false
let authRef: Auth | null = null

export function useAuth() {
  const state = useState<AuthState>('auth', () => ({ user: null, ready: false }))
  const { $ensureFirebase } = useNuxtApp() as unknown as {
    $ensureFirebase?: () => Promise<{ auth: Auth } | null>
  }

  const config = useRuntimeConfig()
  const adminEmail = ((config.public.adminEmail as string) ?? '').toLowerCase()

  const isAuthed = computed(() => !!state.value.user)
  const isAdmin = computed(() => {
    const email = state.value.user?.email?.toLowerCase() ?? ''
    return !!adminEmail && email === adminEmail
  })

  onMounted(async () => {
    if (listenerAttached || !$ensureFirebase)
      return
    const fb = await $ensureFirebase()
    if (!fb) {
      state.value.ready = true
      return
    }
    authRef = fb.auth
    listenerAttached = true
    const { onAuthStateChanged } = await import('firebase/auth')
    onAuthStateChanged(authRef, (user: User | null) => {
      state.value.user = user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }
        : null
      state.value.ready = true
    })
  })

  async function signIn() {
    if (!$ensureFirebase)
      throw new Error('Firebase auth is not available')
    const fb = await $ensureFirebase()
    if (!fb)
      throw new Error('Firebase auth is not initialized')
    // Popup-flow: Firebase recommends this as the primary sign-in path on web.
    // `signInWithRedirect` is broken in modern browsers (Chrome 115+ storage
    // partitioning, Safari ITP) unless `__/auth/handler` is hosted on this
    // same origin, which Firebase App Hosting doesn't proxy out of the box.
    // The Chromium "Cross-Origin-Opener-Policy would block window.close"
    // console warning the popup emits is a known benign diagnostic — auth
    // completes correctly. See firebase/firebase-js-sdk#7600.
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(fb.auth, provider)
  }

  async function signOutUser() {
    if (!authRef)
      return
    const { signOut } = await import('firebase/auth')
    await signOut(authRef)
  }

  async function getIdToken(forceRefresh = false): Promise<string | null> {
    if (!authRef?.currentUser)
      return null
    return authRef.currentUser.getIdToken(forceRefresh)
  }

  return {
    state,
    isAuthed,
    isAdmin,
    signIn,
    signOut: signOutUser,
    getIdToken,
  }
}
