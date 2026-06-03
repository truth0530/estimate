<script lang="ts">
	import { db, uid } from '$lib/data/db.svelte';
	import type { Company } from '$lib/types';
	import Field from '$lib/components/Field.svelte';
	import Button from '$lib/components/Button.svelte';
	import { compressImage } from '$lib/image';
	import { formatBytes, daysSince, lastBackupLabel } from '$lib/format';

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

	// 업로드 이미지는 리사이즈·압축해 localStorage 용량 잠식을 막는다.
	async function onLogo(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) form.logo_data = await compressImage(f, 512);
	}
	async function onStamp(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) form.stamp_data = await compressImage(f, 400);
	}
	let backupMsg = $state('');
	const usage = $derived(db.usageBytes());
	const backupDays = $derived(daysSince(db.lastBackupAt, Date.now()));

	function exportBackup() {
		const json = db.exportSnapshot();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `견적백업_${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
	function onImport(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		if (!confirm('가져오면 현재 기기의 데이터가 백업 파일 내용으로 교체됩니다. 진행할까요?')) {
			(e.target as HTMLInputElement).value = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const res = db.importSnapshot(reader.result as string);
			backupMsg = res.ok ? '가져오기 완료' : `실패: ${res.error}`;
			if (res.ok) form = { ...current() };
			setTimeout(() => (backupMsg = ''), 3000);
		};
		reader.readAsText(f);
		(e.target as HTMLInputElement).value = '';
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

<section class="pt-4 pb-2">
	<div class="flex items-baseline justify-between border-b border-line-strong pb-1.5">
		<h2 class="text-[13px] font-semibold text-strong">데이터 백업</h2>
		{#if backupMsg}<span class="text-[12px] text-accepted">{backupMsg}</span>{/if}
	</div>
	<p class="py-2 text-[12px] text-muted">
		현재 데이터는 이 브라우저에만 저장됩니다. 주기적으로 내보내 보관하고, 다른 기기로 옮길 때
		내보낸 파일을 가져오세요.
	</p>
	<div class="flex items-center justify-between pb-2 text-[12px]">
		<span class={backupDays === null || backupDays >= 7 ? 'text-rejected' : 'text-muted'}>
			{lastBackupLabel(backupDays)}
		</span>
		<span class="num text-faint">저장 사용량 {formatBytes(usage)}</span>
	</div>
	<div class="flex gap-2 pb-2">
		<Button variant="secondary" onclick={exportBackup} class="flex-1">내보내기 (.json)</Button>
		<label
			class="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded border border-line-strong text-[14px] font-medium text-text hover:bg-sunken"
		>
			<input type="file" accept="application/json,.json" class="hidden" onchange={onImport} />
			가져오기
		</label>
	</div>
</section>

<div class="fixed inset-x-0 bottom-0 border-t border-line-strong bg-surface">
	<div class="mx-auto max-w-3xl px-4 py-3">
		<Button variant="primary" onclick={save} class="w-full">저장</Button>
	</div>
</div>
