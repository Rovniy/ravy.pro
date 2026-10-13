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
const titleSize = computed(() => title.value.length > 70 ? 'text-[52px]' : 'text-[64px]')
</script>

<template>
  <div class="w-[1200px] h-[630px] flex flex-col justify-between bg-[#020617] px-[80px] py-[70px]">
    <div class="flex items-center">
      <div class="flex items-center rounded-full px-[22px] py-[8px] text-[26px] text-[#2dd4bf]" style="border: 2px solid #2dd4bf">
        TIL
      </div>
      <div v-if="topic" class="ml-[20px] text-[26px] text-[#94a3b8]">
        {{ topic }}
      </div>
    </div>

    <div class="flex flex-col">
      <div class="font-semibold text-white leading-tight" :class="titleSize">
        {{ title }}
      </div>
      <div v-if="excerpt" class="mt-[28px] text-[28px] text-[#cbd5e1] leading-snug">
        {{ excerpt }}
      </div>
    </div>

    <div class="flex items-center justify-between text-[26px]">
      <div class="flex items-center text-[#e2e8f0]">
        <div class="w-[14px] h-[14px] rounded-full bg-[#2dd4bf] mr-[16px]" />
        {{ author }}
      </div>
      <div class="text-[#64748b]">
        ravy.pro/til
      </div>
    </div>
  </div>
</template>
