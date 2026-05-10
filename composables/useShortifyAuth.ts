import type { Auth, User } from 'firebase/auth'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { useNuxtApp, useState } from 'nuxt/app'
import { onMounted } from 'vue'

interface AuthState {
  user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null } | null
  ready: boolean
}

let listenerAttached = false

export function useShortifyAuth() {
  const state = useState<AuthState>('shortify-auth', () => ({ user: null, ready: false }))
  const { $firebaseAuth } = useNuxtApp()
  const auth = $firebaseAuth as Auth | undefined

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
    signIn,
    signOut: signOutUser,
    getIdToken,
  }
}
