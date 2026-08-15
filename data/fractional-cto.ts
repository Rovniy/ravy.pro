// Body copy for /services/fractional-cto.
//
// Domain-scoped module, same convention as data/mentorship.ts. SEO meta/og for
// the page lives in `fractionalCtoPage` in data/index.ts.
//
// Copy rules baked into this file, do not "improve" them away:
//   - Every career claim restates what is already published on /about. Nothing
//     beyond that list — no invented cases, revenue figures, or client names.
//   - No testimonials, client logos, ratings, or counters. There are none yet,
//     and an empty section is more honest than a fabricated one.
//   - Engagements are taken OUTSIDE the UAE. The line is stated plainly (facts
//     strip, availability, FAQ) and never explained — and the page must never
//     say "available worldwide" or "global clients".
//   - Availability is honest: calls happen in the GMT+7 morning, which covers
//     Europe/UK and does NOT cover North America. Stated, not hidden.
//   - Capacity is two clients at a time. Stated on the page.
//   - Prices are on the page, never "on request" — the price is part of the
//     filter.

export interface CtoPackage {
  id: string
  name: string
  /** Mono price line: '$1,500 · one-time · 5 business days'. */
  priceLine: string
  /** Numeric price for JSON-LD Offer. */
  price: string
  lede: string
  items: string[]
  cta: string
  /** The visually emphasised default option. */
  emphasized?: boolean
}

export interface CtoStep {
  n: string
  title: string
  duration: string
  text: string
}

export interface CtoFaqItem {
  question: string
  answer: string
}

export const fractionalCto = {
  /** Must match an OfferingId in data/offerings.ts. */
  id: 'fractional-cto' as const,
  path: '/services/fractional-cto',

  hero: {
    eyebrow: 'Engineering leadership · fractional',
    title: 'Fractional engineering leadership for game studios and high-load products',
    lede: 'Most fractional CTOs are architects who have never run a team. I have spent fifteen years doing both — leading engineering departments of thirty-plus people and keeping platforms upright at ten thousand requests per second. Two days a month, or five hours a week, on your side of the table.',
    ctaPrimary: { label: 'Book a 20-minute fit call', to: '#fit-call' },
    ctaSecondary: { label: 'Or start with a fixed-scope engineering audit — $1,500', to: '#packages' },
  },

  facts: [
    '15 years shipping production systems',
    '35+ engineers led across four teams',
    '10,000+ RPS in production',
    'Available outside the UAE',
  ],

  fit: {
    eyebrow: 'Fit',
    title: 'Who this is for',
    yes: {
      title: 'A good fit',
      items: [
        'A game studio of 5–40 people with strong developers and no engineering leader.',
        'A live product where load, release cadence, or incident response has become the bottleneck.',
        'A team with real-time components — multiplayer, WebRTC, websockets, authoritative state.',
        'A founder whose one team became three, and who now spends more time unblocking than building.',
        'A codebase nobody wants to touch, and no plan for what to do about it.',
      ],
    },
    no: {
      title: 'Not a fit',
      items: [
        'You need a full-time CTO. Hire one — I will tell you the same on the call.',
        'You need someone to write the code. I lead engineers, I do not replace them.',
        'You are at the idea stage with no team and no product.',
        'You need 24/7 on-call coverage.',
      ],
    },
  },

  steps: {
    eyebrow: 'Process',
    title: 'How it works',
    items: [
      {
        n: '01',
        title: 'Fit call',
        duration: '20 minutes · free',
        text: 'You describe the problem. I tell you whether it is an engineering problem, an organisational one, or neither. If I am not the right person, I say so on the call and it costs you nothing.',
      },
      {
        n: '02',
        title: 'Engineering audit',
        duration: '5 business days · $1,500',
        text: 'I read the code, the pipeline, and the calendar. You get a written report: architecture and where it will break first, delivery process and where it stalls, team structure and single points of failure, and a prioritised ninety-day plan. Fixed price, fixed scope, yours to keep whether or not we continue.',
      },
      {
        n: '03',
        title: 'Ongoing engagement',
        duration: 'No minimum term',
        text: 'If the audit shows work worth doing together, we pick a retainer. No minimum term, one month notice on either side.',
      },
    ] satisfies CtoStep[],
  },

  packages: {
    eyebrow: 'Pricing',
    title: 'Engagement options',
    items: [
      {
        id: 'audit',
        name: 'Engineering Audit',
        priceLine: '$1,500 · one-time · 5 business days',
        price: '1500',
        lede: 'A fixed-scope review with a written deliverable. The usual starting point, and a complete piece of work on its own.',
        items: [
          'Architecture review and failure-mode analysis',
          'Delivery process and release cadence',
          'Team structure, ownership, and bus factor',
          'Prioritised 90-day plan with effort estimates',
          'One 60-minute walkthrough of the findings',
        ],
        cta: 'Start with an audit',
      },
      {
        id: 'advisory',
        name: 'Advisory',
        priceLine: '$2,500 / month · ~8 hours · no minimum term',
        price: '2500',
        lede: 'For a team that has a technical lead and needs judgement above them.',
        items: [
          'Weekly 60-minute call',
          'Async review of architecture decisions and RFCs',
          'Hiring: scorecards, interview loops, and I sit in on final rounds',
          'Incident and postmortem review',
          'Direct line for the founder between calls',
        ],
        cta: 'Discuss advisory',
        emphasized: true,
      },
      {
        id: 'standard',
        name: 'Standard',
        priceLine: '$5,000 / month · ~20 hours · no minimum term',
        price: '5000',
        lede: 'For a team that needs an engineering manager, not an advisor.',
        items: [
          'Everything in Advisory',
          'Hands-on ownership of one workstream — platform, delivery, or hiring',
          'Roadmap and capacity planning with your leads',
          'Vendor and infrastructure decisions',
          'Written monthly report to founders or the board',
        ],
        cta: 'Discuss standard',
      },
    ] satisfies CtoPackage[],
    footnote: 'I take two clients at a time. If both slots are full, I will tell you when the next one opens rather than stretch myself across three.',
  },

  deliverables: {
    eyebrow: 'Deliverables',
    title: 'What you actually get',
    lede: 'Not calls. Documents your team can act on after I am gone.',
    items: [
      { name: 'Architecture review', text: 'what breaks first, at what load, and what it costs to fix' },
      { name: 'Delivery diagnosis', text: 'where work stalls between "started" and "shipped"' },
      { name: 'Team map', text: 'who owns what, where the single points of failure are, what to hire next' },
      { name: 'Ninety-day plan', text: 'sequenced, estimated, and argued, not a wish list' },
      { name: 'Interview loop', text: 'scorecards and questions your leads can run without me' },
      { name: 'Runbooks', text: 'for the incidents you keep having' },
    ],
  },

  track: {
    eyebrow: 'Track record',
    title: 'Fifteen years, most of it in games',
    items: [
      'Engineering Manager, Gaijin Entertainment — leading web development',
      'Wargaming — managed 35+ engineers across four teams',
      'ELOPUB — scaled to a $10M valuation with investors from three countries',
      'Platforms serving hundreds of thousands of concurrent users',
      'CI/CD pipelines handling peaks of 10,000+ requests per second',
      'Founder, XPLOIT — an independent game studio with two titles live on mobile stores',
    ],
    note: 'I also ship my own products. The tools on this site are built, maintained, and paid for by me, which is a slower and more honest teacher than any consulting engagement.',
    stack: ['Node.js', 'TypeScript', 'Nuxt 3 / Vue 3', 'Unity', 'Firebase', 'MySQL', 'Docker', 'CI/CD', 'WebRTC', 'websockets', 'AppsFlyer', 'Unity LevelPlay'],
    link: { label: 'More about my work', to: '/about' },
  },

  availability: {
    eyebrow: 'Availability',
    title: 'How we would work',
    paragraphs: [
      'I am based in Da Nang, Vietnam (GMT+7), and my calls happen in my morning — which is the working morning in Europe and the UK, and the middle of the night in North America. If your team is in Europe, scheduling is easy. If you are in the Americas, we can still work together, but the collaboration will be mostly written, and you should know that before we start rather than after.',
      'Everything else is async: written reviews, recorded walkthroughs, and documents rather than meetings.',
      'I take engagements outside the UAE.',
    ],
  },

  apply: {
    heading: 'Start with a call',
    lede: 'Twenty minutes, no deck, no pitch. Bring the problem, not a brief. If I am not the right person for your problem, you will know by the end of it.',
    facts: ['20 minutes', 'no cost', 'a straight answer'],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'What people ask first',
    items: [
      {
        question: 'What is a fractional CTO, and do I need one?',
        answer: 'Part-time engineering leadership, usually a few hours a week. You need one when your engineering problems have become organisational — releases slipping without anyone able to say why, the same incident recurring, a codebase only one person understands. You do not need one if you simply need more hands.',
      },
      {
        question: 'How is this different from hiring a consultant?',
        answer: 'A consultant produces a recommendation and leaves. I work inside your delivery process — your calls, your reviews, your hiring loops — and I am measured by whether the team ships better, not by whether the document was thorough.',
      },
      {
        question: 'Do you write code?',
        answer: 'Rarely, and only to understand a system or unblock someone. If you need production code written, hire a developer. I lead the people who write it.',
      },
      {
        question: 'Can you actually do this alongside a full-time job?',
        answer: 'Yes, at eight to twenty hours a month, which is what these tiers are. That is the honest ceiling and the reason there is no larger tier on this page. Two clients at a time, and I will say no when both slots are full.',
      },
      {
        question: 'Which industries do you work in?',
        answer: 'Games first — that is where fifteen years of my experience sits. Beyond games, any product with real-time or high-load characteristics. I turn down work where I would be learning your domain on your budget.',
      },
      {
        question: 'Do you take clients in the UAE?',
        answer: 'No. I take engagements outside the UAE only.',
      },
      {
        question: 'What happens after the audit?',
        answer: 'Nothing automatically. The report is yours whether or not we continue. Roughly speaking, if the audit surfaces work that needs a person rather than a plan, a retainer makes sense — and if it does not, I will tell you.',
      },
      {
        question: 'How do we start?',
        answer: 'A twenty-minute call. Bring the problem, not a brief.',
      },
    ] satisfies CtoFaqItem[],
  },

  finalCta: {
    note: 'Or email contact@ravy.pro with what is breaking.',
  },
}
