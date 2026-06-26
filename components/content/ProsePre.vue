<script setup lang="ts">
import { ref } from 'vue'

// Override of Nuxt Content's default ProsePre to add a copy-to-clipboard button.
// Shiki passes the theme background + highlight classes as fallthrough attrs, so
// we disable auto-inheritance and re-bind $attrs onto the <pre> itself.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  code?: string
  language?: string | null
  filename?: string | null
  highlights?: number[]
  meta?: string | null
  class?: string | null
  style?: string | Record<string, string> | null
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  if (!props.code)
    return
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    if (timer)
      clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch {
    // Clipboard unavailable — manual selection still works.
  }
}
</script>

<template>
  <div class="code-block group relative my-6">
    <span v-if="filename" class="code-block__filename">{{ filename }}</span>
    <button
      type="button"
      class="code-block__copy"
      :aria-label="copied ? 'Copied' : 'Copy code to clipboard'"
      @click="copy"
    >
      <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" size="15" aria-hidden="true" />
      <span>{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>
    <pre :class="props.class" :style="props.style" v-bind="$attrs"><slot /></pre>
  </div>
</template>

<style scoped>
/* The wrapper owns vertical spacing; neutralise the prose <pre> margin so the
   copy button anchors to the actual code box. */
.code-block :deep(pre) {
  margin: 0;
  /* Shiki (single "dracula" theme) only emits `--shiki-default` custom props on
     the token spans; nothing in the app consumed them, so code rendered
     monochrome with no panel. Give it the dracula panel + wire the variables. */
  background-color: #282a36;
  color: #f8f8f2;
  --shiki-default: #f8f8f2;
  padding: 1rem 1.15rem;
  overflow-x: auto;
}

.code-block :deep(pre span) {
  color: var(--shiki-default);
}

.code-block__filename {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  padding: 0.15rem 0.6rem;
  font-family: var(--font-spacemono);
  font-size: 0.7rem;
  color: rgb(226 232 240); /* slate-200 */
  background: rgb(30 41 59 / 0.7); /* slate-800/70 */
  border-bottom-right-radius: 0.5rem;
}

.code-block__copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(226 232 240); /* slate-200 */
  background: rgb(30 41 59 / 0.7); /* slate-800/70 */
  border: 1px solid rgb(255 255 255 / 0.15);
  border-radius: 0.375rem;
  cursor: pointer;
  opacity: 0;
  backdrop-filter: blur(4px);
  transition: opacity 0.15s, background-color 0.15s, color 0.15s;
}

.code-block:hover .code-block__copy,
.code-block__copy:focus-visible {
  opacity: 1;
}

.code-block__copy:hover {
  color: #fff;
  background: rgb(51 65 85 / 0.9); /* slate-700/90 */
}

/* Touch devices have no hover — keep the button visible. */
@media (hover: none) {
  .code-block__copy {
    opacity: 1;
  }
}
</style>
