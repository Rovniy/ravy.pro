<template>
	<nav class="nav">
		<ul>
			<li v-for="item in menuList" :key="item.name">
				<nuxt-link :key="item.name" :to="item.link" no-prefetch append>
					<span :class="['icon solid', item.icon]" @click="toggleSidebar">
						{{ item.name }}
					</span>
				</nuxt-link>
			</li>
		</ul>
	</nav>
</template>

<script>
import { mapActions } from 'vuex'

const MENU = [
	{
		name: 'Projects',
		icon: 'fa-th',
		link: '/projects'
	},
	{
		name: 'Contact me',
		icon: 'fa-envelope',
		link: '/contact'
	}
]
export default {
	computed: {
		menuList() {
			return MENU
		}
	},
	methods: {
    	...mapActions({
		    toggleSidebar: 'sidebar/toggleSidebar'
	    })
	}
}
</script>

<style lang="sass" scoped>
.nav
	ul
		list-style: none
		padding: 0
		margin: 0

		li
			padding-left: 0

			a
				display: block
				padding: 12px 20px
				color: rgba(255, 255, 255, 0.5)
				text-decoration: none
				outline: 0
				border: 0
				transition: none
				@include tablet-xl
					padding: 12px 40px

				.open &
					padding: 12px 20px
					@include tablet-xl
						padding: 12px 40px

				span
					position: relative
					display: block
					font-size: 20px
					line-height: 40px
					padding-right: 0
					@include tablet-xl
						font-size: 16px
						line-height: 28px
						padding-right: 20px
					@include desktop-xl
						font-size: 20px
						line-height: 40px
						padding-right: 0
					&:before
						font: $font-awesome
						position: absolute
						color: #41484c
						text-align: center
						width: 20px
						left: 0
						line-height: 40px
						@include tablet-xl
							left: 100%
							line-height: 28px
						@include desktop-xl
							left: 0
							line-height: 40px

				&:hover
					background: rgba(0, 0, 0, 0.15)
					box-shadow: inset 0 0 0.25em 0 rgba(0, 0, 0, 0.125)
					color: #fff

					span:before
						color: $color-base
				&.nuxt-link-active
					background: rgba(0, 0, 0, 0.15)
					box-shadow: inset 0 0 0.25em 0 rgba(0, 0, 0, 0.125)
					color: #fff

					span:before
						color: $color-base
</style>
