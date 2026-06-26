<script setup lang="ts">
interface TabDef { key: string, label: string, icon?: string }

defineProps<{ tabs: TabDef[], modelValue: string }>()
defineEmits<{ (e: 'update:modelValue', key: string): void }>()
</script>

<template>
  <div class="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto overflow-y-hidden">
    <button
      v-for="t in tabs"
      :key="t.key"
      type="button"
      class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors hover:cursor-pointer"
      :class="modelValue === t.key
        ? 'border-sky-500 text-slate-900 dark:text-slate-100'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      @click="$emit('update:modelValue', t.key)"
    >
      <Icon v-if="t.icon" :name="t.icon" class="w-4 h-4" />
      {{ t.label }}
    </button>
  </div>
</template>
