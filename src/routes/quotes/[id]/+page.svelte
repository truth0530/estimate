<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db } from '$lib/data/db.svelte';
	import { won } from '$lib/money';
	import StatusDot from '$lib/components/StatusDot.svelte';
	import Button from '$lib/components/Button.svelte';
	import { exportQuoteExcel } from '$lib/export/excel';

	const quote = $derived(db.getQuote(page.params.id ?? null));
	const customer = $derived(quote ? db.getCustomer(quote.customer_id) : null);

	async function downloadExcel() {
		if (quote) await exportQuoteExcel(quote, db.company, customer);
	}
	function remove() {
		if (quote && confirm('이 견적서를 삭제할까요?')) {
			db.removeQuote(quote.id);
			goto('/');
		}
	}
</script>

{#if !quote}
	<div class="border-t border-line py-20 text-center text-muted">견적서를 찾을 수 없습니다.</div>
{:else}
	<div class="flex items-center justify-between pt-5 pb-3">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<span class="num text-[13px] text-muted">{quote.quote_number}</span>
				<StatusDot status={quote.status} />
			</div>
			<h1 class="truncate-cell pt-0.5 text-[20px]">{customer?.name ?? '거래처 미지정'}</h1>
		</div>
		<Button variant="primary" href="/quotes/{quote.id}/edit">수정</Button>
	</div>

	<!-- 메타 -->
	<div class="flex flex-wrap gap-x-6 gap-y-1 border-y border-line py-2.5 text-[13px] text-muted">
		<span>발행일 <span class="num text-text">{quote.issue_date}</span></span>
		{#if quote.valid_until}<span>유효일 <span class="num text-text">{quote.valid_until}</span></span>{/if}
		{#if customer?.business_number}<span>사업자 <span class="num text-text">{customer.business_number}</span></span>{/if}
	</div>

	<!-- 품목 표: 데스크톱 그리드 / 모바일 행 -->
	<div class="pt-3">
		<div class="hidden border-b border-line-strong pb-1.5 text-[12px] text-muted sm:grid sm:grid-cols-[24px_1fr_80px_110px_120px] sm:gap-2">
			<span>No</span><span>품명 / 규격</span>
			<span class="text-right">수량</span><span class="text-right">단가</span><span class="text-right">금액</span>
		</div>
		{#each quote.lines as l, i (l.id)}
			<div class="grid grid-cols-1 gap-0.5 border-b border-line py-2.5 sm:grid-cols-[24px_1fr_80px_110px_120px] sm:items-baseline sm:gap-2">
				<span class="hidden num text-[13px] text-faint sm:block">{i + 1}</span>
				<div class="min-w-0">
					<div class="truncate-cell text-[15px] text-strong">{l.item_name}</div>
					{#if l.spec}<div class="text-[12px] text-faint">{l.spec}</div>{/if}
				</div>
				<div class="flex justify-between sm:block sm:text-right">
					<span class="text-[12px] text-muted sm:hidden">수량</span>
					<span class="num text-[14px] text-text">{l.quantity}{l.unit}</span>
				</div>
				<div class="flex justify-between sm:block sm:text-right">
					<span class="text-[12px] text-muted sm:hidden">단가</span>
					<span class="num text-[14px] text-text">{won(l.unit_price)}</span>
				</div>
				<div class="flex justify-between sm:block sm:text-right">
					<span class="text-[12px] text-muted sm:hidden">금액</span>
					<span class="num text-[14px] font-medium text-strong">{won(l.amount)}</span>
				</div>
			</div>
		{/each}
	</div>

	<!-- 합계 -->
	<div class="mt-1 ml-auto max-w-xs">
		<div class="flex justify-between border-b border-line py-1.5 text-[14px]">
			<span class="text-muted">공급가액</span><span class="num text-text">{won(quote.supply_amount)}</span>
		</div>
		<div class="flex justify-between border-b border-line py-1.5 text-[14px]">
			<span class="text-muted">세액</span><span class="num text-text">{won(quote.vat_amount)}</span>
		</div>
		<div class="flex items-baseline justify-between py-2">
			<span class="text-[14px] font-medium text-strong">합계</span>
			<span class="num text-[22px] font-semibold text-strong">{won(quote.total_amount)}<span class="ml-1 text-[13px] font-normal text-muted">원</span></span>
		</div>
	</div>

	{#if quote.notes}
		<div class="mt-2 border-t border-line pt-3 text-[14px] text-text">
			<span class="text-muted">비고</span>
			<p class="whitespace-pre-wrap pt-1">{quote.notes}</p>
		</div>
	{/if}

	<!-- 액션 -->
	<div class="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
		<Button variant="secondary" href="/quotes/{quote.id}/print">인쇄 · PDF</Button>
		<Button variant="secondary" onclick={downloadExcel}>Excel</Button>
		<div class="flex-1"></div>
		<Button variant="danger" onclick={remove}>삭제</Button>
	</div>
{/if}
