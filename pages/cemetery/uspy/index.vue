<template>
	<project-wrapper :images-list="IMAGES">
		<h1 slot="title">
			USPY. Event marketplace
		</h1>
		<template slot="about">
			<p>Interactive event agency for the organization of holidays and any events. The essence of the project was to create a marketplace for companies providing services for renting equipment, premises, equipment for holidays, as well as talents providing services for organizing mass and personal events.</p>
			<p>This service allows you to create applications for equipment and necessary personnel. The contractor could accept the order and fulfill the order on a competitive basis.</p>
			<p>The project lasted about 2 years. The business model involved spending a lot of time to manage and organize its work. It was not possible to automate the process.</p>
			<p>The project is closed.</p>
		</template>
	</project-wrapper>
</template>

<script>
export default {
	components: {
		ProjectWrapper: () => import('@/components/pages/projects/ProjectWrapper'),
	},
	data: () => ({
		IMAGES: [
			'/images/projects/uspy/screen_1.jpg',
		]
	}),
	head: {
		title: 'StreamPub'
	},
}
</script>
