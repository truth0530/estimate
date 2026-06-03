<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		href?: string;
		children: Snippet;
	}
	let { variant = 'secondary', href, children, class: cls = '', ...rest }: Props = $props();

	const base =
		'inline-flex items-center justify-center rounded text-[14px] font-medium transition-colors select-none disabled:opacity-40 disabled:pointer-events-none';
	const sizes: Record<string, string> = {
		primary: 'h-11 px-5',
		secondary: 'h-11 px-5',
		danger: 'h-11 px-5',
		ghost: 'h-9 px-2'
	};
	const variants: Record<string, string> = {
		primary: 'bg-ink text-white hover:bg-ink-hover',
		secondary: 'border border-line-strong text-text hover:bg-sunken',
		ghost: 'text-muted hover:text-strong',
		danger: 'border border-line-strong text-danger hover:bg-sunken'
	};
	const klass = $derived(`${base} ${sizes[variant]} ${variants[variant]} ${cls}`);
</script>

{#if href}
	<a {href} class={klass}>{@render children()}</a>
{:else}
	<button class={klass} {...rest}>{@render children()}</button>
{/if}
