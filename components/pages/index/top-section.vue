<template>
	<section class="top-section">
		<div class="container">
			<h1 class="title">
				Andrew (Ravy) Rovniy
			</h1>
			<h2 class="sub_title">
				Founder. Inventor. Creator.
			</h2>
		</div>
	</section>
</template>

<script>
export default {
}
</script>

<style lang="sass" scoped>
.top-section
	height: 100vh
	background-color: #0d151f
	background-image: url("/images/backgrounds/index_intro_2_mobile.jpg")
	background-size: cover
	background-position: center
	background-repeat: no-repeat
	display: flex
	align-items: center
	justify-content: center
	backdrop-filter: blur(10px)
	+tablet-xl
		background-image: url("/images/backgrounds/index_intro_2.jpg")

	.title
		text-align: center
		color: #fff
		font: 400 46px/46px $main-font-family

	.sub_title
		text-align: center
		color: #fff
		font: 200 22px/22px $main-font-family
</style>
