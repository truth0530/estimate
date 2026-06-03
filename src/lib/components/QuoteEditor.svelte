<script lang="ts">
	import { goto } from '$app/navigation';
	import { db, uid, todayISO } from '$lib/data/db.svelte';
	import { lineAmount, computeTotals, won } from '$lib/money';
	import { parseAutofill, type ParsedLine } from '$lib/autofill';
	import { validateQuoteForSave } from '$lib/validation';
	import type { Quote, QuoteStatus } from '$lib/types';
	import { QUOTE_STATUS_LABEL } from '$lib/types';
	import Button from './Button.svelte';

	let { existing }: { existing?: Quote | null } = $props();

	interface EditLine {
		id: string;
		item_id: string | null;
		item_name: string;
		spec: string;
		unit: string;
		quantity: number;
		unit_price: number;
		editing: boolean; // 행별 뷰어/편집 모드
	}

	function blankLine(): EditLine {
		// 새 행은 입력이 필요하므로 편집 모드로 시작
		return {
			id: uid(),
			item_id: null,
			item_name: '',
			spec: '',
			unit: '',
			quantity: 1,
			unit_price: 0,
			editing: true
		};
	}

	let customerId = $state(existing?.customer_id ?? db.customers[0]?.id ?? null);
	let issueDate = $state(existing?.issue_date ?? todayISO());
	let validUntil = $state(existing?.valid_until ?? '');
	let status = $state<QuoteStatus>(existing?.status ?? 'draft');
	let notes = $state(existing?.notes ?? '');
	let lines = $state<EditLine[]>(
		existing && existing.lines.length
			? existing.lines.map((l) => ({
					id: l.id,
					item_id: l.item_id,
					item_name: l.item_name,
					spec: l.spec,
					unit: l.unit,
					quantity: l.quantity,
					unit_price: l.unit_price,
					editing: false // 기존 항목은 컴팩트 뷰로 시작
				}))
			: [blankLine()]
	);

	let smartText = $state('');

	const totals = $derived(
		computeTotals(
			lines.map((l) => ({ ...l, amount: 0, sort_order: 0 }) as any),
			db.company?.is_tax_free ?? false
		)
	);

	function onItemName(line: EditLine) {
		const match = db.activeItems.find((i) => i.name === line.item_name);
		if (match) {
			line.item_id = match.id;
			line.spec = match.spec;
			line.unit = match.unit;
			if (!line.unit_price) line.unit_price = match.unit_price;
		} else {
			line.item_id = null;
		}
	}

	function addLine() {
		lines = [...lines, blankLine()];
	}
	function removeLine(id: string) {
		lines = lines.filter((l) => l.id !== id);
	}
	function editLine(line: EditLine) {
		line.editing = true;
	}
	function doneLine(line: EditLine) {
		// 빈 행을 완료하면 제거, 아니면 컴팩트 뷰로 접기
		if (!line.item_name.trim()) removeLine(line.id);
		else line.editing = false;
	}

	function runAutofill() {
		if (!smartText.trim()) return;
		const parsed: ParsedLine[] = parseAutofill(smartText, db.activeItems);
		const newLines: EditLine[] = parsed.map((p) => ({
			id: uid(),
			item_id: p.item_id ?? null,
			item_name: p.item_name ?? '',
			spec: p.spec ?? '',
			unit: p.unit ?? '',
			quantity: p.quantity ?? 1,
			unit_price: p.unit_price ?? 0,
			editing: false // 자동 채운 항목은 컴팩트 뷰로
		}));
		// 기존이 빈 한 줄뿐이면 교체, 아니면 추가
		const onlyBlank = lines.length === 1 && !lines[0].item_name.trim();
		lines = onlyBlank ? newLines : [...lines, ...newLines];
		smartText = '';
	}

	let formError = $state('');

	function save() {
		const v = validateQuoteForSave(lines);
		if (!v.ok) {
			formError = v.error ?? '입력을 확인하세요.';
			return;
		}
		formError = '';
		const id = db.saveQuote({
			id: existing?.id,
			quote_number: existing?.quote_number,
			customer_id: customerId,
			issue_date: issueDate,
			valid_until: validUntil || null,
			status,
			notes,
			lines: v.lines
		});
		goto(`/quotes/${id}`);
	}

	const statuses: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'canceled'];
</script>

<datalist id="item-options">
	{#each db.activeItems as it (it.id)}
		<option value={it.name}></option>
	{/each}
</datalist>

<div class="pb-2">
	{#if !db.company?.name}
		<div class="mt-3 rounded border border-line bg-sunken px-3 py-2 text-[13px] text-muted">
			회사 정보가 비어 있습니다. <a href="/settings" class="font-medium text-accent">설정</a>에서 입력하면
			견적서에 반영됩니다.
		</div>
	{/if}

	<!-- 메타: 거래처 / 발행일·유효기간·상태 (라벨 너비 통일, 날짜는 1줄 2열) -->
	<section class="border-b border-line py-3">
		<div class="flex items-center gap-3 py-1.5">
			<span class="w-12 shrink-0 text-[13px] text-muted">거래처</span>
			<select class="inp min-w-0 flex-1" bind:value={customerId}>
				<option value={null} disabled>거래처 선택</option>
				{#each db.customers as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
			<a href="/customers" class="shrink-0 text-[13px] text-accent">관리</a>
		</div>
		<div class="flex items-center gap-3 py-1.5">
			<span class="w-12 shrink-0 text-[13px] text-muted">상태</span>
			<select class="inp min-w-0 flex-1" bind:value={status}>
				{#each statuses as s (s)}
					<option value={s}>{QUOTE_STATUS_LABEL[s]}</option>
				{/each}
			</select>
		</div>
		<div class="grid grid-cols-2 gap-2 pt-1">
			<label class="block">
				<span class="mb-1 block text-[12px] text-muted">발행일</span>
				<input type="date" class="inp w-full" bind:value={issueDate} />
			</label>
			<label class="block">
				<span class="mb-1 block text-[12px] text-muted">유효일</span>
				<input type="date" class="inp w-full" bind:value={validUntil} />
			</label>
		</div>
	</section>

	<!-- 자동입력 -->
	<section class="border-b border-line py-3">
		<div class="mb-1.5 flex items-baseline justify-between">
			<span class="text-[13px] font-medium text-strong">빠른 입력</span>
			<span class="text-[12px] text-faint">예: 이형철근 2톤, 시멘트 20포 8500원</span>
		</div>
		<div class="flex gap-2">
			<textarea
				class="inp flex-1"
				rows="2"
				placeholder="품목과 수량·단가를 자유롭게 적고 채우기를 누르세요"
				bind:value={smartText}
			></textarea>
			<Button variant="secondary" onclick={runAutofill}>채우기</Button>
		</div>
	</section>

	<!-- 품목 라인 (행별 뷰어/편집 모드) -->
	<section class="py-3">
		<div class="flex items-baseline justify-between border-b border-line-strong pb-1.5">
			<span class="text-[13px] font-medium text-strong">품목</span>
			<span class="text-[12px] text-faint">{lines.length}건</span>
		</div>

		{#each lines as line (line.id)}
			{#if line.editing}
				<!-- 편집 모드: 입력란 펼침 -->
				<div class="border-b border-line bg-sunken/50 px-2 py-3">
					<input
						class="inp w-full"
						list="item-options"
						placeholder="품명"
						bind:value={line.item_name}
						oninput={() => onItemName(line)}
					/>
					<div class="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
						<label class="block">
							<span class="mb-0.5 block text-[12px] text-muted">수량</span>
							<input
								type="number"
								inputmode="decimal"
								min="0"
								step="any"
								class="inp inp-num w-full"
								bind:value={line.quantity}
							/>
						</label>
						<label class="block">
							<span class="mb-0.5 block text-[12px] text-muted">단가</span>
							<input
								type="number"
								inputmode="numeric"
								min="0"
								class="inp inp-num w-full"
								bind:value={line.unit_price}
							/>
						</label>
						<div class="pb-2.5 text-right">
							<span class="mb-0.5 block text-[12px] text-muted">금액</span>
							<span class="num text-[14px] font-medium text-strong"
								>{won(lineAmount(line.quantity, line.unit_price))}</span
							>
						</div>
					</div>
					<div class="mt-2 flex justify-end gap-4">
						<button
							class="text-[13px] text-faint hover:text-danger"
							onclick={() => removeLine(line.id)}>삭제</button
						>
						<button
							class="text-[13px] font-medium text-accent hover:underline"
							onclick={() => doneLine(line)}>완료</button
						>
					</div>
				</div>
			{:else}
				<!-- 뷰어 모드: 컴팩트 텍스트 행 -->
				<div class="flex items-center gap-3 border-b border-line py-2">
					<div class="min-w-0 flex-1">
						<div class="truncate-cell text-[14px] text-strong">
							{line.item_name}{#if line.spec}<span class="ml-1 text-[12px] text-faint"
									>{line.spec}</span
								>{/if}
						</div>
						<div class="num text-[12px] text-muted">
							{line.quantity}{line.unit} × {won(line.unit_price)}원
						</div>
					</div>
					<div class="num shrink-0 text-[14px] font-medium text-strong">
						{won(lineAmount(line.quantity, line.unit_price))}
					</div>
					<button
						class="shrink-0 text-[13px] text-muted hover:text-strong"
						onclick={() => editLine(line)}>수정</button
					>
					<button
						class="shrink-0 text-[16px] leading-none text-faint hover:text-danger"
						onclick={() => removeLine(line.id)}
						aria-label="삭제">&times;</button
					>
				</div>
			{/if}
		{/each}

		<button class="mt-3 text-[14px] font-medium text-accent hover:underline" onclick={addLine}>
			+ 품목 추가
		</button>
	</section>

	<!-- 비고 -->
	<section class="border-t border-line py-3">
		<textarea class="inp" rows="2" placeholder="비고" bind:value={notes}></textarea>
	</section>
</div>

<!-- 하단 고정: 합계 + 액션 (면 분리가 아니라 헤어라인) -->
<div class="fixed inset-x-0 bottom-0 z-20 border-t border-line-strong bg-surface">
	<div class="mx-auto max-w-3xl px-4">
		{#if formError}
			<div class="pt-2 text-[13px] text-rejected">{formError}</div>
		{/if}
		<div class="flex items-center justify-between py-2 text-[13px]">
			<div class="flex gap-4 text-muted">
				<span>공급가액 <span class="num text-text">{won(totals.supply)}</span></span>
				<span>세액 <span class="num text-text">{won(totals.vat)}</span></span>
			</div>
			<div class="num text-[20px] font-semibold text-strong">{won(totals.total)}<span class="ml-1 text-[13px] font-normal text-muted">원</span></div>
		</div>
		<div class="flex gap-2 pb-3">
			<Button variant="secondary" href="/" class="flex-1">취소</Button>
			<Button variant="primary" onclick={save} class="flex-[2]">저장</Button>
		</div>
	</div>
</div>
