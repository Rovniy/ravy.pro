/*
 * Presentation micro-FX directives. Registered universally (not .client) so
 * SSR can render elements carrying the directives; both are visual no-ops on
 * the server via getSSRProps, and progressive enhancements on the client:
 *
 * - v-reveal[="delayMs"] — scroll-triggered entrance. Adds `.reveal` (hidden
 *   state, see tailwind.css) only after confirming motion is allowed, then
 *   flips to `.is-revealed` when the element scrolls into view. Content is
 *   never hidden for SSR/no-JS/reduced-motion users.
 * - v-spotlight — cursor-tracking radial highlight on card surfaces. Feeds
 *   --spot-x/--spot-y consumed by `.spotlight::after`. Skipped entirely on
 *   touch/coarse-pointer devices.
 */

interface SpotlightEl extends HTMLElement {
  __spotlightCleanup?: () => void
}

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

  nuxtApp.vueApp.directive('spotlight', {
    getSSRProps: () => ({}),
    mounted(el: SpotlightEl) {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
        return
      el.classList.add('spotlight')
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
        el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
      }
      el.addEventListener('mousemove', onMove, { passive: true })
      el.__spotlightCleanup = () => el.removeEventListener('mousemove', onMove)
    },
    unmounted(el: SpotlightEl) {
      el.__spotlightCleanup?.()
    },
  })
})
