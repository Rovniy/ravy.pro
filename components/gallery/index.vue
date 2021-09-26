<template>
	<div class="gallery">
		<client-only>
			<div class="images">
				<div v-for="img in sourceList" :key="img" class="image">
					<img :src="img" :alt="img" @click="showSingle(img)">
				</div>
			</div>
			<vue-easy-lightbox :visible="visible" :imgs="preview" @hide="handleHide" />
		</client-only>
	</div>
</template>

<script>
export default {
	props: {
		source: {
        	type: [ Array, String ],
        	default: () => []
		}
	},
	data() {
		return {
			visible: false,
			preview: null
		}
	},
	computed: {
		sourceList() {
			if (typeof this.source === 'object') {
				return this.source
			} else {
				return [ this.source ]
			}
		}
	},
	methods: {
		showSingle(preview) {
			this.preview = preview
			this.visible = true
		},
		handleHide() {
			this.visible = false
		}
	}
}
</script>

<style lang="sass" scoped>
.gallery
	width: 100%
	margin: 0
	padding: 0
	user-select: none
	.images
		display: grid
		justify-items: center
		align-items: start
		justify-content: space-between
		align-content: start
		grid-auto-flow: row
		grid-column-gap: 10px
		grid-row-gap: 10px
		grid-template-columns: 1fr 1fr
		@include tablet
			grid-template-columns: 1fr 1fr 1fr
		.image
			width: 100%
			overflow: hidden
			cursor: pointer
			font-size: 0

			img
				width: 100%
				transition: transform .2s ease-in
				&:hover
					transform: scale(1.05)
</style>
