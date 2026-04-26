import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
	collections: {
		content: defineCollection({
			type: 'page',
			source: '**/*.md',
			schema: z.object({
				image: z.string().optional(),
				ogImage: z.string().optional(),
				tags: z.array(z.string()).optional(),
				published: z.boolean().optional(),
				trending: z.boolean().optional(),
				createdAt: z.string().optional(),
				lastUpdated: z.string().optional(),
			}),
		})
	}
})
