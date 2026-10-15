<script lang="ts" setup>
// Social card for a TIL note. Notes have no cover image, so the card is the
// question itself: a link to a note in a LinkedIn or X feed should read as an
// answer worth clicking, not as a generic site banner.
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  topic?: string
  excerpt?: string
  author?: string
}>(), {
  title: '',
  topic: '',
  excerpt: '',
  author: 'Andrei Rovnyi',
})

const title = computed(() => props.title.length > 110 ? `${props.title.slice(0, 107)}…` : props.title)
const excerpt = computed(() => props.excerpt.length > 150 ? `${props.excerpt.slice(0, 147)}…` : props.excerpt)
// Satori takes inline styles, not the site's Tailwind scale (and it drops
// border utilities), so every size and border here is a style binding.
const titleSize = computed(() => ({ fontSize: title.value.length > 70 ? '52px' : '64px' }))
</script>

<template>
  <div class="w-[1200px] h-[630px] flex flex-col justify-between bg-[#0b0d11] px-[80px] pt-[70px] pb-[80px] relative">
    <div class="flex items-center">
      <div class="flex items-center px-[22px] py-[6px] bg-[#ffc21a] text-[#111318] font-bold" style="font-size: 28px; letter-spacing: 3px; transform: skewX(-10deg)">
        TIL
      </div>
      <div v-if="topic" class="ml-[24px] text-[#a3aab7] uppercase" style="font-size: 24px; letter-spacing: 3px">
        {{ topic }}
      </div>
    </div>

    <div class="flex flex-col">
      <div class="font-bold text-[#eef0f4] leading-tight" :style="titleSize">
        {{ title }}
      </div>
      <div v-if="excerpt" class="mt-[28px] text-[#a3aab7] leading-snug" style="font-size: 28px">
        {{ excerpt }}
      </div>
    </div>

    <div class="flex items-center justify-between" style="font-size: 26px">
      <div class="flex items-center text-[#eef0f4]">
        <div class="w-[14px] h-[22px] bg-[#ffc21a] mr-[16px]" style="transform: skewX(-10deg)" />
        {{ author }}
      </div>
      <div class="text-[#7b8291]">
        ravy.pro/til
      </div>
    </div>

    <div class="absolute left-0 bottom-0 w-[1200px] h-[12px] bg-[#ffc21a]" />
  </div>
</template>
