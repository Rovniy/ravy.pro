import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      // Anything the app reads off a document has to be declared here or the
      // parser drops it silently. Only docs, pages and the instagram feed live
      // here now — blog posts moved to Firestore (see server/utils/blog-store.ts).
      schema: z.object({
        image: z.string().optional(),
        alt: z.string().optional(),
        caption: z.string().optional(),
        published: z.boolean().optional(),
        createdAt: z.string().optional(),
        lastUpdated: z.string().optional(),
        postedAt: z.string().optional(),
      }),
    }),
  },
})
