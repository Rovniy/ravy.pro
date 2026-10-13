import type { Auth, User } from 'firebase/auth'
import { useNuxtApp, useRuntimeConfig, useState } from 'nuxt/app'
import { computed, onMounted } from 'vue'

interface AuthState {
  user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null } | null
  ready: boolean
}

let attaching: Promise<void> | null = null
let authRef: Auth | null = null

/**
 * Set while someone is signed in on this browser. The Firebase SDK is ~124 KB
 * and almost every visitor is anonymous, so it only loads up front for a
 * browser that has signed in before, or on a page that needs auth (`eager`).
 * Everyone else gets it on the first click of "Sign in".
 */
const SIGNED_IN_HINT = 'ravy:signed-in'

function readHint(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_HINT) === '1'
  }
  catch {
    return false
  }
}

function writeHint(signedIn: boolean) {
  try {
    if (signedIn)
      localStorage.setItem(SIGNED_IN_HINT, '1')
    else
      localStorage.removeItem(SIGNED_IN_HINT)
  }
  catch {}
}

export function useAuth(opts: { eager?: boolean } = {}) {
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

  /** Loads Firebase and subscribes to the auth state, once per page load. */
  function attach(): Promise<void> {
    if (attaching)
      return attaching
    state.value.ready = false
    attaching = (async () => {
      const fb = $ensureFirebase ? await $ensureFirebase() : null
      if (!fb) {
        state.value.ready = true
        return
      }
      authRef = fb.auth
      const { onAuthStateChanged } = await import('firebase/auth')
      await new Promise<void>((resolve) => {
        onAuthStateChanged(authRef!, (user: User | null) => {
          state.value.user = user
            ? {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              }
            : null
          state.value.ready = true
          writeHint(!!user)
          resolve()
        })
      })
    })()
    return attaching
  }

  onMounted(() => {
    if (opts.eager || readHint())
      void attach()
    else if (!attaching)
      state.value.ready = true
  })

  async function signIn() {
    if (!$ensureFirebase)
      throw new Error('Firebase auth is not available')
    await attach()
    if (!authRef)
      throw new Error('Firebase auth is not initialized')
    // Signed in already, just not loaded yet on this page (no hint, e.g. the
    // first visit after this change shipped): no popup needed.
    if (authRef.currentUser)
      return
    // Popup-flow: Firebase recommends this as the primary sign-in path on web.
    // `signInWithRedirect` is broken in modern browsers (Chrome 115+ storage
    // partitioning, Safari ITP) unless `__/auth/handler` is hosted on this
    // same origin, which Firebase App Hosting doesn't proxy out of the box.
    // The Chromium "Cross-Origin-Opener-Policy would block window.close"
    // console warning the popup emits is a known benign diagnostic — auth
    // completes correctly. See firebase/firebase-js-sdk#7600.
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(authRef, provider)
  }

  async function signOutUser() {
    if (!authRef)
      return
    const { signOut } = await import('firebase/auth')
    await signOut(authRef)
  }

  async function getIdToken(forceRefresh = false): Promise<string | null> {
    // A call right after mount must not lose the race with the SDK loading.
    if (attaching)
      await attaching
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
