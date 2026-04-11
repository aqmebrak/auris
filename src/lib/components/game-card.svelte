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

<Card.Root class="flex h-full flex-col justify-between gap-6 py-6 has-data-[slot=card-footer]:pb-6">
	<Card.Header class="gap-2 px-6">
		<Card.Title class="text-base font-semibold tracking-wide">{title}</Card.Title>
		<Card.Description class="text-sm">{description}</Card.Description>
	</Card.Header>
	<Card.Footer class="justify-center px-6 pt-4 pb-6">
		{#if available}
			<Button size="lg" {href} class="px-8 tracking-widest">PLAY</Button>
		{:else}
			<Button variant="outline" size="lg" disabled class="px-8 tracking-widest uppercase"
				>COMING SOON</Button
			>
		{/if}
	</Card.Footer>
</Card.Root>
