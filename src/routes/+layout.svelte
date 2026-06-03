<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/components/AppShell.svelte';
	import InstallGate from '$lib/components/InstallGate.svelte';
	import { initPwaAutoUpdate } from '$lib/pwa-update';

	let { children } = $props();

	onMount(() => initPwaAutoUpdate());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>견적서</title>
</svelte:head>

<AppShell>
	{@render children()}
</AppShell>

<InstallGate />
