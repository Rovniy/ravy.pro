const Webpack = require('webpack')
const { resolve } = require('path')

module.exports = {
    debug: process.env.NODE_ENV === 'development',
    /*
  ** Headers of the page
  */
    head: {
        titleTemplate: 'Ravy.pro - %s',
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
            },
			{
				name: 'yandex-verification',
				content: '88b71ae841f9f5f2'
			},
            {
                hid: 'description',
                name: 'description',
                content: 'Ravy.pro - personal sait by Andrew (Ravy) Rovniy'
            }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/images/favicon.jpg' }
        ],
        script: []
    },

    /*
  ** Customize the progress-bar color
  */
    loading: {
        color: '#495CA5'
    },
    loadingIndicator: {
        background: '#151824',
        color: '#495CA5'
    },

    /*
  ** Global CSS
  */
    css: [
        { src: resolve(__dirname, 'assets/styles/common.sass'), lang: 'sass' }
    ],

    /*
  ** Plugins to load before mounting the App
  */
    plugins: [
    ],

    /*
  ** Nuxt.js modules
  */
    modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
        'nuxt-babel',
        '@nuxtjs/axios',
        '@nuxtjs/dotenv',
        '@nuxtjs/style-resources',
        [
            '@nuxtjs/yandex-metrika',
            {
                id: '62509765',
                webvisor: true,
                // clickmap:true,
                // useCDN:false,
                // trackLinks:true,
                // accurateTrackBounce:true,
            }
        ],
    ],

    styleResources: {
        sass: [
            '@assets/styles/_vars.sass',
            '@assets/styles/libs/_responsive.mixin.sass'
        ]
    },

    /*
  ** Axios module configuration
  */
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

    /*
  ** Build configuration
  */
    build: {
    /*
    ** You can extend webpack config here
    */
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
