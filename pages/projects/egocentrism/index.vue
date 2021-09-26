<template>
	<project-wrapper :nav-list="NAVIGATION" :images-list="IMAGES" :youtube-video="YOUTUBE">
		<h1 slot="title">
			Egocetrism. Mobile game
		</h1>
		<template slot="about">
			<p>
				The game was created as part of participation in the <a href="https://thegdwc.com/" target="_blank">
					GDWC 2020
				</a> competition and was recognized as one of the best concepts in the Indie genre.
			</p>
			<p>Being a non-standard platformer, it was recognized by both the younger audience for its pretentious appearance, and the older generation for its creative approach to the organization of gameplay.</p>
			<p>In 2021, he will also participate in competitions in the genre of amateur games.</p>

			<a href="https://thegdwc.com/" target="_blank">
				<img src="/images/projects/egocentrism/gdwc_badge.png" width="200" height="200" alt="gdwc">
			</a>
		</template>
	</project-wrapper>
</template>

<script>
export default {
	components: {
		ProjectWrapper: () => import('@/components/pages/projects/ProjectWrapper'),
	},
	head: {
		title: 'Egocentrism'
	},
	data: () => ({
		NAVIGATION: [
			{
				link: '/projects/egocentrism/privacy_policy',
				text: 'Privacy policy'
			},
			{
				link: 'https://play.google.com/',
				text: 'Google Play',
				blank: true
			}
		],
		IMAGES: [
			'/images/projects/egocentrism/screen_1.jpg',
			'/images/projects/egocentrism/screen_2.jpg',
			'/images/projects/egocentrism/screen_3.jpg',
		],
		YOUTUBE: 'https://www.youtube.com/embed/h5XDP7IiAxU'
	}),
}
</script>
