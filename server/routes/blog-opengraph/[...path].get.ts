import { legacyMediaRedirect } from '~~/server/utils/legacy-media-route'

/** 301s the pre-Storage `/blog-opengraph/**` URLs. See legacy-media-route.ts. */
export default defineEventHandler(event => legacyMediaRedirect(event, 'blog-opengraph'))
