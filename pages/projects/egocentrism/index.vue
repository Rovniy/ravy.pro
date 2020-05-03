<template>
    <section class="projects-section">
        <div class="container">
            <h1>Egocetrism <small>(v 0.1)</small></h1>
            <nav class="sub_menu">
                <ul>
                    <li v-for="(nav, key) in NavList" :key="key">
                        <a :href="nav.link" rel="noopener" :target="nav.blank ? '_blank' : '_self'">
                            {{ nav.text }}
                        </a>
                    </li>
                </ul>
            </nav>
            <p>Help cute Boo find a way out of the tangled maze! Use your imagination to find the only way to the portal that leads to Boo's home. The whole world revolves around him, or so he thinks.</p>
            <div class="screenshots">
                <gallery :source="ImagesList" />
            </div>
        </div>
    </section>
</template>

<script>
import Gallery from '@/components/gallery'

const NAVIGATION = [
    {
        link: '/projects/egocentrism/privacy_policy',
        text: 'Privacy policy'
    },
    {
        link: 'https://play.google.com/',
        text: 'Google Play',
	    blank: true
    }
]
const IMAGES = [
    '/images/projects/screen_1.jpg',
    '/images/projects/screen_2.jpg',
    '/images/projects/screen_3.jpg',
]
export default {
    components: {
	    Gallery
    },
    head: {
        title: 'Egocentrism'
    },
    computed: {
        NavList() {
            return NAVIGATION
        },
        ImagesList() {
            return IMAGES
        }
    }
}
</script>

<style lang="sass" scoped>
.projects-section
	background: #e8edec
	display: flex
	align-items: flex-start
	justify-content: center
</style>
