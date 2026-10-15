<script lang="ts" setup>
/**
 * @credits NuxtLabs <https://nuxtlabs.com/>
 * @see https://github.com/nuxt/nuxt.com/blob/main/components/OgImage/OgImageDocs.vue
 */
import { computed } from 'vue'

interface Props {
  title?: string
  description?: string
  headline?: string
  link?: string
  timestamp?: number
  colorMode?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'title',
  description: 'description',
  headline: 'headline',
  link: '',
})

const formattedTitle = computed(() => props.title.length > 70 ? `${props.title.slice(0, 60)}...` : props.title)

const formattedDescription = computed(() => props.description.length > 100 ? `${props.description.slice(0, 100)}...` : props.description)

const formattedLink = computed(() => {
  if (props.link.endsWith('jpg') || props.link.endsWith('png'))
    return props.link

  return '/open_graph/og_image_default.png'
})
</script>

<template>
  <!-- Satori takes inline styles, not the site's Tailwind scale (and it drops
       border utilities), so sizes and borders are style attributes. -->
  <div class="w-[1200px] h-[630px] flex flex-col justify-center bg-[#0b0d11] relative">
    <div class="absolute top-0 right-[180px] w-[260px] h-[630px] bg-[#ffc21a]" style="transform: skewX(-10deg)" />

    <div class="w-[620px] pl-[90px] flex flex-col">
      <div v-if="headline" class="flex mb-[22px]">
        <div class="px-[18px] py-[6px] bg-[#ffc21a] text-[#111318] uppercase font-bold" style="font-size: 26px; letter-spacing: 3px; transform: skewX(-10deg)">
          {{ headline }}
        </div>
      </div>
      <h1 class="w-[600px] m-0 font-bold mb-[18px] text-[#eef0f4] leading-tight" style="font-size: 52px">
        {{ formattedTitle }}
      </h1>
      <p class="m-0 text-[#a3aab7] leading-tight" style="font-size: 26px">
        {{ formattedDescription }}
      </p>
    </div>

    <div v-if="formattedLink" class="absolute top-[195px] right-[70px] flex p-[3px] bg-[#444b58]">
      <img :src="formattedLink" :alt="title" class="w-96 h-52 object-cover">
    </div>

    <div class="absolute left-[90px] bottom-[48px] text-[#7b8291] uppercase" style="font-size: 22px; letter-spacing: 3px">
      ravy.pro
    </div>
  </div>
</template>
