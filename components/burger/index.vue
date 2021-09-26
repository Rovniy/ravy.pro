<template>
	<div :class="['header-toggle', {'opened': isAsideOpen}]">
		<span class="toggle" @click="toggleSidebar" />
		<span class="title">
			Andrew (Ravy) Rovniy
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
	width: 100%
	height: $header_height
	background: #222629
	line-height: $header_height
	text-align: center
	z-index: 10001
	transition: transform .5s ease
	@include tablet-xl
		display: none
		visibility: hidden

	&.opened
		transform: translateX($sidebar-medium-width)

		.title
			opacity: 0

	.toggle
		position: absolute
		left: 0
		top: 0
		width: 100%
		height: 100%
		&:before
			$width: 20px
			font-family: $font-awesome
			color: #fff
			content: '\f0c9'
			font-size: 18px
			border-radius: 6px
			text-align: center
			position: absolute
			left: 16px
			top: 13px
			display: block
			width: $width
			height: $width
			line-height: $width
		&:hover
			color: $color-base

	.title
		color: #fff
		font-weight: 600
		transition: opacity .2s ease
		opacity: 1
		font-size: 18px
</style>
