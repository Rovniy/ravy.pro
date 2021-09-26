<template>
	<project-wrapper :nav-list="NAVIGATION">
		<h1 slot="title">
			Ponistraponi.ru Online store.
		</h1>
		<template slot="about">
			<p>
				The project of an online store. The main idea is to test the mechanics of
				<a href="https://p5s.ru/" target="_blank" rel="noopener">
					dropshipping
				</a>
				in a volatile market. The niche was not chosen by chance. This is a consequence of experiments that we conducted a couple of years ago on my
				<a href="https://www.youtube.com/watch?v=q7N5uBTFMrE&list=PLTRYePruc8wKZdR5vHpRxu2zieWU31tle" target="_blank" rel="noopener">
					YouTube channel
				</a>.
			</p>
			<p>
				Key characteristics: investments of less than $500, payback period of 2 months, monthly profit grows by 50-80%.
			</p>
			<p>
				At the moment, the project is being revived with a new team!
			</p>
		</template>
	</project-wrapper>
</template>

<script>
export default {
	components: {
		ProjectWrapper: () => import('@/components/pages/projects/ProjectWrapper'),
	},
	head: {
		title: 'Ponistraponi.ru'
	},
	data: () => ({
		NAVIGATION: [
			{
				link: 'https://ponistraponi.ru/',
				text: 'Website',
				blank: true
			},
		]
	})
}
</script>
