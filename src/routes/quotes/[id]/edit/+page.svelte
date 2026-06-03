<script lang="ts">
	import { page } from '$app/state';
	import { db } from '$lib/data/db.svelte';
	import QuoteEditor from '$lib/components/QuoteEditor.svelte';

	const quote = $derived(db.getQuote(page.params.id ?? null));
</script>

<div class="flex items-center justify-between pt-5 pb-1">
	<h1 class="text-[20px]">견적 수정 <span class="num text-[14px] font-normal text-muted">{quote?.quote_number}</span></h1>
</div>

{#if quote}
	{#key quote.id}
		<QuoteEditor existing={quote} />
	{/key}
{:else}
	<div class="border-t border-line py-20 text-center text-muted">견적서를 찾을 수 없습니다.</div>
{/if}
