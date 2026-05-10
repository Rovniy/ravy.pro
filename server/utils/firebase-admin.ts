import type { App } from 'firebase-admin/app'
import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let cachedApp: App | null = null

function getAdminApp(): App {
  if (cachedApp) return cachedApp
  const existing = getApps()[0]
  cachedApp = existing ?? initializeApp()
  return cachedApp
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getDb(): Firestore {
  return getFirestore(getAdminApp())
}

export const SHORTLINKS_COLLECTION = 'shortlinks'
