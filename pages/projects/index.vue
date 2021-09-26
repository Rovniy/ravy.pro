<template>
	<section class="projects-section">
		<div class="container">
			<article v-for="(article, key) in ArticlesList" :key="key" class="article">
				<nuxt-link :to="article.link" class="link">
					<img :src="article.image" :alt="article.title">
				</nuxt-link>
				<header>
					<h5 class="title">
						{{ article.title }}
					</h5>
					<h6 class="sub_title">
						{{ article.sub_title }}
					</h6>
				</header>
			</article>
		</div>
	</section>
</template>

<script>
import { ARTICLES } from '@/components/pages/projects/articles'

export default {
	head: {
		title: 'Projects'
	},
	computed: {
		ArticlesList() {
			return ARTICLES
		}
	}
}
</script>

<style lang="sass" scoped>
.projects-section
	height: 100%
	min-height: 100vh!important
	background: #e8edec
	background-size: cover
	display: flex
	align-items: center
	justify-content: center

	.container
		display: grid
		justify-items: center
		align-items: start
		justify-content: space-between
		align-content: start
		grid-auto-flow: row
		grid-column-gap: 10px
		grid-row-gap: 10px
		grid-template-columns: 1fr 1fr
		@include tablet-xl
			grid-template-columns: 1fr 1fr 1fr
		@include desktop-xl
			grid-template-columns: 1fr 1fr 1fr 1fr

.article
	width: 100%
	overflow: hidden
	box-shadow: 0 0.05em 0.15em 0 rgba(0, 0, 0, 0.05)

	.link
		width: 100%
		display: block
		overflow: hidden
		&:hover
			img
				transform: scale(1.1)
		img
			transition: transform .2s ease
			width: 100%
			display: block

	header
		background: #fff
		margin: 0
		padding: 15px 10px

		.title
			text-align: left
			margin: 0

		.sub_title
			text-align: left
			margin: 0
			font-size: 14px
			color: #43454B
			opacity: .5
</style>
