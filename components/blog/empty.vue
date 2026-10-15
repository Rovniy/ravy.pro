<template>
  <article class="group border dark:border-slate-800 m-2 overflow-hidden text-slate-700">
    <NuxtLink to="/">
      <div
        class="lg:h-48 md:h-36 w-full object-cover object-center transition-all duration-500"
      >
        <LogoConfused />
      </div>
      <div class="p-5">
        <h2 class="text-3xl font-semibold text-fg pb-1 group-hover:text-accent-ink">
          No Post Available
        </h2>

        <div class="flex group-hover:underline text-accent-ink items-center pt-2">
          <p>Back To Home</p>
          <LogoArrow />
        </div>
      </div>
    </NuxtLink>
  </article>
</template>
