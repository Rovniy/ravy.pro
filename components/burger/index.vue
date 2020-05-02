<template>
    <div :class="['header-toggle', {'opened': isAsideOpen}]">
        <span class="toggle" @click="toggleSidebar" />
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
        })
    }
}
</script>

<style lang="sass" scoped>
.header-toggle
	backface-visibility: hidden
	transition: transform 0.5s ease
	display: block
	width: 70px
	height: 48px
	left: 0
	top: 0
	position: fixed
	z-index: 10001
	@include tablet-xl
		display: none
		visibility: hidden

	&.opened
		transition: transform .5s ease
		transform: translateX($sidebar-medium-width)

	.toggle
		position: absolute
		left: 0
		top: 0
		width: 100%
		height: 100%
		&:before
			$width: 55px
			$height: 40px
			font: $font-awesome
			color: #fff
			content: '\f0c9'
			font-size: 18px
			background: rgba(128, 136, 144, 0.5)
			border-radius: 6px
			text-align: center
			position: absolute
			left: 10px
			top: 10px
			display: block
			width: $width
			height: $height
			line-height: $height
		&:hover
			color: #E27689
</style>
