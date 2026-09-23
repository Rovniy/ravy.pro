import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// In a production build @nuxt/content hands <ContentRenderer> only the
// components used by files under `content/`, plus global ones. Blog posts live
// in Firestore, so a non-global override there is silently dropped: the page
// then emits a literal <ProsePre> tag and every code block collapses to one
// line. Dev skips that filter, which is why it only ever broke in production.
describe('components/content overrides', () => {
  it('are all registered as global components', () => {
    const dir = fileURLToPath(new URL('../../components/content', import.meta.url))
    const vueFiles = readdirSync(dir).filter(name => name.endsWith('.vue'))

    expect(vueFiles.length).toBeGreaterThan(0)
    expect(vueFiles.filter(name => !name.endsWith('.global.vue'))).toEqual([])
  })
})
