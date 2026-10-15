<script setup lang="ts">
import { ref } from 'vue'

// Override of Nuxt Content's default ProsePre: a code panel with a language
// label and a copy-to-clipboard button.
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
  <!-- A HUD panel: a header strip with the language (or filename) and the copy
       action, then the code. The panel stays dark in both site themes, which
       is what the single dark Shiki theme (ayu-dark) is drawn for. -->
  <div class="code-block not-prose my-6">
    <div class="code-block__panel">
      <div class="code-block__bar">
        <span class="code-block__lang">
          <span class="code-block__tick" aria-hidden="true" />
          {{ filename || language || 'code' }}
        </span>
        <button
          type="button"
          class="code-block__copy"
          :aria-label="copied ? 'Copied' : 'Copy code to clipboard'"
          @click="copy"
        >
          <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" size="14" aria-hidden="true" />
          <span>{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
      </div>
      <pre :class="props.class" :style="props.style" v-bind="$attrs"><slot /></pre>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  --code-bg: #0b0e14;
  --code-bar: #12161e;
  --code-line: #262c38;
  --code-fg: #bfbdb6;
  --code-muted: #8a909c;
  /* The system's corner cut, bottom-right only. clip-path would slice a CSS
     border off the diagonal, so the border is this layer's colour showing
     through 1px of padding around the panel, cut the same way. */
  --code-cut: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);
  padding: 1px;
  background-color: var(--code-line);
  clip-path: var(--code-cut);
}

.code-block__panel {
  background-color: var(--code-bg);
  clip-path: var(--code-cut);
}

.code-block__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0.5rem 0.4rem 0.9rem;
  background-color: var(--code-bar);
  border-bottom: 1px solid var(--code-line);
}

.code-block__lang {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-spacemono);
  font-size: var(--text-micro);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--code-muted);
}

.code-block__tick {
  width: 0.375rem;
  height: 0.75rem;
  background-color: var(--color-accent-400);
  transform: skewX(var(--skew));
}

.code-block__copy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.55rem;
  font-family: var(--font-spacemono);
  font-size: var(--text-micro);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--code-muted);
  border: 1px solid var(--code-line);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.code-block__copy:hover,
.code-block__copy:focus-visible {
  color: var(--color-accent-400);
  border-color: var(--color-accent-400);
}

.code-block :deep(pre) {
  margin: 0;
  padding: 1rem 1.15rem;
  overflow-x: auto;
  border: 0;
  background-color: transparent;
  color: var(--code-fg);
  --shiki-default: var(--code-fg);
  font-family: var(--font-spacemono);
  font-size: 0.875rem;
  line-height: 1.7;
}

/* Shiki emits each token's colour as an inline `--shiki-default`. */
.code-block :deep(pre span) {
  color: var(--shiki-default);
}

.code-block :deep(.line.highlight) {
  display: inline-block;
  width: 100%;
  background-color: rgb(255 194 26 / 0.08);
  box-shadow: inset 2px 0 0 var(--color-accent-400);
}
</style>
