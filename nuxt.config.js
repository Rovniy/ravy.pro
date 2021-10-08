const Webpack = require('webpack')
const { resolve } = require('path')

module.exports = {
	debug: process.env.NODE_ENV === 'development',
	ssr: false,
	target: 'static',
	head: {
		titleTemplate: 'Ravy.pro - %s',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'yandex-verification', content: '88b71ae841f9f5f2' },
			{ hid: 'description', name: 'description', content: 'Ravy.pro - personal site by Andrew (Ravy) Rovniy' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
			{ property:'og:locale', content:'en_Gb' },
			{ property:'og:type', content:'website' },
			{ property:'og:site_name', content:'Ravy.pro' },
			{ property:'og:url', content:'//www.ravy.pro' },
			{ property:'og:image', content:'https://storage.yandexcloud.net/altcover-static/images/ravy.pro/og_image.jpg' },
			{ property:'og:image:width', content:'160' },
			{ property:'og:image:height', content:'80' },
			{ property:'vk:image', content:'https://storage.yandexcloud.net/altcover-static/images/ravy.pro/og_image.jpg' },
			{ property:'og:title', content:'Andrew (Ravy) Rovniy' },
			{ property:'og:description', content:'Ravy.pro - my personal sait' },
		],
		link: [
			{ rel: 'icon', type: 'image/x-icon', href: '/images/favicon.jpg' }
		]
	},
	loading: {
		color: '#e27689'
	},
	loadingIndicator: {
		background: '#151824',
		color: '#e27689'
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
		hostname: 'https://ravy.pro',
		gzip: true,
	},
	robots: {
		UserAgent: '*',
		Allow: '/',
		Sitemap: `https://ravy.pro/sitemap.xml`,
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
	axios: {
		credentials: false
	},
	resolve: {
		alias: {
			'@': resolve(__dirname)
		}
	},
	router: {
		base: '/',
		middleware: []
	},
	build: {
		extend(config, ctx) {
			// Run ESLint on save
			if (ctx.isDev && ctx.isClient) {
				config.module.rules.push({
					enforce: 'pre',
					test: /\.(js|vue)$/,
					loader: 'eslint-loader',
					exclude: /(node_modules)/
				})
			}
		},
		plugins: [
			new Webpack.ProvidePlugin({
				_: 'lodash'
			})
		]
	}
}
