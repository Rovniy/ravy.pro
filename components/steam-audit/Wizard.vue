<script setup lang="ts">
import type { AiAnswer, SteamAuditAnswers } from '~/types/steam-audit'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ANSWER_OPTIONS, classifyAudit, RULESET_CATEGORIES } from '~/utils/steam-ai-ruleset'

const emit = defineEmits<{
  (e: 'complete', answers: SteamAuditAnswers): void
  (e: 'cancel'): void
}>()

const answers = reactive<SteamAuditAnswers>({})
const stepIndex = ref(0)
const direction = ref<'fwd' | 'back'>('fwd')

const total = RULESET_CATEGORIES.length
const category = computed(() => RULESET_CATEGORIES[stepIndex.value]!)
const progress = computed(() => Math.round((stepIndex.value / total) * 100))
const isLast = computed(() => stepIndex.value === total - 1)

// Running tally — the value the user watches accumulate while answering.
const tally = computed(() => {
  const c = classifyAudit(answers)
  return {
    pre: c.perCategory.filter(p => p.outcome === 'pre').length,
    live: c.perCategory.filter(p => p.outcome === 'live').length,
    exempt: c.perCategory.filter(p => p.outcome === 'exempt').length,
    gray: c.perCategory.filter(p => p.outcome === 'gray').length,
  }
})

const stats = computed(() => [
  { key: 'pre', label: 'Must disclose · Pre', value: tally.value.pre, dot: 'bg-rose-500' },
  { key: 'live', label: 'Must disclose · Live', value: tally.value.live, dot: 'bg-amber-500' },
  { key: 'gray', label: 'Gray zone', value: tally.value.gray, dot: 'bg-yellow-400' },
  { key: 'exempt', label: 'Exempt', value: tally.value.exempt, dot: 'bg-emerald-500' },
])

function select(value: AiAnswer) {
  answers[category.value.id] = value
}

function next() {
  if (isLast.value) {
    emit('complete', { ...answers })
    return
  }
  direction.value = 'fwd'
  stepIndex.value += 1
}

function back() {
  if (stepIndex.value === 0) {
    emit('cancel')
    return
  }
  direction.value = 'back'
  stepIndex.value -= 1
}

function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    return
  const n = Number(e.key)
  if (n >= 1 && n <= ANSWER_OPTIONS.length) {
    select(ANSWER_OPTIONS[n - 1]!.value)
    e.preventDefault()
  }
  else if (e.key === 'Enter') {
    next()
    e.preventDefault()
  }
  else if (e.key === 'Backspace') {
    back()
    e.preventDefault()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 lg:gap-8">
    <!-- Question column -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <!-- Progress -->
      <div class="h-1.5 bg-slate-100 dark:bg-slate-800">
        <div class="h-full bg-sky-500 transition-all duration-500" :style="{ width: `${progress}%` }" />
      </div>

      <div class="p-5 sm:p-7">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Step {{ stepIndex + 1 }} / {{ total }}</span>
          <button type="button" class="text-xs font-spacemono text-slate-400 hover:text-sky-500 transition-colors" @click="back">
            {{ stepIndex === 0 ? 'Back to start' : '← Previous' }}
          </button>
        </div>

        <Transition :name="direction === 'fwd' ? 'step-fwd' : 'step-back'" mode="out-in">
          <div :key="category.id" class="mt-4">
            <div class="flex items-start gap-3">
              <Icon :name="category.icon" class="w-7 h-7 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {{ category.prompt }}
                </h2>
                <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {{ category.help }}
                </p>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-for="ex in category.examples"
                :key="ex"
                class="font-spacemono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                {{ ex }}
              </span>
            </div>

            <div class="mt-5 space-y-2.5">
              <button
                v-for="(opt, i) in ANSWER_OPTIONS"
                :key="opt.value"
                type="button"
                class="group w-full text-left rounded-lg border p-3.5 sm:p-4 transition-all hover:cursor-pointer flex items-start gap-3"
                :class="answers[category.id] === opt.value
                  ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-900/20 ring-1 ring-sky-500/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'"
                @click="select(opt.value)"
              >
                <span
                  class="shrink-0 mt-0.5 w-6 h-6 rounded-md grid place-items-center font-spacemono text-xs border transition-colors"
                  :class="answers[category.id] === opt.value
                    ? 'bg-sky-500 border-sky-500 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-400 group-hover:border-sky-400'"
                >
                  {{ i + 1 }}
                </span>
                <span>
                  <span class="block font-medium text-slate-900 dark:text-slate-100">{{ opt.label }}</span>
                  <span v-if="opt.hint" class="block text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ opt.hint }}</span>
                </span>
              </button>
            </div>

            <div class="mt-6 flex items-center justify-between gap-3">
              <span class="text-xs font-spacemono text-slate-400 hidden sm:inline">
                Tip: press 1–{{ ANSWER_OPTIONS.length }} to answer
              </span>
              <button
                type="button"
                :disabled="!answers[category.id]"
                class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer transition"
                @click="next"
              >
                {{ isLast ? 'See my verdict' : 'Next' }}
                <Icon :name="isLast ? 'mdi:flag-checkered' : 'mdi:arrow-right'" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Live "disclosure building" panel -->
    <aside class="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] self-start rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
      <span class="eyebrow">Your disclosure so far</span>
      <ul class="mt-4 space-y-3">
        <li v-for="s in stats" :key="s.key" class="flex items-center justify-between gap-3">
          <span class="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <span class="w-2.5 h-2.5 rounded-full" :class="s.dot" />
            {{ s.label }}
          </span>
          <span
            class="font-spacemono text-sm tabular-nums transition-colors"
            :class="s.value > 0 ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-400'"
          >
            {{ s.value }}
          </span>
        </li>
      </ul>
      <p class="mt-5 text-xs text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-4">
        Updated live as you answer. Nothing is sent anywhere until you choose to unlock your disclosure pack.
      </p>
    </aside>
  </div>
</template>

<style scoped>
.step-fwd-enter-active,
.step-fwd-leave-active,
.step-back-enter-active,
.step-back-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.step-fwd-enter-from { opacity: 0; transform: translateX(1rem); }
.step-fwd-leave-to { opacity: 0; transform: translateX(-1rem); }
.step-back-enter-from { opacity: 0; transform: translateX(-1rem); }
.step-back-leave-to { opacity: 0; transform: translateX(1rem); }

@media (prefers-reduced-motion: reduce) {
  .step-fwd-enter-active,
  .step-fwd-leave-active,
  .step-back-enter-active,
  .step-back-leave-active { transition: none; }
}
</style>
