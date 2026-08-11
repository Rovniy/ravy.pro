import { legacyMediaRedirect } from '~~/server/utils/legacy-media-route'

/** 301s the pre-Storage `/blog-cover/**` URLs. See legacy-media-route.ts. */
export default defineEventHandler(event => legacyMediaRedirect(event, 'blog-cover'))
