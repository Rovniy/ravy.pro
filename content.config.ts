import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      // Anything the app reads off a document has to be declared here or the
      // parser drops it silently. `theme` and `locale` were being read by
      // pages/blogs/[blog].vue and were missing from this schema, which is why
      // every post — including a pure-JavaScript article — shipped
      // `article:tag = Gamedev` from the site-wide fallback, and why a fully
      // Russian post served as `lang="en"` / `inLanguage: en-US`.
      schema: z.object({
        image: z.string().optional(),
        ogImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        published: z.boolean().optional(),
        trending: z.boolean().optional(),
        createdAt: z.string().optional(),
        lastUpdated: z.string().optional(),
        postedAt: z.string().optional(),
        caption: z.string().optional(),
        alt: z.string().optional(),
        /** Overrides the site-wide `seoData.theme` for `article:tag`. */
        theme: z.string().optional(),
        /** OG locale, e.g. `ru_RU`. Also drives `<html lang>` on the post. */
        locale: z.string().optional(),
        /**
         * Set `true` to keep a post readable and linked but out of the index and
         * the sitemap. Used for the short legacy devlog entries, which are real
         * posts but too thin to compete and dilute the domain in bulk.
         *
         * Deliberately a positive opt-out rather than an `indexable: false`
         * opt-in: an absent optional boolean comes back from the content DB as
         * `false`, not `undefined`, so `indexable === false` matched every post
         * that never set the field and would have de-indexed the entire blog.
         * With this polarity, absent is falsy and means "index normally".
         */
        noindex: z.boolean().optional(),
      }),
    }),
  },
})
