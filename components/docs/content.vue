<script setup lang="ts">
const props = withDefaults(defineProps<IToc>(), {
  article: () => {},
})

interface IToc {
  article: object
}
</script>

<template>
  <LayoutContainerOneCol>
    <ContentRenderer :value="props.article" />
  </LayoutContainerOneCol>
</template>
