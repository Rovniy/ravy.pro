<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * The one button. `primary` is the accent parallelogram (one per view),
 * `secondary` the outlined parallelogram, `ghost` a quiet action, `link` plain
 * accent text. Renders a NuxtLink when `to` is set, a <button> otherwise.
 * The slant lives on ::before (`.skew-box`), so the label stays upright.
 */
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'md'
  to?: RouteLocationRaw
  /** For a NuxtLink to an external URL. */
  target?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
})

const NuxtLink = resolveComponent('NuxtLink')

const variantClasses: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'text-accent-fg before:bg-accent hover:before:translate-x-1 active:before:translate-x-0.5 active:before:translate-y-0.5',
  secondary: 'text-fg before:border-2 before:border-line-strong hover:before:border-fg hover:before:bg-panel-raised',
  ghost: 'text-fg-muted hover:text-fg hover:before:bg-panel-raised',
  link: 'text-accent-ink hover:underline underline-offset-4',
}

const sizeClasses: Record<NonNullable<typeof props.size>, string> = {
  sm: 'px-4 py-2 text-base gap-1.5',
  md: 'px-6 py-3 text-lg gap-2',
}
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'button'"
    :to="props.to"
    :target="props.to ? props.target : undefined"
    :type="props.to ? undefined : props.type"
    :disabled="props.to ? undefined : props.disabled"
    class="skew-box inline-flex items-center justify-center font-display font-bold uppercase leading-none tracking-[0.06em] whitespace-nowrap cursor-pointer select-none transition-colors disabled:opacity-50 disabled:pointer-events-none"
    :class="[variantClasses[props.variant], props.variant === 'link' ? 'text-base gap-1.5' : sizeClasses[props.size]]"
  >
    <slot />
  </component>
</template>
