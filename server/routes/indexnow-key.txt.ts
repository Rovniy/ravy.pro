import { INDEXNOW_KEY } from '~~/utils/indexnow'

/** The IndexNow key file. Its content must be exactly the key. */
export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  return INDEXNOW_KEY
})
