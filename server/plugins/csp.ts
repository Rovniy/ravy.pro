import { createHash } from 'node:crypto'

// Match <script>...</script> with no `src=` attribute — only inline bodies
// matter for CSP hashing. The lookahead uses `[^>]+` because the assertion
// `\bsrc` requires at least one preceding character for a word boundary; a
// quantifier of 0 would be vacuous and lints as a regex contradiction.
const INLINE_SCRIPT_RX = /<script(?![^>]+\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi

function collectInlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>()
  for (const match of html.matchAll(INLINE_SCRIPT_RX)) {
    const body = match[1]
    if (!body || !body.trim())
      continue
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
  }
  return [...hashes]
}

function buildCsp(scriptHashes: string[]): string {
  // 'strict-dynamic' propagates trust from the hashed inline scripts (GTM
  // bootstrap, Nuxt payload, …) to any scripts they load. 'unsafe-inline' +
  // https: are kept as legacy fallbacks; modern browsers ignore them when
  // hashes are present.
  const scriptSrc = [
    ...scriptHashes,
    `'strict-dynamic'`,
    `'unsafe-inline'`,
    'https:',
  ].join(' ')

  // frame-ancestors / report-uri / sandbox are ignored when CSP is delivered
  // via <meta>, so they live in routeRules HTTP headers (X-Frame-Options) and
  // are intentionally omitted here.
  // Firebase Auth opens an iframe on `<project>.firebaseapp.com/__/auth/iframe`
  // for OAuth flow, and `accounts.google.com` for the Google consent screen.
  // GTM frames itself in some configurations.
  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https: wss:`,
    `frame-src https://www.googletagmanager.com https://*.firebaseapp.com https://accounts.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ')
}

function htmlAttrEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function cspMetaTag(csp: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="${htmlAttrEscape(csp)}">`
}

export default defineNitroPlugin((nitroApp) => {
  // CSP in dev blocks Vite's HMR scripts and eval-based reloading. The
  // routeRules HTTP headers (X-Content-Type-Options etc.) are still active.
  if (import.meta.dev)
    return

  // Runtime SSR: Nuxt assembles head/body fragments; prepend the meta to
  // html.head so it lands inside <head> before any <script>.
  nitroApp.hooks.hook('render:html', (html) => {
    const blob = [
      ...html.head,
      ...html.bodyPrepend,
      ...html.body,
      ...html.bodyAppend,
    ].join('')
    const hashes = collectInlineScriptHashes(blob)
    html.head.unshift(cspMetaTag(buildCsp(hashes)))
  })

  // Prerendered routes: rewrite the final HTML string in place — Node preset
  // doesn't persist route.headers, so the policy has to travel inside the
  // document itself.
  // @ts-expect-error Incorrect type assertion
  nitroApp.hooks.hook('prerender:generate', (route: any) => {
    if (!route.contents || !route.fileName?.endsWith('.html'))
      return
    const hashes = collectInlineScriptHashes(route.contents)
    const meta = cspMetaTag(buildCsp(hashes))
    route.contents = route.contents.replace(
      /<head(\s[^>]*)?>/i,
      (m: any) => `${m}${meta}`,
    )
  })
})
