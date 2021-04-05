<template>
	<section class="projects-section">
		<div class="container">
			<h1>OverPRO. Next generation eSports platform for players of any level</h1>

			<nav class="sub_menu">
				<ul>
					<li v-for="(nav, key) in NavList" :key="key">
						<a :href="nav.link" rel="noopener" :target="nav.blank ? '_blank' : '_self'">
							{{ nav.text }}
						</a>
					</li>
				</ul>
			</nav>

			<p>OverPRO is a new generation eSports platform for players of any level. The application allows you to organize automated tournaments for CS: GO, CS 1.6, Dota 2 and many esports disciplines. The platform developed by SASS allows the b2b sector to conduct competitions on its own behalf, closing the marketing within itself.</p>

			<div class="screenshots">
				<gallery :source="ImagesList" />
			</div>
		</div>
	</section>
</template>

<script>
const NAVIGATION = [
	{
		link: '/misc/overpro_invest.pdf',
		text: 'Investment presentation (April 2021)',
		blank: true
	},
	{
		link: 'https://overpro.ru/',
		text: 'Web site (overpro.ru)',
	    blank: true
	}
]
const IMAGES = [
	'/images/projects/overpro/screen_1.jpg',
	'/images/projects/overpro/screen_2.jpg',
	'/images/projects/overpro/screen_3.jpg',
]
export default {
	components: {
	    Gallery: () => import('@/components/gallery')
	},
	head: {
		title: 'OverPRO'
	},
	computed: {
		NavList() {
			return NAVIGATION
		},
		ImagesList() {
			return IMAGES
		}
	}
}
</script>

<style lang="sass" scoped>
.projects-section
	background: #e8edec
	display: flex
	align-items: flex-start
	justify-content: center
</style>
