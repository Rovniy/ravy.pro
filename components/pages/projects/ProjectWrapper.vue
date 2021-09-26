<template>
	<section class="projects-section">
		<div class="container">
			<slot name="title" />

			<hr>

			<nav class="sub_menu">
				<ul>
					<li v-for="(nav, key) in navList" :key="key">
						<a :href="nav.link" rel="noopener" :target="nav.blank ? '_blank' : '_self'">
							{{ nav.text }}
						</a>
					</li>
				</ul>
			</nav>

			<div class="about">
				<h2>About project:</h2>
				<slot name="about" />
			</div>

			<div class="screenshots">
				<h2>Gallery:</h2>
				<gallery :source="imagesList" />
			</div>

			<div v-if="youtubeVideo" class="video">
				<h2>Video:</h2>

				<iframe
					width="560"
					height="315"
					:src="youtubeVideo"
					title="YouTube video player"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen />
			</div>
		</div>
	</section>
</template>

<script>
export default {
	components: {
		Gallery: () => import('@/components/gallery')
	},
	props: {
		navList: {
			type: Array,
			default: () => []
		},
		imagesList: {
			type: Array,
			default: () => []
		},
		youtubeVideo: {
			type: String,
			default: ''
		}
	},
}
</script>

<style lang="sass" scoped>
.projects-section
	background: #e8edec
	display: flex
	align-items: flex-start
	justify-content: center
</style>
