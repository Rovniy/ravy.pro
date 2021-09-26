<template>
	<project-wrapper :images-list="IMAGES">
		<h1 slot="title">
			xPloit team. CS:GO team from CIS
		</h1>
		<template slot="about">
			<p>
				xPloit team was conceived as a team of semi-professionals in the discipline of Counter-Strike Global Offensive. The composition has changed many times, but the backbone of the team has always remained the same. The main team consisted of at different times:
			</p>
			<ul>
				<li>Andrew (Ravy) Rovniy</li>
				<li>Vladimir (Fantonchini) Amatov</li>
				<li>Maksim (Striker) Zhuravlev</li>
				<li>Daniel (ALp) Akimov</li>
				<li>Alexander (Seenix) Luchikhin</li>
				<li>Alexey (hharveys) Sentcov</li>
			</ul>
			<p>
				The team achieved the greatest success in the discipline of Counter-Strike 1.6 in the period from 2010 to 2012. At this time, the team held a confident TOP in the Krasnodar Territory, confidently competed with CIS teams and repeatedly became the winner of regional championships. The biggest achievement was the victory in the MSI Beat In Russia and getting into the top 3 of the WCG 2011.
			</p>
			<p>
				In the CS discipline:However, the team could not strengthen itself with a single composition and was repeatedly reformed, which clearly affected the performance. After changing the player's chair to a coach, and after the manager, he smoothly retired.
			</p>
			<p>
				The command no longer exists.
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
		title: 'xPloit team'
	},
	data: () => ({
		IMAGES: [
			'/images/projects/xploit_esports/screen_1.jpg',
			'/images/projects/xploit_esports/screen_2.jpg',
			'/images/projects/xploit_esports/screen_3.jpg',
			'/images/projects/xploit_esports/screen_4.jpg',
			'/images/projects/xploit_esports/screen_5.jpg',
			'/images/projects/xploit_esports/screen_6.jpg',
			'/images/projects/xploit_esports/screen_7.jpg',
			'/images/projects/xploit_esports/screen_8.jpg',
		]
	}),
}
</script>
