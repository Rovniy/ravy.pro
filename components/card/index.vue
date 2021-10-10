<template>
	<article :ref="refHash"
		class="card_wrap"
		@click="goToLink"
		@mousemove="handleMouseMove"
		@mouseenter="handleMouseEnter"
		@mouseleave="handleMouseLeave">
		<div class="card" :style="cardStyle">
			<div class="bg" :style="[ cardBgTransform, cardBgImage ]" />
			<div class="info">
				<slot name="header" />
				<slot name="content" />
				<slot name="date" />
			</div>
		</div>
	</article>
</template>

<script>
import hash from '@/utils/hash'

export default {
	props: {
		dataImage: {
			type: String,
			default: ''
		},
		link: {
			type: String,
			default: '/'
		}
	},
	data: () => ({
		width: 0,
		height: 0,
		mouseX: 0,
		mouseY: 0,
		mouseLeaveDelay: null,
		ident: hash()
	}),
	computed: {
		refHash() {
			return `card${this.ident}`
		},
		mousePX() {
			return this.mouseX / this.width
		},
		mousePY() {
			return this.mouseY / this.height
		},
		cardStyle() {
			const rX = this.mousePX * 30
			const rY = this.mousePY * -30
			return {
				transform: `rotateY(${rX}deg) rotateX(${rY}deg)`
			}
		},
		cardBgTransform() {
			const tX = this.mousePX * -40
			const tY = this.mousePY * -40
			return {
				transform: `translateX(${tX}px) translateY(${tY}px)`
			}
		},
		cardBgImage() {
			return {
				backgroundImage: `url(${this.dataImage})`
			}
		}
	},
	updated() {
		const card = this.$refs[this.refHash]

		this.width = card.offsetWidth
		this.height = card.offsetHeight
	},
	methods: {
		handleMouseMove(event) {
			const limit = 130

			this.mouseX = event.target ? (event.pageX - event.target.offsetLeft - this.width / 2) : 0
			this.mouseY = event.target ? (event.pageY - event.target.offsetTop - this.height / 2) : 0

			if (this.mouseX < -limit || this.mouseX > limit)
				this.mouseX = event.target ? (event.pageX - event.target.offsetLeft - this.width * 2) : 0
		},
		handleMouseEnter() {
			clearTimeout(this.mouseLeaveDelay)
		},
		handleMouseLeave() {
			this.mouseLeaveDelay = setTimeout(()=>{
				this.mouseX = 0
				this.mouseY = 0
			}, 1000)
		},
		goToLink() {
			this.$router.push(this.link)
		}
	}
}
</script>

<style lang="sass">
$hoverEasing: cubic-bezier(0.23, 1, 0.32, 1)
$returnEasing: cubic-bezier(0.445, 0.05, 0.55, 0.95)

.card_wrap
	display: block
	margin: 10px
	transform: perspective(800px)
	transform-style: preserve-3d
	cursor: pointer

	.card
		pointer-events: none
		position: relative
		flex: 0 0 240px
		width: 240px
		height: 320px
		background-color: #333
		overflow: hidden
		border-radius: 10px
		display: block
		box-shadow: rgba(black, 0.66) 0 30px 60px 0, inset #333 0 0 0 5px, inset rgba(white, 0.5) 0 0 0 6px
		transition: 1s $returnEasing

		.bg
			opacity: 0.5
			position: absolute
			top: -20px
			left: -20px
			width: 100%
			height: 100%
			padding: 20px
			background-repeat: no-repeat
			background-position: center
			background-size: cover
			box-sizing: content-box
			transition: 1s $returnEasing, opacity 5s 1s $returnEasing
			pointer-events: none


		.info
			padding: 20px
			position: absolute
			left: 0
			right: 0
			bottom: 0
			color: #fff
			transform: translateY(40%)
			transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1)

			h2
				font: 400 28px/28px $main-font-family
				text-shadow: rgba(black, 0.5) 0 10px 10px

			p
				opacity: 0
				display: block
				margin: 0
				text-shadow: rgba(black, 1) 0 2px 3px
				transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1)

			*
				position: relative
				z-index: 1

			&:after
				content: ''
				position: absolute
				top: 0
				left: 0
				z-index: 0
				width: 100%
				height: 100%
				background-image: linear-gradient(to bottom, transparent 0%, rgba(#000, 0.6) 100%)
				background-blend-mode: overlay
				opacity: 0
				transform: translateY(100%)
				transition: 5s 1s $returnEasing

	&:hover
		.card
			transition: 0.6s $hoverEasing, box-shadow 2s $hoverEasing
			box-shadow: rgba(white, 0.2) 0 0 40px 5px, rgba(white, 1) 0 0 0 1px, rgba(black, 0.66) 0 30px 60px 0, inset #333 0 0 0 5px, inset white 0 0 0 6px

			.bg
				transition: 0.6s $hoverEasing, opacity 5s $hoverEasing
				opacity: 0.8

			.info
				transform: translateY(0)
				transition: 0.6s $hoverEasing

				p
					transition: 0.6s $hoverEasing
					opacity: 1

				&:after
					transition: 5s $hoverEasing
					opacity: 1
					transform: translateY(0)

</style>
