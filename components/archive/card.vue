<script lang="ts" setup>
interface Props {
  path?: string
  title?: string
  createdAt?: string
  description?: string
  image?: string
  alt?: string
  ogImage?: string
  tags?: Array<string>
  published?: boolean
}

withDefaults(defineProps<Props>(), {
  path: '/',
  title: 'no-title',
  createdAt: 'no-date',
  description: 'no-description',
  image: '/not-found.png',
  alt: 'no-alt',
  ogImage: '/not-found.png',
  tags: () => [],
  published: false,
})
</script>

<template>
  <article class="group border dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl bg-white dark:bg-slate-900/50 text-zinc-700 dark:text-zinc-300 transition-all duration-300 hover:-translate-y-1.5">
    <NuxtLink :to="path" class="grid grid-cols-1 sm:grid-cols-10">
      <div class="sm:col-span-3 overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
        <NuxtImg
          format="webp"
          loading="lazy"
          class="h-48 sm:h-full w-full object-cover object-center group-hover:scale-[1.04] transition-all duration-500"
          width="289"
          height="184"
          :src="image"
          :alt="alt"
        />
      </div>

      <div class="sm:col-span-7 p-6 flex flex-col gap-2.5">
        <h2 class="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {{ title }}
        </h2>

        <p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {{ description }}
        </p>

        <div class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <Icon name="mdi:calendar-outline" size="14" />
          <span>{{ createdAt }}</span>
        </div>

        <div v-if="tags?.length" class="flex flex-wrap gap-1.5">
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
