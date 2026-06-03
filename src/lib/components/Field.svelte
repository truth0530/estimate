<script lang="ts">
	// 좌측 라벨 행 — DESIGN.md: 라벨을 입력 위가 아니라 좌측에 두어 행 높이를 줄인다.
	// 라벨 열 너비를 고정해 긴 한글 라벨이 입력 폭을 침범하지 않게 한다.
	import type { Snippet } from 'svelte';
	interface Props {
		label: string;
		children: Snippet;
		hint?: string;
	}
	let { label, children, hint }: Props = $props();
</script>

<div class="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
	<span class="w-24 shrink-0 text-[13px] text-muted">{label}</span>
	<div class="min-w-0 flex-1">
		{@render children()}
	</div>
	{#if hint}<span class="shrink-0 text-[12px] text-faint">{hint}</span>{/if}
</div>
