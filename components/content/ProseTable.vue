<script setup lang="ts">
// Override of Nuxt Content's default ProseTable, which renders a bare <table>.
// A markdown table is only as narrow as its content allows, so a 3-4 column
// table with a sentence in every cell pushes the whole page sideways on a
// phone — /docs/privacy-policy laid out 627px inside a 360px viewport and gave
// the entire document a horizontal scrollbar.
//
// Wrapping the table in its own scroll container keeps the overflow local: the
// table scrolls, the page doesn't. tabindex="0" makes that scroll region
// reachable without a pointer, which is also what the a11y "scrollable region
// must be focusable" rule asks for.
//
// Shiki-style fallthrough attrs belong on the <table>, not the wrapper.
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="prose-table-scroll" tabindex="0">
    <table v-bind="$attrs">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.prose-table-scroll {
  max-width: 100%;
  overflow-x: auto;
}

/* Cells wrap by default in a narrow table, which turns three words into three
   lines. Let the table take the width it needs and scroll instead. */
.prose-table-scroll :deep(th),
.prose-table-scroll :deep(td) {
  min-width: 8rem;
}
</style>
