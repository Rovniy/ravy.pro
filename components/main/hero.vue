<script setup lang="ts">
import { homePage } from '~/data'
</script>

<template>
  <div class="container">
    <div class="grid grid-cols-1 sm:grid-cols-2 items-center">
      <div class="px-6">
        <h1 class="font-semibold leading-tight text-4xl md:text-5xl my-5 bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">
          {{ homePage.content.title }}
        </h1>
        <p class="dark:text-zinc-300">
          {{ homePage.content.description }}
        </p>
      </div>

      <div class="px-6 justify-self-center h-[250px] relative flex items-center justify-center">
        <div class="blob blob-1" />
        <div class="blob blob-2" />
        <CreatureHome class="relative z-1" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(48px);
  opacity: 0.35;
  will-change: transform, opacity;
}

.blob-1 {
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, var(--color-sky-400), var(--color-violet-500));
  animation: float-blob 6s ease-in-out infinite;
}

.blob-2 {
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, var(--color-violet-400), var(--color-sky-300));
  animation: float-blob 12s ease-in-out infinite reverse;
  opacity: 0.2;
}

@keyframes float-blob {
  0%, 100% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -25px) scale(1.1);
  }
  66% {
    transform: translate(-24px, 24px) scale(0.9);
  }
}
</style>
