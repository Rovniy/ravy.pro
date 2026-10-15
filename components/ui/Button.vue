<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * The one button. `primary` is the accent parallelogram with a hard offset
 * drop under it (one per view), `secondary` the outlined one, `ghost` a
 * quiet action, `link` plain accent text. Renders a NuxtLink when `to` is
 * set, a <button> otherwise.
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

// The look lives in tailwind.css (.btn, .btn-primary, …) so hand-written
// HTML in markdown pages can use exactly the same buttons.
const classes = computed(() => [
  'skew-box btn',
  `btn-${props.variant}`,
  props.size === 'sm' && props.variant !== 'link' ? 'btn-sm' : '',
])
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'button'"
    :to="props.to"
    :target="props.to ? props.target : undefined"
    :type="props.to ? undefined : props.type"
    :disabled="props.to ? undefined : props.disabled"
    :class="classes"
  >
    <slot />
  </component>
</template>
