<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/components/AppShell.svelte';
	import InstallGate from '$lib/components/InstallGate.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>견적서</title>
</svelte:head>

<AppShell>
	{@render children()}
</AppShell>

<InstallGate />
