<template>
	<div class="main-container">
		<sidebar-component />
		<burger-component />
		<nuxt :class="['content-area', {'open': isAsideOpen}]" />
	</div>
</template>

<script>
import SidebarComponent from '@/components/sidebar'
import BurgerComponent from '@/components/burger'
import { mapGetters } from 'vuex'

export default {
	components: {
		SidebarComponent,
		BurgerComponent
	},
	computed: {
		...mapGetters({
			isAsideOpen: 'sidebar/isAsideOpen'
		})
	}
}
</script>

<style lang="sass" scoped>
.main-container
	display: flex
	flex-direction: row
	justify-content: flex-start
	align-items: flex-start
	min-height: 100%

	.content-area
		transition: transform .5s ease
		margin-left: 0
		width: 100%
		height: 100%
		min-height: 100vh
		@include tablet-xl
			margin-left: $sidebar-min-width
		@include desktop
			margin-left: $sidebar-medium-width
		@include desktop-xl
			margin-left: $sidebar-max-width

		&.open
			transform: translateX($sidebar-medium-width)
			@include tablet-xl
				transform: translateX(0)
</style>
