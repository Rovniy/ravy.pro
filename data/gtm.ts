export const GTM_ID = 'GTM-57T2XCRL'

export const CONSENT_STORAGE_KEY = 'ravy_consent_v1'

export type ConsentCategory
  = | 'ad_storage'
    | 'ad_user_data'
    | 'ad_personalization'
    | 'analytics_storage'
    | 'functionality_storage'
    | 'personalization_storage'
    | 'security_storage'

export type ConsentState = Record<ConsentCategory, 'granted' | 'denied'>

// Default = everything denied except strictly-necessary categories.
// security_storage and functionality_storage are required for site to work
// (auth, dark mode, etc.) — granted by default.
export const CONSENT_DEFAULTS: ConsentState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
}

// GCM v2 default consent must run BEFORE GTM loads. This part stays inline
// in <head> so any tag the loader fires later already respects defaults.
// `wait_for_update: 500` delays Google tag pings while the banner reads
// localStorage and may call `consent update`.
// `ads_data_redaction: true` strips ad identifiers when ad_storage is denied.
// `url_passthrough: true` keeps gclid/etc. in URLs so attribution survives.
export const GTM_CONSENT_DEFAULTS = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','functionality_storage':'granted','personalization_storage':'denied','security_storage':'granted','wait_for_update':500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);`

// The actual gtm.js loader — deferred via requestIdleCallback in
// plugins/gtm.client.ts so it doesn't compete with LCP resources.
export const GTM_LOADER_FN = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`

export const GTM_NOSCRIPT_HTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
