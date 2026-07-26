// Body copy for /services/mentorship.
//
// English adaptation of https://start-v-it.ru (the Russian original, which keeps
// running with the same terms). Domain-scoped module so the data/index.ts barrel
// — imported by every page *and* nuxt.config.ts — doesn't carry ~250 lines of
// landing-page copy. SEO meta/og for the page lives in `mentorshipPage` in
// data/index.ts, following the site-wide convention that index.ts owns nav+SEO.
//
// Copy rules baked into this file, do not "improve" them away:
//   - Pricing is stated as a percentage everywhere it leads. ₽ figures appear
//     only inside the labelled example and the case cards, each of which names
//     the market. No currency conversion — an FX-converted figure is stale in
//     months and misrepresents what people were actually paid.
//   - Every performance claim is attributed to Andrei's own records and dated
//     via `claimsAsOf`. Keep that in sync with the schema's dateModified.
//   - No testimonial quotes, no photos, no ratings. The cases are anonymised,
//     so a stylised pull-quote would be dressing up unverifiable copy.

export interface MentorshipStat {
  value: string
  label: string
}

export interface MentorshipStep {
  /** Display number, '01'…'06'. */
  n: string
  title: string
  /** Mono badge: 'Free', '~1 week', '10–15 h/week'. */
  duration: string
  text: string
}

export interface MentorshipFact {
  value: string
  label: string
}

export interface MentorshipRule {
  q: string
  a: string
}

export interface MentorshipCase {
  name: string
  weeks: string
  track: string
  market: string
  from: string
  to: string
  salaryRange: string
}

export interface MentorshipFaqItem {
  question: string
  answer: string
}

export const mentorship = {
  /** Must match an OfferingId in data/offerings.ts. */
  id: 'mentorship' as const,
  path: '/services/mentorship',

  /** Dates every performance claim below. Keep in sync with `dateModified`. */
  claimsAsOf: '2026-07',

  hero: {
    eyebrow: 'Mentorship · one-on-one · until you have an offer',
    title: 'Mentorship until you have an offer — paid only after you start work',
    lede: 'Not a course. One-on-one work with an engineer who has spent fifteen years shipping production software and hiring the people who ship it: a plan built for your situation, a call every week, code and resume review, mock interviews, and vacancy selection — until a company says yes. Nothing is due until you start working.',
    facts: [
      '0 upfront',
      '20% of gross salary × 6 months',
      'no offer, no payment',
      'reply in 24 h',
    ],
    ctaPrimary: { label: 'Book the free review', to: '#apply' },
    ctaSecondary: { label: 'Message on Telegram', href: 'https://t.me/xploitravy' },
  },

  /** Cross-link to the Russian original. Latin-only text — the self-hosted font subset has no Cyrillic block. */
  origin: {
    eyebrow: 'Original',
    text: 'This service also runs in Russian as Start v IT. That site carries the same terms, in Russian, with a Russian-language contact form.',
    link: { label: 'start-v-it.ru', href: 'https://start-v-it.ru' },
  },

  /** Market scope. States who this can actually serve, and explains the ₽ figures. */
  market: {
    note: 'Placement work and referrals run in the Russian-speaking IT market, which is remote-friendly and where my contacts are. Mentoring itself runs in Russian or English. Salary figures on this page are in Russian roubles because they are the actual offers people received.',
  },

  numbers: {
    items: [
      { value: '15+', label: 'years shipping production software' },
      { value: '50+', label: 'people placed in their first IT job' },
      { value: '~10 wks', label: 'median time to a first offer' },
      { value: '10–15 h', label: 'your time, per week' },
      { value: '24 h', label: 'reply to an inquiry' },
    ] satisfies MentorshipStat[],
    note: 'My own records. A median is not a forecast.',
  },

  fit: {
    eyebrow: 'Fit',
    title: 'Who this is for',
    yes: {
      title: 'This works if',
      items: [
        'You have studied on your own but never got an offer.',
        'You are changing careers and don\'t know what to show at an interview.',
        'You are a junior whose applications get no replies.',
      ],
    },
    no: {
      title: 'This does not work if',
      items: [
        'You want recorded lectures and no personal work.',
        'You cannot put 10–15 hours a week into it.',
      ],
    },
    closing: 'If you\'re in the second list, say so on the free call — I\'ll tell you straight and we both save the time.',
  },

  author: {
    eyebrow: 'Who you\'d be working with',
    title: 'Why me',
    paragraphs: [
      'I have been building production software for fifteen years — web platforms, game systems, real-time services — at Gaijin Entertainment, Wargaming, VKontakte, Play2Live and ELOPUB. I have also been on the other side of the table: hiring, interviewing, and rejecting developers. Most of what I teach comes from there, not from a syllabus.',
      'That matters for one practical reason. I know what a hiring manager actually reads in a resume, and what makes them end an interview early. A course gets paid when you enrol. I get paid when you start work.',
    ],
    companies: ['Gaijin Entertainment', 'Wargaming', 'VKontakte', 'Play2Live', 'ELOPUB'],
    link: { label: 'More about my work', to: '/about' },
  },

  program: {
    eyebrow: 'Program',
    title: 'How the six steps run',
    lede: 'Same six steps for everyone. The content of step 02 is different for everyone.',
    steps: [
      {
        n: '01',
        title: 'Application and a free review',
        duration: 'Free',
        text: 'A one-hour call about where you are, what you can already show, and an honest estimate of how long this will take. If I don\'t think I can help, I say so on that call.',
      },
      {
        n: '02',
        title: 'A plan, not a curriculum',
        duration: '~1 week',
        text: 'I write the skill list, the order, and the checkpoints for your situation — the gaps you actually have, not the modules a course happens to sell.',
      },
      {
        n: '03',
        title: 'One-on-one work',
        duration: '10–15 h/week',
        text: 'A call every week, code and task review between calls, chat when you\'re stuck, and plan corrections when reality disagrees with the plan.',
      },
      {
        n: '04',
        title: 'Resume and interview practice',
        duration: 'Mock interviews',
        text: 'The resume is written against specific vacancies, not in general. Then mock interviews, repeated until the nerves stop being the problem.',
      },
      {
        n: '05',
        title: 'Going to market',
        duration: 'My contacts',
        text: 'We pick the vacancies together, I refer you where I have contacts, and we debrief every rejection while it\'s still fresh.',
      },
      {
        n: '06',
        title: 'Offer — and only then payment',
        duration: '0 until offer',
        text: 'You start work. The first payment is due after your first salary, not before, and support continues through your probation period.',
      },
    ] satisfies MentorshipStep[],
    tracksNote: 'Tracks: frontend · backend · full-stack · QA · analytics · DevOps',
  },

  included: {
    eyebrow: 'Included',
    title: 'What\'s included',
    items: [
      'A free first review of your situation, with an honest timeline estimate.',
      'An individual skill plan, and the order to learn things in.',
      'A weekly call, plus chat between calls.',
      'Review of your code, your pet projects, and your resume.',
      'Mock interviews before the real ones.',
      'Vacancy selection, and a referral where I have contacts.',
      'A debrief after every rejection.',
      'Support through your probation period.',
    ],
    note: 'One-on-one, not a cohort · no separate charge for materials, calls or reviews',
  },

  terms: {
    eyebrow: 'Terms',
    title: 'How the money works',
    lede: 'The whole model in one line: after you start work you pay 20% of your gross salary for exactly six months. That is 1.2 months of salary in total, spread over half a year. Before that, nothing.',
    facts: [
      { value: '0', label: 'upfront, and nothing during the work' },
      { value: '20%', label: 'of gross monthly salary' },
      { value: '6', label: 'monthly payments, then it ends' },
      { value: '1.2×', label: 'one month\'s gross salary, in total' },
    ] satisfies MentorshipFact[],
    example: {
      label: 'Example · Russian market',
      text: 'A 150,000 ₽ monthly gross salary → 30,000 ₽ a month → 180,000 ₽ in total, and then the payments stop. The percentage is the same in any currency. The number isn\'t.',
    },
    rules: [
      { q: 'No offer?', a: 'You owe nothing, ever. There is no deferred bill and no debt — this is not a loan.' },
      { q: 'Quit or laid off?', a: 'Payments stop with the salary, and never resume retroactively.' },
      { q: 'What is the 20% taken from?', a: 'Gross salary, excluding bonuses.' },
      { q: 'Is there a cap?', a: 'No. Six payments of 20%, whatever the salary is.' },
      { q: 'What is agreed in writing?', a: 'The terms are fixed in writing — Telegram or email — before any work starts.' },
      { q: 'Want to stop halfway?', a: 'Stopping before an offer costs nothing and needs no explanation.' },
    ] satisfies MentorshipRule[],
    fullTerms: { label: 'Full payment terms, all seven sections', to: '/docs/mentorship-terms' },
  },

  cta: {
    label: 'Book the free review',
    note: 'One hour, no cost, no obligation. I reply within 24 hours.',
    to: '#apply',
    telegram: { label: 'Telegram', href: 'https://t.me/xploitravy' },
  },

  cases: {
    eyebrow: 'Track record',
    title: 'Where people ended up',
    lede: 'Four of the fifty-plus. All of them started in the Russian-speaking market, which is where this service has been running — the salary figures are in roubles and only mean something against that market.',
    items: [
      {
        name: 'Anna',
        weeks: '9 weeks',
        track: 'Frontend',
        market: 'Russian market',
        from: 'Freelance designer',
        to: 'Frontend developer',
        salaryRange: '130,000–160,000 ₽',
      },
      {
        name: 'Dmitry',
        weeks: '7 weeks',
        track: 'Backend',
        market: 'Russian market',
        from: 'Junior, six months of applications and no offer',
        to: 'Backend developer',
        salaryRange: '280,000–320,000 ₽',
      },
      {
        name: 'Elena',
        weeks: '14 weeks',
        track: 'Analytics',
        market: 'Russian market',
        from: 'Finance, 35, no IT experience',
        to: 'Data analyst',
        salaryRange: '210,000–240,000 ₽',
      },
      {
        name: 'Alexey',
        weeks: '12 weeks',
        track: 'Backend',
        market: 'Russian market',
        from: 'Logistics, no technical background',
        to: 'Backend developer',
        salaryRange: '200,000–230,000 ₽',
      },
    ] satisfies MentorshipCase[],
    disclaimer: 'Names changed at the students\' request. The ranges are the actual offers they received, in Russian roubles; exact figures are not disclosed. Timelines are individual — these four are not an average and not a forecast. I don\'t guarantee a timeline, a salary, or an offer.',
  },

  apply: {
    heading: 'Free one-hour review of your situation',
    lede: 'Tell me where you are. I\'ll reply within 24 hours with an honest read: whether I can help, roughly how long it would take, and what the first month would look like.',
    facts: ['0 cost', 'reply within 24 h', 'no unsolicited calls'],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'What people ask first',
    items: [
      {
        question: 'What does it cost?',
        answer: 'Nothing until you have an offer. After you start work you pay 20% of your gross salary each month for exactly six months — 1.2 months of salary in total, and then it ends. There is nothing else to pay: no charge for materials, calls, or reviews.',
      },
      {
        question: 'And if I never get hired?',
        answer: 'Then you pay nothing. This is not instalments and not a deferred payment — if there is no offer, there is no debt. We work out what didn\'t land and keep going: my work hasn\'t paid off either, so it isn\'t finished.',
      },
      {
        question: 'What is the 20% calculated from, and what if I quit early?',
        answer: 'From your gross monthly salary, excluding bonuses, and there are exactly six payments. If you quit or are laid off, the payments stop along with the salary and never resume retroactively. The full terms are on the payment terms page.',
      },
      {
        question: 'How long does it take?',
        answer: 'The median so far is about ten weeks to a first offer, and the spread is wide — the fastest was seven weeks, the slowest fourteen. It depends on where you start, which track you pick, and the state of the market. I give you an honest estimate for your case on the free call, and I don\'t guarantee a timeline.',
      },
      {
        question: 'I have no experience at all. Is this for me?',
        answer: 'Yes, if you can put 10–15 hours a week into it — that is workable alongside a job, a family, or exams, and the schedule is flexible. It is not for you if you want a course with recorded lectures: I only work live and one-on-one.',
      },
      {
        question: 'Which tracks can I pick?',
        answer: 'Frontend, backend, full-stack, QA, analytics, and DevOps. On the free call we look at where your previous experience gives you an edge — people from finance tend to move faster into analytics, people from design into frontend.',
      },
      {
        question: 'What does the work actually look like?',
        answer: 'A one-hour call once a week, with chat and review in between. I read your code and your resume, not abstract homework. Mock interviews start well before the real ones, so your first real interview isn\'t your first interview.',
      },
      {
        question: 'Do you really refer people to companies?',
        answer: 'Where I have a contact, yes — fifteen years in this industry buys a few — and I introduce people I would vouch for. Where I don\'t have a contact, we go through the normal process together. A referral is an introduction, not a job: the company still decides, and you have to be genuinely ready for that conversation.',
      },
      {
        question: 'What happens after the offer?',
        answer: 'I stay available through your probation period. The first months in a new job are their own challenge, and walking away at that point would be strange — not least because that is exactly when my payments are running.',
      },
    ] satisfies MentorshipFaqItem[],
  },

  honestyNote: 'About these numbers. The placement count, the median time to a first offer, and the salary ranges come from my own records of past work; they are not independently audited. Nothing on this page is a guarantee of employment, of a salary, or of a timeline. Mentoring is not recruitment: I am not an employment agency and I am not a party to any employment contract you sign. The payment terms are not a loan, not credit, and not a deferred-payment product — if there is no offer, there is no payment and no debt.',
}
