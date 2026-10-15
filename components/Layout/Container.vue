<script setup lang="ts">
/** The one page container: 6xl with the site gutter, `narrow` (3xl) for prose. */
const props = withDefaults(defineProps<{
  narrow?: boolean
  as?: string
}>(), {
  narrow: false,
  as: 'div',
})
</script>

<template>
  <component
    :is="props.as"
    class="mx-auto w-full px-6 lg:px-10"
    :class="props.narrow ? 'max-w-3xl' : 'max-w-6xl'"
  >
    <slot />
  </component>
</template>
