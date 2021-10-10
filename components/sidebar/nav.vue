<template>
	<nav class="nav">
		<ul>
			<li v-for="(item, key) in menuList" :key="item.name">
				<nuxt-link :key="item.name" :to="item.link" :tabindex="key" no-prefetch append>
					<span class="item" @click="toggleSidebar">
						<i :class="['icon', item.icon ]" />
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
		name: 'Active projects',
		icon: 'far fa-lightbulb-on',
		link: '/projects'
	},
	{
		name: 'Project cemetery',
		icon: 'far fa-skull-crossbones',
		link: '/cemetery'
	},
	{
		name: 'Contact me',
		icon: 'far fa-user-edit',
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

				.item
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

					.icon
						font-family: $font-awesome
						position: absolute
						font-style: normal
						color: #41484c
						text-align: center
						width: 20px
						left: 0
						line-height: 40px
						font-size: 24px
						@include tablet-xl
							left: 100%
							line-height: 28px
						@include desktop-xl
							left: 0
							line-height: 40px

				&:hover,
				&.nuxt-link-active
					background: rgba(0, 0, 0, 0.15)
					box-shadow: inset 0 0 0.25em 0 rgba(0, 0, 0, 0.125)
					color: #fff

					.item
						.icon
							color: $color-base

</style>
