import type { Directive } from 'vue'

interface RevealOptions {
  delay?: number
  threshold?: number
}

const observers = new WeakMap<Element, IntersectionObserver>()

/**
 * Lightweight scroll-reveal directive. Elements fade/slide in once when they
 * enter the viewport. Respects `prefers-reduced-motion`.
 */
export const reveal: Directive<HTMLElement, RevealOptions | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal')

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.classList.add('is-visible')
      return
    }

    if (binding.value?.delay) {
      el.style.transitionDelay = `${binding.value.delay}ms`
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        el.classList.add('is-visible')
        observer.disconnect()
        observers.delete(el)
      },
      {
        threshold: binding.value?.threshold ?? 0.12,
        rootMargin: '0px 0px -48px 0px',
      },
    )

    observer.observe(el)
    observers.set(el, observer)
  },
  unmounted(el) {
    observers.get(el)?.disconnect()
    observers.delete(el)
  },
}
