import { describe, expect, it, vi } from 'vitest'

const initializeAppMock = vi.fn(() => ({ app: 'new-app' }))
const getAppsMock = vi.fn(() => [])
const getAuthMock = vi.fn(() => ({ auth: true }))
const getFirestoreMock = vi.fn(() => ({ db: true }))

vi.mock('firebase-admin/app', () => ({
  getApps: getAppsMock,
  initializeApp: initializeAppMock,
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: getAuthMock,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: getFirestoreMock,
}))

describe('server/utils/firebase-admin', () => {
  it('initializes app once and returns auth/db', async () => {
    const { getAdminAuth, getDb } = await import('~~/server/utils/firebase-admin')
    expect(getAdminAuth()).toEqual({ auth: true })
    expect(getDb()).toEqual({ db: true })
    expect(initializeAppMock).toHaveBeenCalledTimes(1)
  })
})
