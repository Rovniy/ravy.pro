<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{ iconSize?: string | number }>(), { iconSize: 15 })

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      :aria-label="colorMode.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
      :title="colorMode.value === 'dark' ? 'Light theme' : 'Dark theme'"
      class="group hover:text-accent-ink transition-colors hover:cursor-pointer"
      v-bind="$attrs"
      @click="toggleTheme"
    >
      <Icon
        :name="colorMode.value === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'"
        :size="String(props.iconSize)"
        aria-hidden="true"
        class="transition-transform duration-300 ease-expo motion-safe:group-hover:rotate-[24deg]"
      />
    </button>
    <template #fallback>
      <span class="inline-flex" v-bind="$attrs">
        <Icon name="mdi:theme-light-dark" :size="String(props.iconSize)" aria-hidden="true" />
      </span>
    </template>
  </ClientOnly>
</template>
