<script lang="ts">
	import { db, uid } from '$lib/data/db.svelte';
	import type { Company } from '$lib/types';
	import Field from '$lib/components/Field.svelte';
	import Button from '$lib/components/Button.svelte';

	function current(): Company {
		return (
			db.company ?? {
				id: '',
				business_number: '',
				name: '',
				ceo_name: '',
				address: '',
				phone: '',
				logo_data: null,
				stamp_data: null,
				bank_account: '',
				is_tax_free: false
			}
		);
	}
	let form = $state<Company>({ ...current() });
	let saved = $state(false);

	function readImage(file: File, set: (d: string) => void) {
		const reader = new FileReader();
		reader.onload = () => set(reader.result as string);
		reader.readAsDataURL(file);
	}
	function onLogo(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) readImage(f, (d) => (form.logo_data = d));
	}
	function onStamp(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) readImage(f, (d) => (form.stamp_data = d));
	}
	function save() {
		db.saveCompany({ ...form, id: form.id || uid() });
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}
</script>

<div class="flex items-center justify-between pt-5 pb-3">
	<h1 class="text-[20px]">설정</h1>
	{#if saved}<span class="text-[13px] text-accepted">저장됨</span>{/if}
</div>

<section class="pb-2">
	<h2 class="border-b border-line-strong pb-1.5 text-[13px] font-semibold text-strong">회사 정보</h2>
	<Field label="상호"><input class="inp" bind:value={form.name} /></Field>
	<Field label="사업자번호"><input class="inp num" placeholder="000-00-00000" bind:value={form.business_number} /></Field>
	<Field label="대표자"><input class="inp" bind:value={form.ceo_name} /></Field>
	<Field label="주소"><input class="inp" bind:value={form.address} /></Field>
	<Field label="연락처"><input class="inp num" bind:value={form.phone} /></Field>
	<Field label="입금계좌"><input class="inp" bind:value={form.bank_account} /></Field>
</section>

<section class="pt-4 pb-2">
	<h2 class="border-b border-line-strong pb-1.5 text-[13px] font-semibold text-strong">로고 · 직인</h2>
	<div class="flex items-center gap-4 border-b border-line py-3">
		<div class="flex h-14 w-24 items-center justify-center border border-line text-[12px] text-faint">
			{#if form.logo_data}<img src={form.logo_data} alt="로고" class="max-h-12 max-w-20 object-contain" />{:else}로고{/if}
		</div>
		<label class="text-[14px] text-accent">
			<input type="file" accept="image/*" class="hidden" onchange={onLogo} />
			<span class="cursor-pointer">로고 업로드</span>
		</label>
		{#if form.logo_data}<button class="text-[13px] text-faint hover:text-danger" onclick={() => (form.logo_data = null)}>제거</button>{/if}
	</div>
	<div class="flex items-center gap-4 py-3">
		<div class="flex h-14 w-14 items-center justify-center rounded-full border border-line text-[12px] text-faint">
			{#if form.stamp_data}<img src={form.stamp_data} alt="직인" class="max-h-12 object-contain" />{:else}직인{/if}
		</div>
		<label class="text-[14px] text-accent">
			<input type="file" accept="image/*" class="hidden" onchange={onStamp} />
			<span class="cursor-pointer">직인 업로드</span>
		</label>
		{#if form.stamp_data}<button class="text-[13px] text-faint hover:text-danger" onclick={() => (form.stamp_data = null)}>제거</button>{/if}
	</div>
</section>

<section class="pt-4 pb-2">
	<h2 class="border-b border-line-strong pb-1.5 text-[13px] font-semibold text-strong">과세</h2>
	<label class="flex items-center justify-between py-3">
		<span class="text-[14px] text-text">면세 사업자 (세액 0 처리)</span>
		<input type="checkbox" class="size-4" bind:checked={form.is_tax_free} />
	</label>
</section>

<div class="fixed inset-x-0 bottom-0 border-t border-line-strong bg-surface">
	<div class="mx-auto max-w-3xl px-4 py-3">
		<Button variant="primary" onclick={save} class="w-full">저장</Button>
	</div>
</div>
