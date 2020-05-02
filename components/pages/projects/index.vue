<template>
	<section class="projects-section">
		<div class="container">
			<article>
				<a href="#" class="link">
					<img src="images/projects/egocentrism.jpg" alt="Egocentrism" />
				</a>
				<header>
					<h3>Egocentrism</h3>
				</header>
			</article>
			<article>
				<a href="#" class="link">
					<img src="images/projects/egocentrism.jpg" alt="Egocentrism" />
				</a>
				<header>
					<h3>Egocentrism</h3>
				</header>
			</article><article>
				<a href="#" class="link">
					<img src="images/projects/egocentrism.jpg" alt="Egocentrism" />
				</a>
				<header>
					<h3>Egocentrism</h3>
				</header>
			</article><article>
				<a href="#" class="link">
					<img src="images/projects/egocentrism.jpg" alt="Egocentrism" />
				</a>
				<header>
					<h3>Egocentrism</h3>
				</header>
			</article>
		</div>
	</section>
</template>

<script>
export default {
	computed: {}
}
</script>

<style lang="sass" scoped>
.projects-section
	height: 100vh
	background: #e8edec
	display: flex
	align-items: center
	justify-content: center

	.container
		display: flex
		align-items: flex-start
		justify-content: flex-start
		flex-direction: row
		flex-wrap: wrap

article
	width: 100%
	max-width: 50%
	overflow: hidden
	box-shadow: 0 0.05em 0.15em 0 rgba(0, 0, 0, 0.05)
	margin: 0 20px 20px 0
	&:nth-child(2n)
		margin: 0 0 20px 0
	@include tablet-xl
		width: 32%
		margin: 0 2% 20px 0
		&:nth-child(2n+3)
			margin: 0 0 25px

	.link
		width: 100%
		display: block
		overflow: hidden
		&:hover
			img
				transform: scale(1.1)
		img
			transition: transform .2s ease
			width: 100%
			display: block

	header
		background: #fff
		margin: 0
		padding: 15px 0

		h3
			text-align: center
			margin: 0


</style>
