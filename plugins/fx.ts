/*
 * Presentation FX directive. Registered universally (not .client) so
 * SSR can render elements carrying it; it is a visual no-op on
 * the server via getSSRProps, and progressive enhancements on the client:
 *
 * - v-reveal[="delayMs"] — scroll-triggered section wipe. Adds `.reveal`
 *   (clipped state, see tailwind.css) only after confirming motion is allowed,
 *   then flips to `.is-revealed` when the element scrolls into view. Content
 *   is never hidden for SSR/no-JS/reduced-motion users. Sections only, not
 *   individual cards.
 */

export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | null = null

  function revealObserver() {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer!.unobserve(entry.target)
        }
      }
    }, { rootMargin: '0px 0px -48px 0px' })
    return observer
  }

  nuxtApp.vueApp.directive('reveal', {
    getSSRProps: () => ({}),
    mounted(el: HTMLElement, binding) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        return
      if (typeof binding.value === 'number' && binding.value > 0)
        el.style.setProperty('--reveal-delay', `${binding.value}ms`)
      el.classList.add('reveal')
      revealObserver().observe(el)
    },
    unmounted(el: HTMLElement) {
      observer?.unobserve(el)
    },
  })
})
