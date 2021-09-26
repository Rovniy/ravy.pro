<template>
	<section class="projects-section">
		<div class="container">
			<slot name="title" class="title" />

			<hr>

			<nav v-if="navList" class="sub_menu">
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

			<div v-if="!!imagesList.length" class="screenshots">
				<h2>Gallery:</h2>
				<gallery :source="imagesList" />
			</div>

			<div v-if="youtubeVideo" class="video_wrapper">
				<h2>Video:</h2>

				<iframe
					class="video"
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

	.video_wrapper
		.video
			width: 100%
			height: auto
			max-width: 100%
			min-height: 400px
			+tablet
				width: 560px
				height: 315px
				min-height: auto

</style>
