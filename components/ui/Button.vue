<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'accent' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
})

const variantClasses: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90',
  accent: 'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-400 dark:text-slate-950 dark:hover:bg-accent-300',
  ghost: 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800',
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none hover:cursor-pointer"
    :class="variantClasses[props.variant]"
  >
    <slot />
  </button>
</template>
