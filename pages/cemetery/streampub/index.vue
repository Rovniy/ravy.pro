<template>
	<project-wrapper :nav-list="NAVIGATION" :images-list="IMAGES">
		<h1 slot="title">
			StreamPub. Advertisement agency
		</h1>
		<template slot="about">
			<p>
				Stream Pob helps brands communicate with gamers in their language, through the integration of influencers into content, esports events and creative special projects.
			</p>
			<p>
				The project was created in close cooperation with
				<a href="https://www.facebook.com/olga.koryakina" target="_blank" rel="noreferrer">
					Olga Koryakina
				</a> (CEO),
				<a href="https://www.facebook.com/murik.tem" target="_blank" rel="noreferrer">
					Murat Temirov
				</a> (CTO) and
				<a href="https://www.facebook.com/Avakian.Arthur" target="_blank" rel="noreferrer">
					Arthur Avakyan
				</a> (CMO). After two years of active development, testing hypotheses and organizing various activities, the team found funding, but with current monetization models, it was not possible to achieve self-sufficiency. The project collapsed in the form in which it was created. At the moment,
				<a href="https://www.facebook.com/Avakian.Arthur" target="_blank" rel="noreferrer">
					Arthur Avakyan
				</a> continues to manage the company, which is now engaged only in manual advertising integration.
			</p>
			<p>Project achievements:</p>
			<ul>
				<li>
					<strong>68M+ VIEWERS (8M+ in Russia)</strong> partner network coverage per month only for Twitch.tv
				</li>
				<li>
					<strong>980+ OPINION LEADERS (710 IN Russia)</strong> participate in stream publish advertising activities
				</li>
				<li>
					<strong>200+ COMPANIES SINCE 2015</strong>
					<p>CIS:</p>
					<ol>
						<li>Jonson&Jonson</li>
						<li>PepsiCo</li>
						<li>20th Century Fox</li>
						<li>Snickers</li>
						<li>PayPal</li>
						<li>Google</li>
						<li>Nvidia</li>
						<li>Nissan</li>
						<li>Logitech</li>
					</ol>
					<p>EU and USA:</p>
					<ol>
						<li>Wargaming</li>
						<li>Razer</li>
						<li>Intel</li>
						<li>Luckbox</li>
					</ol>
				</li>
				<li>
					<strong>68M+ ЗРИТЕЛЕЙ (8М+ в РФ)</strong> охват партнерской сети в месяц только наTwitch.tv
				</li>
			</ul>
		</template>
	</project-wrapper>
</template>

<script>
export default {
	components: {
		ProjectWrapper: () => import('@/components/pages/projects/ProjectWrapper'),
	},
	data: () => ({
		NAVIGATION: [
			{
				link: 'https://streampub.net/',
				text: 'Website',
				blank: true
			}
		],
		IMAGES: [
			'/images/projects/streampub/screen_1.jpg',
			'/images/projects/streampub/screen_2.jpg',
			'/images/projects/streampub/screen_3.jpg',
			'/images/projects/streampub/screen_4.jpg',
			'/images/projects/streampub/screen_5.jpg',
			'/images/projects/streampub/screen_6.jpg',
			'/images/projects/streampub/screen_7.jpg',
			'/images/projects/streampub/screen_8.jpg',
			'/images/projects/streampub/screen_9.jpg',
		]
	}),
	head: {
		title: 'StreamPub'
	},
}
</script>
