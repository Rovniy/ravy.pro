import type { Auth, User } from 'firebase/auth'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { useNuxtApp, useRuntimeConfig, useState } from 'nuxt/app'
import { computed, onMounted } from 'vue'

interface AuthState {
  user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null } | null
  ready: boolean
}

let listenerAttached = false

export function useAuth() {
  const state = useState<AuthState>('auth', () => ({ user: null, ready: false }))
  const { $firebaseAuth } = useNuxtApp()
  const auth = $firebaseAuth as Auth | undefined

  const config = useRuntimeConfig()
  const adminEmail = ((config.public.adminEmail as string) ?? '').toLowerCase()

  const isAuthed = computed(() => !!state.value.user)
  const isAdmin = computed(() => {
    const email = state.value.user?.email?.toLowerCase() ?? ''
    return !!adminEmail && email === adminEmail
  })

  onMounted(() => {
    if (!auth || listenerAttached) return
    listenerAttached = true
    onAuthStateChanged(auth, (user: User | null) => {
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
    if (!auth) throw new Error('Firebase auth is not initialized')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function signOutUser() {
    if (!auth) return
    await signOut(auth)
  }

  async function getIdToken(forceRefresh = false): Promise<string | null> {
    if (!auth?.currentUser) return null
    return auth.currentUser.getIdToken(forceRefresh)
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
