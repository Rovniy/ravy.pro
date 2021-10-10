<template>
	<div class="bottom">
		<ul class="icons">
			<li v-for="link in socialsList" :key="link.target">
				<a :href="link.href" :class="link.icon" rel="noopener" target="_blank" :aria-label="link.target">
					<span class="label">
						{{ link.target }}
					</span>
				</a>
			</li>
		</ul>
	</div>
</template>

<script>
const socials = [
	{
		target: 'Vkontakte',
		icon: 'fa-vk',
		href: 'https://vk.com/xploitravy'
	},
	{
		target: 'Facebook',
		icon: 'fab fa-facebook',
		href: 'https://www.facebook.com/xploitravy'
	},
	{
		target: 'LinkedIn',
		icon: 'fab fa-linkedin',
		href: 'https://www.linkedin.com/in/rovniy/'
	},
	{
		target: 'Telegram',
		icon: 'fab fa-telegram-plane',
		href: 'https://t.me/xploitravy'
	}
]

export default {
	computed: {
		socialsList() {
			return socials
		}
	}
}
</script>

<style lang="sass" scoped>
.bottom
	flex-shrink: 0
	padding: 1.5em 0 0.75em 0

	> :last-child
		margin-bottom: 0

	.open &
		border-top: solid 1px rgba(255, 255, 255, 0.05)
		box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.15)
		margin-top: auto
		@include tablet-xl
			border: none
			box-shadow: none
			margin: 0

	.icons
		font-size: 0.8em
		text-align: center
		padding: 0
		margin: 0

		li
			list-style: none
			display: inline-block
			padding-left: 0

		a
			$size: 30px
			color: #41484c
			transition: color 0.35s ease-in-out
			width: $size
			height: $size
			line-height: $size
			display: inline-block
			text-align: center
			border: 0
			&:before
				font-family: $font-awesome
				font-size: 20px
				display: inline-block
				font-style: normal
				font-variant: normal
				text-rendering: auto
				line-height: 1
				text-transform: none !important
			&:hover
				color: #fff

			span
				display: none
</style>
