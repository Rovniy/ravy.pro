<template>
	<div :class="['header-toggle', {'opened': isAsideOpen}]" @click="toggleSidebar">
		<span class="title">
			Menu
		</span>
	</div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
	computed: {
		...mapGetters({
			isAsideOpen: 'sidebar/isAsideOpen'
		})
	},
	methods: {
		...mapActions({
			toggleSidebar: 'sidebar/toggleSidebar'
		}),
	    hideSidebar() {

	    }
	}
}
</script>

<style lang="sass" scoped>
.header-toggle
	position: fixed
	top: 0
	left: 0
	width: 100vw
	height: $header_height
	background: $color_sidebar
	display: flex
	align-items: center
	justify-content: center
	z-index: 10001
	transition: all .5s ease
	will-change: transform
	@include tablet-xl
		display: none
		visibility: hidden

	&.opened
		transform: translateX($sidebar-medium-width)

		.title
			opacity: 0

	.title
		color: #fff
		font-weight: 600
		transition: all 1s ease
		opacity: 1
		font-size: 18px
</style>
