// Clients try the path-suffixed form first (`…/oauth-protected-resource/mcp`,
// RFC 9728 §3.1). There is one protected resource, so both answer the same.
export { default } from '../oauth-protected-resource'
