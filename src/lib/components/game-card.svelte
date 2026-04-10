<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		title,
		description,
		href,
		available = false
	}: {
		title: string;
		description: string;
		href: string;
		available?: boolean;
	} = $props();
</script>

<Card.Root class="flex flex-col justify-between h-full">
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Footer class="pt-0">
		{#if available}
			<Button variant="outline" size="sm" {href} class="w-full">PLAY</Button>
		{:else}
			<Button variant="outline" size="sm" disabled class="w-full tracking-widest uppercase text-xs">COMING SOON</Button>
		{/if}
	</Card.Footer>
</Card.Root>
