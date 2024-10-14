import { NuxtImg } from '#components'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('NuxtImg', NuxtImg)
})
