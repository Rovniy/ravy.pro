<script setup lang="ts">
/** A figure read like a character stat: big display number, mono caption. */
const props = defineProps<{
  value: string | number
  /** Small accent suffix after the number, e.g. "+" or "%". */
  suffix?: string
  label: string
}>()
</script>

<template>
  <div>
    <p class="font-display font-extrabold text-5xl leading-none tabular-nums text-fg">
      {{ props.value }}<span v-if="props.suffix" class="text-2xl text-accent-ink">{{ props.suffix }}</span>
    </p>
    <p class="mt-1.5 font-spacemono text-micro uppercase tracking-[0.12em] text-fg-subtle">
      {{ props.label }}
    </p>
  </div>
</template>
