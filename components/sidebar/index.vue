<template>
	<div id="sidebar" :class="{'open': isAsideOpen}">
		<div class="top">
			<logo-component />
			<nav-component />
		</div>
		<bottom-component />
	</div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
	components: {
		LogoComponent: () => import('./logo'),
		NavComponent: () => import('./nav'),
		BottomComponent: () => import('./bottom')
	},
	computed: {
		...mapGetters({
			isAsideOpen: 'sidebar/isAsideOpen'
		})
	}
}
</script>

<style lang="sass" scoped>
#sidebar
	display: flex
	flex-direction: column
	justify-content: space-between
	background: $color_sidebar url('/images/misc/overlay.png')
	box-shadow: inset -0.25em 0 0.25em 0 rgba(0, 0, 0, 0.1)
	color: #fff
	left: 0
	overflow-y: auto
	position: fixed
	text-align: right
	top: 0
	min-height: 100%
	min-width: $sidebar-min-width
	width: 20%
	transition: transform .5s ease
	transform: translateX(-$sidebar-min-width)
	backface-visibility: hidden
	@include tablet-xl
		left: 0
		transform: translateX(0)
	@include desktop
		width: $sidebar-medium-width
	@include desktop-xl
		width: $sidebar-max-width

	&.open
		transform: translateX(0)
		width: $sidebar-medium-width
		justify-content: flex-start
		@include tablet-xl
			width: 20%
		@include desktop
			width: $sidebar-medium-width
		@include desktop-xl
			width: $sidebar-max-width

		.top
			flex-grow: 0
			@include tablet-xl
				flex-grow: 1

	.top
		flex-grow: 1
</style>
