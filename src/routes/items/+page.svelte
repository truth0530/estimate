<script lang="ts">
	import { db, uid } from '$lib/data/db.svelte';
	import { won } from '$lib/money';
	import type { Item } from '$lib/types';
	import Button from '$lib/components/Button.svelte';

	let editing = $state<Item | null>(null);

	function blank(): Item {
		return { id: '', name: '', spec: '', unit: '', unit_price: 0, category: '', active: true };
	}
	function startNew() {
		editing = blank();
	}
	function startEdit(it: Item) {
		editing = { ...it };
	}
	function save() {
		if (!editing || !editing.name.trim()) return;
		db.saveItem({ ...editing, id: editing.id || uid(), unit_price: Number(editing.unit_price) || 0 });
		editing = null;
	}
	function softDelete(id: string) {
		if (confirm('이 품목을 목록에서 숨길까요? (과거 견적은 유지됩니다)')) db.softDeleteItem(id);
	}

	const items = $derived(db.activeItems);
</script>

<div class="flex items-center justify-between pt-5 pb-3">
	<h1 class="text-[20px]">품목</h1>
	<Button variant="primary" onclick={startNew}>품목 추가</Button>
</div>

{#if editing}
	<div class="border-y border-line-strong py-3">
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
			<input class="inp" placeholder="품명 *" bind:value={editing.name} />
			<input class="inp" placeholder="규격" bind:value={editing.spec} />
			<input class="inp" placeholder="단위 (개/톤/포 등)" bind:value={editing.unit} />
			<input class="inp inp-num" type="number" inputmode="numeric" placeholder="단가" bind:value={editing.unit_price} />
			<input class="inp sm:col-span-2" placeholder="분류" bind:value={editing.category} />
		</div>
		<div class="mt-2 flex gap-2">
			<Button variant="secondary" onclick={() => (editing = null)} class="flex-1">취소</Button>
			<Button variant="primary" onclick={save} class="flex-[2]">저장</Button>
		</div>
	</div>
{/if}

{#if items.length === 0 && !editing}
	<div class="border-t border-line py-20 text-center text-muted">등록된 품목이 없습니다.</div>
{:else}
	<div class="border-t border-line">
		<div class="hidden border-b border-line-strong pb-1.5 text-[12px] text-muted sm:grid sm:grid-cols-[1fr_90px_140px_80px] sm:gap-2">
			<span>품명 / 규격</span><span>단위</span><span class="text-right">단가</span><span></span>
		</div>
		{#each items as it (it.id)}
			<div class="grid grid-cols-1 gap-0.5 border-b border-line py-2.5 sm:grid-cols-[1fr_90px_140px_80px] sm:items-center sm:gap-2">
				<div class="min-w-0">
					<div class="truncate-cell text-[15px] font-medium text-strong">{it.name}</div>
					{#if it.spec}<div class="text-[12px] text-faint">{it.spec}</div>{/if}
				</div>
				<div class="text-[13px] text-muted">{it.unit}</div>
				<div class="flex justify-between sm:block sm:text-right">
					<span class="text-[12px] text-muted sm:hidden">단가</span>
					<span class="num text-[14px] font-medium text-strong">{won(it.unit_price)}</span>
				</div>
				<div class="flex justify-end gap-3">
					<button class="text-[13px] text-muted hover:text-strong" onclick={() => startEdit(it)}>수정</button>
					<button class="text-[13px] text-faint hover:text-danger" onclick={() => softDelete(it.id)}>숨김</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
