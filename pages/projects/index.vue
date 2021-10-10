<template>
	<section class="projects-section">
		<div class="container">
			<card-component v-for="article in ArticlesList" :key="article.link" :data-image="article.image" :link="article.link">
				<h2 slot="header">
					{{ article.title }}
				</h2>
				<p slot="content">
					{{ article.sub_title }}
				</p>
				<p slot="date">
					Since: {{ article.date }}
				</p>
			</card-component>
		</div>
	</section>
</template>

<script>
import { ARTICLES } from '@/components/pages/projects/articles'

export default {
	components: {
		CardComponent: () => import('@/components/card')
	},
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

<style lang="sass" scoped src="~/assets/styles/pages/projects.sass" />
