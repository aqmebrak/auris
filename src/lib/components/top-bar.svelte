<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<header class="h-12 sticky top-0 z-10 bg-background border-b border-border">
	<div class="max-w-3xl mx-auto px-4 h-full flex items-center">
		<a
			href={resolve('/')}
			class="text-sm font-semibold tracking-widest uppercase text-foreground no-underline hover:opacity-80"
		>
			AURIS
		</a>
	</div>
</header>
