export default defineNuxtRouteMiddleware((to, _) => {
  interface IRedirects {
    [key: string]: string
  }

  const redirects: IRedirects = {
    '/projects/tabs-broadcast/': '/blogs/tabs-broadcast',
    '/projects/boo-stories/': '/categories/tiny-boo',
    '/boo-stories-privacy-policy/': '/docs/tiny-boo-privacy-policy',
    '/qr-code': '/tools/qr-code-generator',
    '/qr-code/': '/tools/qr-code-generator',
  }

  // Legacy URLs moved permanently — 301 transfers their link equity to the
  // new location (navigateTo defaults to a temporary 302 during SSR).
  if (redirects[to.path])
    return navigateTo(redirects[to.path], { redirectCode: 301 })
})
