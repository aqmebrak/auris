<script lang="ts" generics="T extends string | number">
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		label: string;
		choices: { value: T; label: string }[];
		selected: T;
		onSelect: (value: T) => void;
	}

	let { label, choices, selected, onSelect }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">{label}</p>
	<div class="flex gap-2">
		{#each choices as choice (choice.value)}
			<Button
				class="flex-1 rounded border px-2 py-2 text-xs tracking-widest uppercase transition-colors
				{selected === choice.value
					? 'border-primary bg-primary/10 text-primary'
					: 'border-border text-muted-foreground hover:border-foreground/40'}"
				aria-pressed={selected === choice.value}
				onclick={() => onSelect(choice.value)}
			>
				{choice.label}
			</Button>
		{/each}
	</div>
</div>
