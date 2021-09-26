<template>
	<section class="projects-section">
		<div class="container">
			<article v-for="article in ArticlesList" :key="article.link" class="article">
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
					<h6 class="died">
						R.I.P. {{ article.died }}
					</h6>
				</header>
			</article>
		</div>
	</section>
</template>

<script>
import { CEMETERY } from '@/components/pages/projects/articles'

export default {
	head: {
		title: 'Projects'
	},
	computed: {
		ArticlesList() {
			return CEMETERY
		}
	}
}
</script>

<style lang="sass" scoped src="~/assets/styles/pages/projects.sass" />
