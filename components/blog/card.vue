<script lang="ts" setup>
interface Props {
  path: string
  title: string
  description: string
  image: string
  alt: string
  ogImage: string
  tags: Array<string>
  published: boolean
  createdAt: string
  lastUpdated?: string
}

withDefaults(defineProps<Props>(), {
  path: '/',
  title: 'no-title',
  description: 'no-description',
  image: '/not-found.png',
  alt: 'no-alt',
  ogImage: '/not-found.png',
  tags: () => [],
  published: false,
  createdAt: 'no-date',
  lastUpdated: 'no-date',
})
</script>

<template>
  <article class="group border dark:border-zinc-800 overflow-hidden rounded-2xl shadow-sm hover:shadow-xl bg-white dark:bg-slate-900/50 text-zinc-700 dark:text-zinc-300 transition-all duration-300 hover:-translate-y-1.5 flex flex-col">
    <NuxtLink :to="path" class="flex flex-col h-full">
      <div class="overflow-hidden rounded-t-2xl">
        <NuxtImg
          format="webp"
          loading="lazy"
          class="h-48 w-full object-cover object-center group-hover:scale-105 group-hover:brightness-105 transition-all duration-500"
          width="400"
          height="192"
          :src="image"
          :alt="alt"
        />
      </div>

      <div class="p-5 flex flex-col gap-3 flex-1">
        <h2 class="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {{ title }}
        </h2>

        <p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-1">
          {{ description }}
        </p>

        <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <Icon name="mdi:calendar-outline" size="14" />
          <span>{{ createdAt }}</span>
        </div>

        <div v-if="tags.length" class="flex flex-wrap gap-1.5">
          <NuxtLink
            v-for="tag in tags"
            :key="tag"
            :to="`/categories/${tag}`"
            :class="tagColorClass(tag)"
            class="rounded-full px-2 py-0.5 text-xs font-medium"
          >
            #{{ tag }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 mt-auto pt-1 group-hover:underline">
          Read More
          <LogoArrow />
        </div>
      </div>
    </NuxtLink>
  </article>
</template>
