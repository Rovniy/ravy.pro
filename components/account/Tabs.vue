<script setup lang="ts">
interface TabDef { key: string, label: string, icon?: string }

defineProps<{ tabs: TabDef[], modelValue: string }>()
defineEmits<{ (e: 'update:modelValue', key: string): void }>()
</script>

<template>
  <div class="flex flex-wrap gap-1 border-b border-line overflow-x-auto overflow-y-hidden">
    <button
      v-for="t in tabs"
      :key="t.key"
      type="button"
      class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors hover:cursor-pointer"
      :class="modelValue === t.key
        ? 'border-accent text-fg'
        : 'border-transparent text-fg-muted hover:text-fg'"
      @click="$emit('update:modelValue', t.key)"
    >
      <Icon v-if="t.icon" :name="t.icon" class="w-4 h-4" />
      {{ t.label }}
    </button>
  </div>
</template>
