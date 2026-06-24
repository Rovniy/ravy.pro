import type {
  AiAnswer,
  CategoryClassification,
  DisclosureOutcome,
  SteamAuditAnswers,
  SteamAuditClassification,
} from '~/types/steam-audit'

// Bump this whenever Valve changes the Content Survey AI-disclosure form. The
// version is stamped onto every audit record and shown in the protocol, so a
// buyer can prove which ruleset their disclosure was generated against. Keeping
// this current is the product's moat.
export const RULESET_VERSION = '2026-01-17'

export interface RulesetAnswerOption {
  value: AiAnswer
  label: string
  hint?: string
}

export interface RulesetCategory {
  id: string
  label: string
  icon: string
  prompt: string
  help: string
  examples: string[]
  classify: (answer: AiAnswer) => { outcome: DisclosureOutcome, rationale: string, flag?: string }
}

// One shared answer model across every category keeps the wizard simple and the
// classification deterministic. `gray`/`unsure` is the honest safety valve.
export const ANSWER_OPTIONS: RulesetAnswerOption[] = [
  { value: 'none', label: 'No AI used here' },
  { value: 'dev_only', label: 'Used AI, but it did not ship', hint: 'Replaced or fully redone by a human before release.' },
  { value: 'shipped_pre', label: 'AI-made content ships in the game', hint: 'Created during development and consumed by players.' },
  { value: 'shipped_live', label: 'AI generates this live, while the game runs', hint: 'e.g. an LLM-driven NPC or runtime generation.' },
  { value: 'unsure', label: 'Not sure' },
]

const ANSWER_VALUES = new Set<AiAnswer>(ANSWER_OPTIONS.map(o => o.value))

// Valve's Jan 2026 clarification: the disclosure targets AI content that "ships
// with your game and is consumed by players", not behind-the-scenes efficiency
// tools. This standard mapping encodes exactly that.
function standardClassify(answer: AiAnswer): { outcome: DisclosureOutcome, rationale: string } {
  switch (answer) {
    case 'none':
      return { outcome: 'none', rationale: 'No AI used in this category.' }
    case 'dev_only':
      return {
        outcome: 'exempt',
        rationale: 'AI was used only during development and did not ship to players. This falls under Valve\'s efficiency-tools exemption — it is not disclosable as player-facing content.',
      }
    case 'shipped_pre':
      return {
        outcome: 'pre',
        rationale: 'AI-assisted content ships in the build and is consumed by players, so it must be disclosed as Pre-Generated AI Content.',
      }
    case 'shipped_live':
      return {
        outcome: 'live',
        rationale: 'AI generates this content at runtime, so it must be disclosed as Live-Generated AI Content, together with a description of your guardrails.',
      }
    case 'unsure':
      return {
        outcome: 'gray',
        rationale: 'Unclear whether this ships to players. Valve requires disclosure only for AI content that "ships with your game and is consumed by players". When in doubt, disclose.',
      }
  }
}

// Code assistants are the canonical "efficiency tool" — generally outside the
// disclosure even when the generated code ships, unless AI produces content at
// runtime.
function codeClassify(answer: AiAnswer): { outcome: DisclosureOutcome, rationale: string } {
  switch (answer) {
    case 'none':
      return { outcome: 'none', rationale: 'No AI used for code.' }
    case 'dev_only':
    case 'shipped_pre':
      return {
        outcome: 'exempt',
        rationale: 'AI coding assistants (Copilot, ChatGPT, etc.) are development-efficiency tools. Per Valve\'s Jan 2026 clarification, code that ships but is not player-consumed content is generally outside the AI-content disclosure.',
      }
    case 'shipped_live':
      return {
        outcome: 'live',
        rationale: 'If your game generates code or executable content at runtime via AI, that is Live-Generated content and must be disclosed with guardrails.',
      }
    case 'unsure':
      return {
        outcome: 'gray',
        rationale: 'If AI only sped up your coding it is exempt; if AI produces player-facing content at runtime, disclose. When in doubt, ask Valve.',
      }
  }
}

function withFlag(
  base: { outcome: DisclosureOutcome, rationale: string },
  answer: AiAnswer,
  flag: string,
): { outcome: DisclosureOutcome, rationale: string, flag?: string } {
  if (answer === 'shipped_pre' || answer === 'shipped_live')
    return { ...base, flag }
  return base
}

export const RULESET_CATEGORIES: RulesetCategory[] = [
  {
    id: 'art_textures',
    label: '2D art & textures',
    icon: 'mdi:image-outline',
    prompt: 'Did you use AI to create any 2D art or textures?',
    help: 'Sprites, UI art, backgrounds, surface textures — anything 2D the player sees.',
    examples: ['AI-generated textures', 'AI-upscaled textures', 'AI sprites used as-is'],
    classify: standardClassify,
  },
  {
    id: 'concept_art',
    label: 'Concept art',
    icon: 'mdi:palette-outline',
    prompt: 'Did you use AI for concept art?',
    help: 'If AI concepts were only references and the final art was hand-made, that did not ship.',
    examples: ['AI concept references repainted by an artist', 'AI concepts shipped directly'],
    classify: standardClassify,
  },
  {
    id: 'models_animation',
    label: '3D models & animation',
    icon: 'mdi:cube-outline',
    prompt: 'Did you use AI for 3D models or animation?',
    help: 'AI-assisted modelling, retopo, mocap cleanup, or animation that ships in the build.',
    examples: ['AI-assisted animation', 'AI-generated 3D meshes', 'AI mocap cleanup'],
    classify: standardClassify,
  },
  {
    id: 'code',
    label: 'Code',
    icon: 'mdi:code-tags',
    prompt: 'Did you use AI to help write code?',
    help: 'Coding assistants are efficiency tools and are generally NOT disclosed — unless AI generates content at runtime.',
    examples: ['GitHub Copilot', 'ChatGPT for code', 'AI generating content live in-game'],
    classify: codeClassify,
  },
  {
    id: 'music',
    label: 'Music',
    icon: 'mdi:music-note-outline',
    prompt: 'Did you use AI to create music?',
    help: 'Tracks generated or co-written with AI that ship in the game.',
    examples: ['AI-generated soundtrack', 'AI stems mixed into the score'],
    classify: standardClassify,
  },
  {
    id: 'sfx',
    label: 'Sound effects',
    icon: 'mdi:waveform',
    prompt: 'Did you use AI to create sound effects?',
    help: 'AI-generated SFX that ship in the build.',
    examples: ['AI-generated foley', 'AI ambient sound beds'],
    classify: standardClassify,
  },
  {
    id: 'voice',
    label: 'Voice & VO',
    icon: 'mdi:account-voice',
    prompt: 'Did you use AI for voice or voice-over?',
    help: 'AI-synthesised or cloned voices that ship. Placeholder VO replaced by a real actor did not ship.',
    examples: ['AI-synthesised narration', 'Cloned voice of a real person', 'Placeholder VO (later replaced)'],
    classify: answer => withFlag(
      standardClassify(answer),
      answer,
      'If you cloned or trained on a real person\'s voice, keep written consent or licensing on file — this is a sensitive area.',
    ),
  },
  {
    id: 'writing',
    label: 'Writing & dialogue',
    icon: 'mdi:script-text-outline',
    prompt: 'Did you use AI to write narrative, dialogue, or item text?',
    help: 'AI-written text that ships in the game and is read by players.',
    examples: ['AI-written quest dialogue', 'AI item descriptions', 'AI lore text'],
    classify: standardClassify,
  },
  {
    id: 'marketing',
    label: 'Marketing capsules & trailer',
    icon: 'mdi:bullhorn-outline',
    prompt: 'Did you use AI for store capsule art, screenshots, or trailer?',
    help: 'Store marketing assets are player-facing too, and draw extra scrutiny.',
    examples: ['AI capsule/header art', 'AI-edited trailer footage', 'AI store screenshots'],
    classify: answer => withFlag(
      standardClassify(answer),
      answer,
      'Capsule and marketing art draw extra community and Valve scrutiny. Make sure you hold the rights to every AI-generated marketing asset.',
    ),
  },
  {
    id: 'runtime',
    label: 'Runtime / LLM systems',
    icon: 'mdi:robot-outline',
    prompt: 'Does your game run AI live during gameplay (e.g. an LLM NPC)?',
    help: 'Any AI that generates content while the game runs is Live-Generated and needs a guardrails statement.',
    examples: ['LLM-driven NPC dialogue', 'Generative levels at runtime', 'Live AI image generation'],
    classify: (answer) => {
      switch (answer) {
        case 'none':
          return { outcome: 'none', rationale: 'No AI runs live during gameplay.' }
        case 'dev_only':
          return {
            outcome: 'exempt',
            rationale: 'AI helped build the system but does not run live for players, so there is no runtime content to disclose.',
          }
        case 'shipped_pre':
        case 'shipped_live':
          return {
            outcome: 'live',
            rationale: 'AI generates content at runtime, so it must be disclosed as Live-Generated AI Content. Valve additionally requires you to describe the guardrails that prevent it from producing illegal content.',
          }
        case 'unsure':
          return {
            outcome: 'gray',
            rationale: 'If anything is generated by AI while the game runs, it is Live-Generated and must be disclosed with guardrails. When in doubt, disclose.',
          }
      }
    },
  },
]

// Keep only known categories and valid answers; default everything else to
// 'none'. The server uses this to sanitise client input before classifying —
// never trust a client-sent classification.
export function normalizeAnswers(raw: unknown): SteamAuditAnswers {
  const out: SteamAuditAnswers = {}
  const input = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  for (const cat of RULESET_CATEGORIES) {
    const value = input[cat.id]
    out[cat.id] = (typeof value === 'string' && ANSWER_VALUES.has(value as AiAnswer))
      ? value as AiAnswer
      : 'none'
  }
  return out
}

export function classifyAudit(answers: SteamAuditAnswers): SteamAuditClassification {
  const normalized = normalizeAnswers(answers)
  const perCategory: CategoryClassification[] = RULESET_CATEGORIES.map((cat) => {
    const answer = normalized[cat.id] ?? 'none'
    const { outcome, rationale, flag } = cat.classify(answer)
    const entry: CategoryClassification = { id: cat.id, label: cat.label, answer, outcome, rationale }
    if (flag)
      entry.flag = flag
    return entry
  })

  const hasPre = perCategory.some(c => c.outcome === 'pre')
  const hasLive = perCategory.some(c => c.outcome === 'live')
  const hasGray = perCategory.some(c => c.outcome === 'gray')

  return {
    rulesetVersion: RULESET_VERSION,
    perCategory,
    mustDisclose: hasPre || hasLive,
    hasPre,
    hasLive,
    hasGray,
  }
}
