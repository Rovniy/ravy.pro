<template>
	<project-wrapper :nav-list="NAVIGATION" :images-list="IMAGES" :youtube-video="YOUTUBE">
		<h1 slot="title">
			Altcover. Designer of live images
		</h1>
		<template slot="about">
			<p>
				Altcover is a designer of dynamic images, covers, posts and avatars.
			</p>
			<p>
				The designer contains a set of light, but at the same time - interactive tools and smart widgets with which you can impress, establish contact with your audience, as well as increase the number of active users of your community or group
			</p>
			<p>
				The project could not find funding for the second round and lost the team along with key employees and ideologists. The project had to be frozen. At the moment it is working in demo mode
			</p>
		</template>
	</project-wrapper>
</template>

<script>
export default {
	components: {
		ProjectWrapper: () => import('@/components/pages/projects/ProjectWrapper'),
	},
	head: {
		title: 'Altcover'
	},
	data: () => ({
		NAVIGATION: [
			{
				link: 'https://altcover.com/',
				text: 'Website',
				blank: true
			},
		],
		IMAGES: [
			'/images/projects/altcover/screen_1.jpg',
			'/images/projects/altcover/screen_2.jpg',
			'/images/projects/altcover/screen_3.jpg',
		]
	}),
}
</script>
