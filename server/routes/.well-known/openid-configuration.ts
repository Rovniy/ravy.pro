// Some MCP clients look for OpenID discovery before RFC 8414. There is no
// OpenID Provider here, but the OAuth fields they read are the same.
export { default } from './oauth-authorization-server'
