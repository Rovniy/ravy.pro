// `#mdc-highlighter` is a template @nuxtjs/mdc writes into `.nuxt/` and aliases
// for Nitro, but ships no type declaration for it.
declare module '#mdc-highlighter' {
  import type { Highlighter } from '@nuxtjs/mdc'

  const highlighter: Highlighter
  export default highlighter
}
