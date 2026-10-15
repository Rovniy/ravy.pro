<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * A bordered panel with the 45° corner cut (`.frame` + `.cut` in tailwind.css).
 * With `to` the whole card is a link: hover and keyboard focus turn the border
 * accent. No lift, scale or rotate — the border colour is the only response.
 */
const props = withDefaults(defineProps<{
  to?: RouteLocationRaw
  target?: string
  /** `sm` for compact cards and controls, `md` for content cards. */
  cut?: 'sm' | 'md'
  padding?: 'none' | 'sm' | 'md'
}>(), {
  cut: 'md',
  padding: 'md',
})

const NuxtLink = resolveComponent('NuxtLink')

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
}
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'div'"
    :to="props.to"
    :target="props.to ? props.target : undefined"
    class="frame cut group text-inherit no-underline"
    :class="{ 'cut-sm': props.cut === 'sm' }"
  >
    <div class="frame-inner cut flex flex-col" :class="[paddingClasses[props.padding], { 'cut-sm': props.cut === 'sm' }]">
      <slot />
    </div>
  </component>
</template>
