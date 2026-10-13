/**
 * A small in-memory Firestore for store tests: documents, whole-collection
 * reads, getAll, batches and transactions. Counts document reads so a test can
 * assert what an operation costs, and can be told to fail every call.
 */
export function createFakeFirestore() {
  const docs = new Map<string, Record<string, unknown>>()
  const state = { reads: 0, failing: false }

  function guard() {
    if (state.failing)
      throw new Error('firestore unavailable')
  }
  function snap(path: string) {
    const id = path.split('/').pop()!
    const data = docs.get(path)
    return { id, exists: data !== undefined, data: () => (data ? structuredClone(data) : undefined) }
  }
  function ref(path: string) {
    return {
      path,
      id: path.split('/').pop()!,
      async get() {
        guard()
        state.reads++
        return snap(path)
      },
      async set(data: Record<string, unknown>) {
        guard()
        docs.set(path, structuredClone(data))
      },
      async delete() {
        guard()
        docs.delete(path)
      },
    }
  }

  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ref(`${name}/${id}`),
      async get() {
        guard()
        const all = [...docs.keys()].filter(p => p.startsWith(`${name}/`) && p.split('/').length === 2)
        state.reads += all.length
        return { docs: all.map(snap), size: all.length, empty: !all.length }
      },
    }),
    async getAll(...refs: Array<{ path: string }>) {
      guard()
      state.reads += refs.length
      return refs.map(r => snap(r.path))
    },
    batch() {
      const ops: Array<() => void> = []
      return {
        set: (r: { path: string }, data: Record<string, unknown>) => void ops.push(() => docs.set(r.path, structuredClone(data))),
        delete: (r: { path: string }) => void ops.push(() => docs.delete(r.path)),
        async commit() {
          guard()
          ops.forEach(op => op())
        },
      }
    },
    async runTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
      guard()
      const ops: Array<() => void> = []
      const result = await fn({
        async get(r: { path: string }) {
          state.reads++
          return snap(r.path)
        },
        set: (r: { path: string }, data: Record<string, unknown>) => void ops.push(() => docs.set(r.path, structuredClone(data))),
        delete: (r: { path: string }) => void ops.push(() => docs.delete(r.path)),
      })
      ops.forEach(op => op())
      return result
    },
  }

  return { db, docs, state }
}
