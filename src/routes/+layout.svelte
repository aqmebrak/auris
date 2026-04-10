<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import TopBar from '$lib/components/top-bar.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<TopBar />
{@render children()}
