<script lang="ts">
	import { page } from '$app/state';
	import { db } from '$lib/data/db.svelte';
	import BackupNudge from './BackupNudge.svelte';
	let { children } = $props();

	const nav = [
		{ href: '/', label: '견적', icon: 'doc' },
		{ href: '/customers', label: '거래처', icon: 'people' },
		{ href: '/items', label: '품목', icon: 'box' },
		{ href: '/settings', label: '설정', icon: 'gear' }
	];

	function active(href: string): boolean {
		const p = page.url.pathname;
		if (href === '/') return p === '/' || p.startsWith('/quotes');
		return p.startsWith(href);
	}

	const path = $derived(page.url.pathname);
	const isPrint = $derived(path.endsWith('/print'));
	const isLogin = $derived(path === '/login');
	// 자체 하단 액션바를 가진 폼 화면에서는 독바를 숨긴다 (이중 고정바 방지).
	// 설정은 목적지 화면이라 독바를 유지한다(빠져나갈 길 확보) — 저장은 인라인 버튼.
	const isForm = $derived(path === '/quotes/new' || /\/quotes\/[^/]+\/edit$/.test(path));
	const showDock = $derived(!isPrint && !isLogin && !isForm);
</script>

{#if isPrint}
	{@render children()}
{:else}
	<div class="min-h-dvh bg-bg text-text">
		<header class="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
			<div class="mx-auto flex h-12 max-w-3xl items-center px-4">
				<a href="/" class="text-[15px] font-semibold tracking-tight text-strong">견적서</a>
			</div>
		</header>

		{#if db.saveError}
			<div class="border-b border-rejected/30 bg-rejected/5 px-4 py-2">
				<div class="mx-auto flex max-w-3xl items-start gap-3 text-[13px] text-rejected">
					<span class="flex-1">{db.saveError}</span>
					<button class="shrink-0 font-medium hover:underline" onclick={() => (db.saveError = null)}>
						닫기
					</button>
				</div>
			</div>
		{/if}

		<BackupNudge />

		<main class="mx-auto max-w-3xl px-4 {showDock ? 'pb-24' : 'pb-28'}">
			{@render children()}
		</main>

		{#if showDock}
			<nav
				class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface"
				style="padding-bottom: env(safe-area-inset-bottom);"
			>
				<div class="mx-auto flex max-w-3xl">
					{#each nav as item (item.href)}
						{@const on = active(item.href)}
						<a
							href={item.href}
							class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors
								{on ? 'text-strong' : 'text-faint hover:text-muted'}"
							aria-current={on ? 'page' : undefined}
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width={on ? 2 : 1.6}
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								{#if item.icon === 'doc'}
									<path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 12h6M10 16h6" />
								{:else if item.icon === 'people'}
									<circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path
										d="M16 7a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-4.9"
									/>
								{:else if item.icon === 'box'}
									<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
								{:else if item.icon === 'gear'}
									<circle cx="12" cy="12" r="3" /><path
										d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
									/>
								{/if}
							</svg>
							<span class={on ? 'font-semibold' : ''}>{item.label}</span>
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	</div>
{/if}
