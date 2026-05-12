// ESLint flat config — replaces the legacy `.eslintrc`. ESLint 9+ ignores
// the old format; @antfu/eslint-config exposes a factory that returns a
// flat-config array and auto-detects Vue + TypeScript from package.json.
import antfu from '@antfu/eslint-config'

export default antfu({
  // Markdown collections live under /content and are managed by TinaCMS;
  // they are not source files we want to lint. Build outputs and generated
  // Tina artefacts also stay out.
  ignores: [
    'content/**',
    '.nuxt/**',
    '.output/**',
    'node_modules/**',
    'public/admin/**',
    'tina/__generated__/**',
    'dist/**',
  ],
}, {
  // The `withDefaults(defineProps<{ prop: T }>(), { prop: 'x' })` pattern
  // declares the prop as required at the type level so consumers get a
  // useful TS error if they omit it, while the default keeps runtime safe.
  // This is intentional, not a bug — silence the Vue style rule that wants
  // every prop with a default to be typed as optional.
  rules: {
    'vue/no-required-prop-with-default': 'off',
  },
})
