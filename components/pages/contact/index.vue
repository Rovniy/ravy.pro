<template>
	<section class="top-section">
		<div class="container">
			<address v-for="address in ContactsList" :key="address.title">
				<b>{{ address.title }}</b>:
				<a :href="address.link" target="_blank">
					{{ address.text }}
				</a>
			</address>
		</div>
	</section>
</template>

<script>
const CONTACTS = [
	{
		title: 'Partnership',
		link: 'mailto:contact@ravy.pro',
		text: 'contact@ravy.pro'
	},
	{
		title: 'Games',
		link: 'mailto:games@ravy.pro',
		text: 'games@ravy.pro'
	}
]
export default {
	computed: {
		ContactsList() {
			return CONTACTS
		}
	}
}
</script>

<style lang="sass" scoped>
.top-section
	height: 100vh
	background: #e8edec
	display: flex
	align-items: center
	justify-content: center
	background-size: cover
	@include tablet-xl
		background: url('/images/backgrounds/index_intro.jpeg') no-repeat 0 100%

	.container
		@include tablet-xl
			padding-left: 20%

	address
		text-align: left
		color: #000
		font-size: 24px
		@include tablet
			font-size: 38px
		@include tablet-xl
			font-size: 40px
		@include desktop
			font-size: 42px
		@include desktop-xl
			font-size: 46px
</style>
