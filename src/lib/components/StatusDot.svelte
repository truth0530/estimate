<script lang="ts">
	// 상태 표시 — DESIGN.md: 색 알약 금지. 6px 점 + 텍스트, canceled는 line-through.
	import type { QuoteStatus } from '$lib/types';
	import { QUOTE_STATUS_LABEL } from '$lib/types';

	let { status }: { status: QuoteStatus } = $props();

	const dot: Record<QuoteStatus, string> = {
		draft: 'bg-draft',
		sent: 'bg-sent',
		accepted: 'bg-accepted',
		rejected: 'bg-rejected',
		canceled: 'bg-canceled'
	};
</script>

<span class="inline-flex items-center gap-1.5 text-[13px] font-medium text-text">
	<span class="size-1.5 shrink-0 rounded-full {dot[status]}"></span>
	<span class={status === 'canceled' ? 'text-muted line-through' : ''}>
		{QUOTE_STATUS_LABEL[status]}
	</span>
</span>
