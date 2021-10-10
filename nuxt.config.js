const Webpack = require('webpack')
const { resolve, join} = require('path')

const SITE_NAME = 'Ravy.pro'
const DESCRIPTION = `${SITE_NAME} - personal site by Andrew (Ravy) Rovniy`
const TITLE = 'Andrew (Ravy) Rovniy'
const FULL_SITE_URL = `https://${SITE_NAME.toLowerCase()}`
const DEFAULT_HTML_LANGUAGE = 'en'
const COLORS = {
	primary: '#1b9f58',
	secondary: '#222629'
}

module.exports = {
	debug: process.env.NODE_ENV === 'development',
	ssr: false,
	target: 'static',
	head: {
		titleTemplate: `${SITE_NAME} - %s`,
		meta: [
			{ charset: 'utf-8' },
			{ name: 'yandex-verification', content: '88b71ae841f9f5f2' },
			{ hid: 'description', name: 'description', content: DESCRIPTION },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
			{ property:'og:locale', content: 'en_Gb' },
			{ property:'og:type', content: 'website' },
			{ property:'og:site_name', content: 'Ravy.pro' },
			{ property:'og:url', content: '//www.ravy.pro' },
			{ property:'og:image', content: 'https://storage.yandexcloud.net/altcover-static/images/ravy.pro/og_image.jpg' },
			{ property:'og:image:width', content: '160' },
			{ property:'og:image:height', content: '80' },
			{ property:'vk:image', content: 'https://storage.yandexcloud.net/altcover-static/images/ravy.pro/og_image.jpg' },
			{ property:'og:title', content: TITLE },
			{ property:'og:description', content: `${SITE_NAME}} - My personal site` },
		],
		link: [
			{ rel: 'icon', type: 'image/x-icon', href: '/images/favicon.jpg' }
		],
		htmlAttrs: {
			lang: DEFAULT_HTML_LANGUAGE
		}
	},
	loading: {
		color: COLORS.primary
	},
	loadingIndicator: {
		background: COLORS.secondary,
		color: COLORS.primary
	},
	css: [
		{ src: resolve(__dirname, 'assets/styles/common.sass'), lang: 'sass' }
	],
	modules: [
		'nuxt-babel',
		'@nuxtjs/axios',
		'@nuxtjs/dotenv',
		'@nuxtjs/style-resources',
		'@nuxtjs/robots',
		'@nuxtjs/sitemap',
		[
			'@nuxtjs/yandex-metrika',
			{
				id: process.env.YANDEX_METRIKA_ID,
				webvisor: true,
			}
		],
	],
	sitemap: {
		hostname: FULL_SITE_URL,
		gzip: true,
	},
	robots: {
		UserAgent: '*',
		Allow: '/',
		Sitemap: `${FULL_SITE_URL}/sitemap.xml`,
	},
	plugins: [
		{ src: '~/plugins/lightbox', mode: 'client' }
	],
	styleResources: {
		sass: [
			'@assets/styles/_vars.sass',
			'@assets/styles/libs/_responsive.mixin.sass'
		]
	},
	pwa: {
		meta: {
			charset: 'utf-8',
			title: SITE_NAME,
			author: 'Elo.pub Team',
			description: DESCRIPTION,
			theme_color: COLORS.primary,
			crossorigin: 'use-credentials',
			name: TITLE,
			appleStatusBarStyle: 'black'
		},
		manifest: {
			start_url: FULL_SITE_URL + '?standalone=true',
			name: TITLE,
			short_name: SITE_NAME,
			description: DESCRIPTION,
			lang: DEFAULT_HTML_LANGUAGE,
			display: 'standalone',
			background_color: COLORS.secondary,
			theme_color: COLORS.primary,
			useWebmanifestExtension: false
		}
	},
	axios: {
		credentials: false
	},
	resolve: {
		alias: {
			'@': join(__dirname),
			'~': join(__dirname, 'assets')
		}
	},
	router: {
		base: '/',
		middleware: []
	},
	build: {
		extend(config, ctx) {
			if (ctx.isDev && ctx.isClient) {
				config.module.rules.push({
					enforce: 'pre',
					test: /\.(js|vue)$/,
					loader: 'eslint-loader',
					exclude: /(node_modules)/
				})
			}
		}
	}
}
