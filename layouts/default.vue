<template>
    <div class="main-container">
        <sidebar-component />
        <burger-component />
        <nuxt :class="['content', {'open': isAsideOpen}]" />
    </div>
</template>

<script>
import SidebarComponent from '@/components/sidebar'
import BurgerComponent from '@/components/sidebar/burger'
import { mapGetters } from 'vuex'

export default {
    computed: {
        ...mapGetters({
            isAsideOpen: 'sidebar/isAsideOpen'
        })
    },
    components: {
        SidebarComponent,
        BurgerComponent
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

	.content
		transition: transform .5s ease
		margin-left: 0
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
