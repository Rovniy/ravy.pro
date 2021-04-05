<template>
	<div>
		<top-section />
	</div>
</template>

<script>
export default {
	head: {
		title: 'Andrew Rovniy'
	},
	components: {
	    TopSection: () => import('@/components/pages/index/top-section')
	}
}
</script>
