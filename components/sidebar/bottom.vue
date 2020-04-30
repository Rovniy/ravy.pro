<template>
    <div class="bottom">
        <ul class="icons">
            <li v-for="link in socialsList" :key="link.target">
                <a :href="link.href" :class="['icon brands', link.icon]">
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
        target: 'Twitter',
        icon: 'fa-twitter',
        href: '#'
    },
    {
        target: 'Facebook',
        icon: 'fa-facebook-f',
        href: '#'
    },
    {
        target: 'Github',
        icon: 'fa-github',
        href: '#'
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
		margin-top: 20px
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
				font: $font-awesome-brands
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
