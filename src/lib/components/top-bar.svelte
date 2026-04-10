<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<header class="sticky top-0 z-10 h-12 border-b border-border bg-background">
	<div class="mx-auto flex h-full max-w-3xl items-center px-4">
		<a
			href={resolve('/')}
			class="text-sm font-semibold tracking-widest text-foreground uppercase no-underline hover:opacity-80"
		>
			AURIS
		</a>
	</div>
</header>
