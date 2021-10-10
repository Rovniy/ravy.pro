<template>
	<project-wrapper>
		<h1 slot="title">
			Online show. Interactive online move.
		</h1>
		<template slot="about">
			<p>
				An unannounced project yet. Is in the development of the concept...
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
		title: 'Online show'
	}
}
</script>
