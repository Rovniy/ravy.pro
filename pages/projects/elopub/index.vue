<template>
	<project-wrapper :nav-list="NAVIGATION" :images-list="IMAGES">
		<h1 slot="title">
			Elo.pub. Next generation eSports platform
		</h1>
		<p slot="about">
			Elo.pub is a new generation eSports platform for players of any level. The application allows you to organize automated tournaments for CS: GO, CS 1.6, Dota 2 and many esports disciplines. The platform developed by SASS allows the b2b sector to conduct competitions on its own behalf, closing the marketing within itself.
		</p>
	</project-wrapper>
</template>

<script>
export default {
	components: {
		ProjectWrapper: () => import('@/components/pages/projects/ProjectWrapper'),
	},
	data: () => ({
		NAVIGATION: [
			{
				link: '/misc/overpro_invest.pdf',
				text: 'Investment presentation',
				blank: true
			},
			{
				link: 'https://elo.pub/',
				text: 'Website',
				blank: true
			},
			{
				link: 'https://medium.com/@elopub',
				text: 'Blog',
				blank: true
			},
		],
		IMAGES: [
			'/images/projects/elopub/screen_1.jpg',
			'/images/projects/elopub/screen_2.jpg',
			'/images/projects/elopub/screen_3.jpg',
		]
	}),
	head: {
		title: 'Elo.pub'
	},
}
</script>
