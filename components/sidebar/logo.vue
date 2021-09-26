<template>
	<div class="logo">
		<nuxt-link :to="'/'">
			<span class="avatar">
				<img src="/images/misc/avatar.jpg" alt="Avatar">
			</span>
			<span class="author">
				Andrew Rovniy
			</span>
			<p class="role">
				Founder. Inventor. Creator
			</p>
		</nuxt-link>
	</div>
</template>

<script>
export default {
	name: 'Logo'
}
</script>

<style lang="sass" scoped>
.logo
	position: relative
	margin: 20px
	min-height: $header_height
	cursor: default
	@include desktop-xl
		margin: 40px 40px 20px

	.open &
		@include desktop-xl
			margin: 40px 40px 20px

	a
		&:hover
			text-decoration: none

	.avatar
		display: block
		left: 0
		top: 0
		margin: 0
		position: absolute
		@include tablet-xl
			margin: 0 0 10px
			position: relative
		@include desktop-xl
			margin: 0
			position: absolute

		img
			$size: 52px
			width: $size
			height: $size

	.author
		position: relative
		color: #fff
		font-size: 20px
		font-weight: 600

	.role
		position: relative
		display: block
		font-size: 14px
		color: rgba(255, 255, 255, 0.5)
		margin: 10px 0 0 0
</style>
