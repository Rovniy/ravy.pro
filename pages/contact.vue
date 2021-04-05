<template>
	<div>
		<contact-component />
	</div>
</template>

<script>
export default {
	head: {
		title: 'Contacts'
	},
	components: {
		ContactComponent: () => import('@/components/pages/contact')
	}
}
</script>
