<script lang="ts">
	import { db, uid } from '$lib/data/db.svelte';
	import type { Customer } from '$lib/types';
	import Button from '$lib/components/Button.svelte';

	let editing = $state<Customer | null>(null);

	function blank(): Customer {
		return { id: '', name: '', business_number: '', ceo_name: '', address: '', contact: '', memo: '' };
	}
	function startNew() {
		editing = blank();
	}
	function startEdit(c: Customer) {
		editing = { ...c };
	}
	function save() {
		if (!editing || !editing.name.trim()) return;
		db.saveCustomer({ ...editing, id: editing.id || uid() });
		editing = null;
	}
	function remove(id: string) {
		if (confirm('이 거래처를 삭제할까요?')) db.removeCustomer(id);
	}
</script>

<div class="flex items-center justify-between pt-5 pb-3">
	<h1 class="text-[20px]">거래처</h1>
	<Button variant="primary" onclick={startNew}>거래처 추가</Button>
</div>

{#if editing}
	<div class="border-y border-line-strong py-3">
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
			<input class="inp" placeholder="상호 *" bind:value={editing.name} />
			<input class="inp" placeholder="사업자등록번호" bind:value={editing.business_number} />
			<input class="inp" placeholder="대표자" bind:value={editing.ceo_name} />
			<input class="inp" placeholder="연락처" bind:value={editing.contact} />
			<input class="inp sm:col-span-2" placeholder="주소" bind:value={editing.address} />
		</div>
		<div class="mt-2 flex gap-2">
			<Button variant="secondary" onclick={() => (editing = null)} class="flex-1">취소</Button>
			<Button variant="primary" onclick={save} disabled={!editing.name.trim()} class="flex-[2]">
				저장
			</Button>
		</div>
	</div>
{/if}

{#if db.customers.length === 0 && !editing}
	<div class="border-t border-line py-20 text-center text-muted">등록된 거래처가 없습니다.</div>
{:else}
	<div class="border-t border-line">
		{#each db.customers as c (c.id)}
			<div class="flex items-center gap-3 border-b border-line py-3">
				<div class="min-w-0 flex-1">
					<div class="truncate-cell text-[15px] font-medium text-strong">{c.name}</div>
					<div class="num truncate-cell pt-0.5 text-[13px] text-muted">
						{c.business_number}{c.contact ? ` · ${c.contact}` : ''}
					</div>
				</div>
				<button class="shrink-0 text-[13px] text-muted hover:text-strong" onclick={() => startEdit(c)}>수정</button>
				<button class="shrink-0 text-[13px] text-faint hover:text-danger" onclick={() => remove(c.id)}>삭제</button>
			</div>
		{/each}
	</div>
{/if}
