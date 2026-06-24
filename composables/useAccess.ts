import type { AccessSummary } from '~/types/access'
import { useState } from 'nuxt/app'
import { computed, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useAuthedFetch } from '~/composables/useAuthedFetch'
import { GATED_TOOLS } from '~/data/services'

// Dedup concurrent refreshes across the many components that call useAccess.
let inflight: Promise<void> | null = null

// Reactive view of the signed-in user's gated-tool access. Drives the header
// Services menu and in-page gating. Server still enforces every call.
export function useAccess() {
  const { state, isAuthed } = useAuth()
  const { authedFetch } = useAuthedFetch()

  const access = useState<AccessSummary>('tool-access', () => ({ isAdmin: false, tools: [] }))
  const loadedUid = useState<string | null | undefined>('tool-access-uid', () => undefined)
  const ready = useState<boolean>('tool-access-ready', () => false)

  async function refresh(force = false): Promise<void> {
    if (!import.meta.client)
      return
    const uid = state.value.user?.uid ?? null
    if (!force && loadedUid.value === uid)
      return
    if (inflight)
      return inflight

    inflight = (async () => {
      if (!isAuthed.value) {
        access.value = { isAdmin: false, tools: [] }
      }
      else {
        try {
          access.value = await authedFetch<AccessSummary>('/api/account/access')
        }
        catch {
          access.value = { isAdmin: false, tools: [] }
        }
      }
      loadedUid.value = uid
      ready.value = true
    })().finally(() => {
      inflight = null
    })

    return inflight
  }

  const isAdmin = computed(() => access.value.isAdmin)
  const tools = computed(() => access.value.tools)
  function hasTool(key: string): boolean {
    return access.value.isAdmin || access.value.tools.includes(key)
  }
  const accessibleServices = computed(() => GATED_TOOLS.filter(t => hasTool(t.key)))

  // Refresh whenever auth becomes ready or the user changes.
  watch(
    () => [state.value.ready, state.value.user?.uid],
    () => {
      if (state.value.ready)
        void refresh()
    },
    { immediate: true },
  )

  return { access, ready, isAdmin, tools, hasTool, accessibleServices, refresh }
}
