<script lang="ts">
	import { db } from '$lib/data/db.svelte';
	import { won } from '$lib/money';
	import StatusDot from '$lib/components/StatusDot.svelte';
	import Button from '$lib/components/Button.svelte';

	const quotes = $derived(db.quotesSorted);
	function customerName(id: string | null) {
		return db.getCustomer(id)?.name ?? '거래처 미지정';
	}
</script>

<div class="flex items-center justify-between pt-5 pb-3">
	<h1 class="text-[20px]">견적서</h1>
	<Button variant="primary" href="/quotes/new">새 견적</Button>
</div>

{#if quotes.length === 0}
	<div class="border-t border-line py-20 text-center">
		<p class="text-[15px] text-muted">아직 작성한 견적서가 없습니다.</p>
		<a href="/quotes/new" class="mt-2 inline-block text-[14px] font-medium text-accent">첫 견적 작성하기</a>
	</div>
{:else}
	<div class="border-t border-line">
		{#each quotes as q (q.id)}
			<a
				href="/quotes/{q.id}"
				class="flex items-center gap-3 border-b border-line py-3 hover:bg-sunken"
			>
				<div class="min-w-0 flex-1">
					<div class="flex items-baseline gap-2">
						<span class="num text-[13px] text-muted">{q.quote_number}</span>
						<StatusDot status={q.status} />
					</div>
					<div class="truncate-cell pt-0.5 text-[15px] font-medium text-strong">
						{customerName(q.customer_id)}
					</div>
				</div>
				<div class="shrink-0 text-right">
					<div class="num text-[15px] font-semibold text-strong">{won(q.total_amount)}</div>
					<div class="num pt-0.5 text-[12px] text-faint">{q.issue_date}</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
