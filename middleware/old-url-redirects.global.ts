export default defineNuxtRouteMiddleware((to, _) => {
  const redirects = {
    '/projects/tabs-broadcast/': '/blogs/tabs-broadcast',
    '/projects/boo-stories/': '/categories/tinyboo',
  }

  // Проверяем, нужно ли делать редирект
  if (redirects[to.path])
    return navigateTo(redirects[to.path])
})
