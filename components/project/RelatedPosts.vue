<script setup lang="ts">
import type { BlogPostMeta } from '~/utils/blog-post'
import { toCardData } from '~/utils/blog-post'

// Posts about a project, by tag or by path.
//
// Client-only on purpose: the project pages are prerendered, and a server-side
// fetch would freeze the list at build time while posts are published live from
// /studio. Same reasoning as the release card on /tools/xploit-translator.

const props = withDefaults(defineProps<{
  tag?: string
  paths?: string[]
  title?: string
  limit?: number
}>(), { title: 'Devlog & writing', limit: 3, paths: () => [] })

const { data } = useLazyAsyncData('project-posts', () =>
  $fetch<BlogPostMeta[]>('/api/blog/posts'), { server: false })

const posts = computed(() => (data.value ?? [])
  .filter(p => (props.tag && (p.tags ?? []).includes(props.tag)) || props.paths.includes(p.path))
  .slice(0, props.limit)
  .map(toCardData))

const categoryLink = computed(() => props.tag ? `/categories/${props.tag}` : undefined)
</script>

<template>
  <section v-if="posts.length" class="mt-14">
    <UiSectionHeader eyebrow="Blog" :title="title" :to="categoryLink" link-label="All posts" />
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BlogCard
        v-for="post in posts"
        :key="post.path"
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
    </div>
  </section>
</template>
