// Stand-in for the `#mdc-highlighter` template Nuxt generates into `.nuxt/`,
// which vitest can't resolve. Returns the code untokenised — the same shape the
// real Shiki highlighter produces, minus the colours.
export default async function highlighter(code: string) {
  return { tree: [{ type: 'text', value: code }], className: '', style: '' }
}
