<template>
	<section class="top-section">
		<div class="container">
			<address v-for="address in ContactsList" :key="address.title">
				<a :href="address.link" class="link" target="_blank" rel="noreferrer">
					{{ address.text }}
				</a>
			</address>
		</div>
	</section>
</template>

<script>
const CONTACTS = [
	{
		//title: 'Partnership',
		link: 'mailto:contact@ravy.pro',
		text: 'contact@ravy.pro'
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
@keyframes gradient
	0%
		background-position: 0 50%
	50%
		background-position: 100% 50%
	100%
		background-position: 0 50%

.top-section
	height: 100vh
	background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)
	background-size: 400% 400%
	animation: gradient 15s ease infinite
	display: flex
	align-items: center
	justify-content: center

	.container
		text-align: center
		justify-content: center
		display: flex

	address
		text-align: left
		color: #fff
		font-size: 24px
		font-style: normal
		@include tablet
			font-size: 38px
		@include tablet-xl
			font-size: 40px
		@include desktop
			font-size: 42px
		@include desktop-xl
			font-size: 46px

		.link
			color: #ffffff
</style>
