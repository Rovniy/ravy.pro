// Commercial offerings surfaced on /services.
//
// This is a third registry, deliberately separate from the other two:
//   - `publicServices` (data/index.ts)    — self-serve tools; drive the Tools
//     menu, the homepage grid, and rating badges via toolIdFromPath().
//   - `GATED_TOOLS`    (data/services.ts) — per-user access-granted workspace
//     tools, surfaced only to accounts with a grant.
// Putting an offering in either of those would leak a service card into the
// Tools menu. The name `offerings` avoids the already-overloaded "services".
//
// Long-form copy for an offering with its own landing page lives in its own
// module (see data/mentorship.ts); this file is only the card-level registry.

export const OFFERING_IDS = ['mentorship', 'fractional-cto', 'consulting', 'team-support'] as const

export type OfferingId = (typeof OFFERING_IDS)[number]

/**
 * How an offering's card converts.
 * - `page`    → links to a full landing page at `path`.
 * - `inquiry` → scrolls to the inline form on /services with this offering
 *   preselected.
 *
 * Promoting an offering to a full page later: flip `kind` to 'page', add the
 * page file, and add two lines to nuxt.config. The sitemap and prerender list
 * are derived from `OFFERING_PAGE_PATHS`, so neither needs an edit.
 */
export type OfferingCta
  = | { kind: 'page', path: string }
    | { kind: 'inquiry' }

export interface Offering {
  id: OfferingId
  name: string
  /** Iconify name. Bound dynamically → MUST be listed in nuxt.config icon.clientBundle.icons. */
  icon: string
  /** Audience chip on the card. */
  tag: string
  /** Card pitch, 1–2 sentences. Used on /services. */
  blurb: string
  /**
   * One short line for compact surfaces (the homepage card). Kept separate from
   * `blurb` rather than clamping it — a `line-clamp` would cut mid-sentence, and
   * the shortest version of a pitch is worth writing deliberately.
   */
  tagline: string
  /** Mono meta line carrying the commercial facts. */
  meta: string
  /** CTA verb. Must describe where the click actually goes. */
  action: string
  cta: OfferingCta
  /** Label in the inquiry form's <select> and in the notification email subject. */
  inquiryLabel: string
  /** Prefilled text for the secondary Telegram DM CTA. */
  telegramText: string
}

export const OFFERINGS: Offering[] = [
  {
    id: 'mentorship',
    name: 'Mentorship & job placement in IT',
    icon: 'mdi:account-star-outline',
    tag: 'For career switchers & juniors',
    blurb: 'One-on-one work to a first IT job offer, with a payment model that only starts when you do: nothing upfront, then 20% of your gross salary for six months. No offer, no payment.',
    tagline: 'To your first IT job offer — paid only after you start working.',
    meta: 'Free 1-hour review · 0 upfront · 20% × 6 months after you start',
    action: 'Read the full page',
    cta: { kind: 'page', path: '/services/mentorship' },
    inquiryLabel: 'Mentorship & job placement in IT',
    telegramText: 'Hi Andrei! I\'m interested in your IT mentorship program. Here\'s my situation:',
  },
  {
    id: 'fractional-cto',
    name: 'Fractional CTO for game studios',
    icon: 'mdi:account-tie-outline',
    tag: 'For game studios & high-load products',
    blurb: 'Part-time engineering leadership: architecture, delivery process, and the team itself — from an engineer who has led 35+ people and kept platforms upright at 10,000+ RPS. A fixed-scope audit first, then a retainer. Two clients at a time, outside the UAE.',
    tagline: 'Part-time engineering leadership for game studios and high-load products.',
    meta: 'Audit $1,500 · Advisory $2,500/mo · Standard $5,000/mo',
    action: 'Read the full page',
    cta: { kind: 'page', path: '/services/fractional-cto' },
    inquiryLabel: 'Fractional CTO / engineering leadership',
    telegramText: 'Hi Andrei! I\'m interested in fractional engineering leadership. Here\'s the context:',
  },
  {
    id: 'consulting',
    name: 'Product & engineering consulting',
    icon: 'mdi:compass-outline',
    tag: 'For founders & small teams',
    blurb: 'A second opinion on the decisions that are expensive to reverse — architecture, stack, scope, and the right level of complexity so you ship instead of over-engineering. You bring the problem and the context; you leave with a decision and the reasoning behind it.',
    tagline: 'A second opinion on the decisions that are expensive to reverse.',
    meta: 'First call free · then per call or per written review · reply in 24 h',
    action: 'Start an inquiry',
    cta: { kind: 'inquiry' },
    inquiryLabel: 'Product & engineering consulting',
    telegramText: 'Hi Andrei! I\'d like to talk about product and engineering consulting. Here\'s the problem:',
  },
  {
    id: 'team-support',
    name: 'Engineering support for your team',
    icon: 'mdi:account-group-outline',
    tag: 'For engineering teams',
    blurb: 'Part-time senior help inside a team that is already shipping: code review, release process, real-time and high-load work, internal tooling, and the automation that quietly removes manual steps. On your repo, alongside the people you already have.',
    tagline: 'Part-time senior help inside a team that is already shipping.',
    meta: 'Monthly, part-time · starts with a call · scope agreed in writing',
    action: 'Start an inquiry',
    cta: { kind: 'inquiry' },
    inquiryLabel: 'Engineering support for your team',
    telegramText: 'Hi Andrei! I\'d like to talk about engineering support for my team. Here\'s the context:',
  },
]

export function offeringById(id: string): Offering | undefined {
  return OFFERINGS.find(o => o.id === id)
}

/** Mirrors isValidToolKey() in data/services.ts — used by the inquiry API. */
export function isOfferingId(value: unknown): value is OfferingId {
  return typeof value === 'string' && (OFFERING_IDS as readonly string[]).includes(value)
}

/** Offerings with their own landing page — feeds the sitemap and prerender list. */
export const OFFERING_PAGE_PATHS: string[] = OFFERINGS
  .filter(o => o.cta.kind === 'page')
  .map(o => (o.cta as { kind: 'page', path: string }).path)
