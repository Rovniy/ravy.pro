<template>
  <article class="group border border-line bg-panel overflow-hidden text-fg">
    <NuxtLink to="/">
      <div
        class="lg:h-48 md:h-36 w-full object-cover object-center transition-all duration-500"
      >
        <LogoConfused />
      </div>
      <div class="p-5">
        <h2 class="font-display font-extrabold uppercase text-3xl leading-none text-fg pb-2 group-hover:text-accent-ink">
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
