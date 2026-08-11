<script lang="ts" setup>
import type { BlogPostMeta } from '~/utils/blog-post'
import { toCardData } from '~/utils/blog-post'

// No useHead here: pages/index.vue owns the page title and description. A
// section component writing them is how the home page ended up with two
// components setting the same title.
const { data } = await useAsyncData('blog-post-list', () =>
  $fetch<BlogPostMeta[]>('/api/blog/posts'))

const formattedData = computed(() => (data.value ?? []).slice(0, 3).map(toCardData))
</script>

<template>
  <section class="py-14 px-6">
    <UiSectionHeader eyebrow="Writing" title="Recent Posts" to="/blogs" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-for="(post, i) in formattedData" :key="post.title">
        <BlogCard
          v-reveal="(i % 3) * 90"
          :path="post.path || ''"
          :title="post.title"
          :created-at="post.createdAt"
          :last-updated="post.lastUpdated"
          :description="post.description"
          :image="post.image"
          :alt="post.alt"
          :og-image="post.ogImage"
          :tags="post.tags"
          :published="post.published"
          :trending="post.trending"
        />
      </template>
      <template v-if="data?.length === 0">
        <BlogEmpty />
      </template>
    </div>
  </section>
</template>
