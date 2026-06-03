<script lang="ts">
	import { page } from '$app/state';
	import { db } from '$lib/data/db.svelte';
	import { won } from '$lib/money';
	import { koreanAmount } from '$lib/korean-number';

	const quote = $derived(db.getQuote(page.params.id ?? null));
	const customer = $derived(quote ? db.getCustomer(quote.customer_id) : null);
	const company = $derived(db.company);
	const taxFree = $derived(company?.is_tax_free ?? false);

	// A4(96dpi) 폭. 화면에서는 프레임 폭에 맞춰 통째로 축소해 가로 스크롤을 없앤다.
	const A4W = 794;
	let frameW = $state(0);
	let sheetH = $state(1123);
	const scale = $derived(frameW ? Math.min(1, frameW / A4W) : 1);
</script>

<svelte:head><title>견적서 {quote?.quote_number ?? ''}</title></svelte:head>

{#if !quote}
	<p style="padding:40px">견적서를 찾을 수 없습니다.</p>
{:else}
	<div class="toolbar">
		<a href="/quotes/{quote.id}">← 돌아가기</a>
		<button onclick={() => window.print()}>인쇄 / PDF로 저장</button>
	</div>

	<div class="frame" bind:clientWidth={frameW} style="height:{sheetH * scale}px">
		<div class="sheet" bind:clientHeight={sheetH} style="transform:scale({scale})">
			<!-- 헤더: 제목 + 공급자/공급받는자 -->
			<header class="sheet-head">
				<h1 class="title">견 적 서</h1>
				<div class="meta">
					<div class="party">
						<div class="num mline">견적번호 {quote.quote_number}</div>
						<div class="num mline">발행일 {quote.issue_date}</div>
						{#if quote.valid_until}<div class="num mline">유효기간 {quote.valid_until}</div>{/if}
						<div class="recv">{customer?.name ?? ''} 귀하</div>
					</div>
					<div class="party supplier">
						<div class="sup-head">
							<span class="sup-label">공급자</span>
							{#if company?.logo_data}<img class="logo" src={company.logo_data} alt="" />{/if}
							{#if company?.stamp_data}<img class="stamp" src={company.stamp_data} alt="" />{/if}
						</div>
						<table class="sup-table">
							<tbody>
								<tr><th>상호</th><td>{company?.name ?? ''}</td></tr>
								<tr><th>사업자</th><td class="num">{company?.business_number ?? ''}</td></tr>
								<tr><th>대표</th><td>{company?.ceo_name ?? ''}</td></tr>
								<tr><th>주소</th><td>{company?.address ?? ''}</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</header>

			<!-- 본문: 합계금액(상단) + 품목 표 (남는 높이를 흡수해 푸터를 하단으로 민다) -->
			<main class="sheet-body">
				<!-- 합계금액을 표 상단에 — 최종 금액을 먼저 확인 (한국 견적/거래명세 트렌드) -->
				<div class="amount-words">
					<span class="aw-label">합계금액</span>
					<strong>{koreanAmount(quote.total_amount)}</strong>
					<span class="num">(₩{won(quote.total_amount)})</span>
				</div>

				<table class="lines">
					<thead>
						<tr>
							<th class="c-no">No</th>
							<th class="c-name">품명</th>
							<th class="c-spec">규격</th>
							<th class="c-qty">수량</th>
							<th class="c-price">단가</th>
							<th class="c-amt">공급가액</th>
							{#if !taxFree}<th class="c-vat">세액</th>{/if}
						</tr>
					</thead>
					<tbody>
						{#each quote.lines as l, i (l.id)}
							<tr>
								<td class="c-no num">{i + 1}</td>
								<td class="c-name">{l.item_name}</td>
								<td class="c-spec">{l.spec}</td>
								<td class="c-qty num">{l.quantity}{l.unit}</td>
								<td class="c-price num">{won(l.unit_price)}</td>
								<td class="c-amt num">{won(l.amount)}</td>
								{#if !taxFree}<td class="c-vat num">{won(Math.floor(l.amount * 0.1))}</td>{/if}
							</tr>
						{/each}
					</tbody>
				</table>

				<div class="totals">
					<div class="trow"><span>공급가액 합계</span><span class="num">{won(quote.supply_amount)}</span></div>
					{#if !taxFree}<div class="trow"><span>세액 합계</span><span class="num">{won(quote.vat_amount)}</span></div>{/if}
					<div class="trow grand"><span>합계 금액</span><span class="num">{won(quote.total_amount)} 원</span></div>
				</div>

				{#if quote.notes}
					<div class="notes"><strong>비고</strong><p>{quote.notes}</p></div>
				{/if}
			</main>

			<!-- 푸터: 하단 고정 -->
			<footer class="sheet-foot">
				<div class="foot-row">
					<div class="num">{#if company?.bank_account}입금계좌 {company.bank_account}{/if}</div>
					<div class="foot-note">본 견적서는 발행일로부터 30일간 유효합니다.</div>
				</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background: #f4f4f5;
		overflow-x: hidden;
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 794px;
		margin: 12px auto;
		padding: 0 12px;
	}
	.toolbar a {
		color: #3f3f46;
		font-size: 14px;
		text-decoration: none;
	}
	.toolbar button {
		height: 40px;
		padding: 0 16px;
		border: 0;
		border-radius: 6px;
		background: #18181b;
		color: #fff;
		font-size: 14px;
		cursor: pointer;
	}

	/* 화면: A4 시트를 프레임 폭에 맞게 축소. 프레임이 100%라 가로 스크롤이 없다. */
	.frame {
		width: 100%;
		max-width: 794px;
		margin: 0 auto 32px;
		overflow: hidden;
	}
	.sheet {
		width: 794px; /* A4 @96dpi */
		min-height: 1123px; /* A4 비율 (210:297) */
		transform-origin: top left;
		background: #fff;
		padding: 56px 52px;
		box-sizing: border-box;
		border: 1px solid #e4e4e7;
		color: #18181b;
		/* 헤더 상단 · 본문 신축 · 푸터 하단으로 A4를 채운다 */
		display: flex;
		flex-direction: column;
	}
	.sheet-body {
		flex: 1 0 auto;
	}

	.title {
		text-align: center;
		font-size: 30px;
		font-weight: 700;
		letter-spacing: 10px;
		margin: 0 0 32px;
	}
	.meta {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 28px;
		margin-bottom: 22px;
	}
	.mline {
		font-size: 13px;
		color: #3f3f46;
		line-height: 1.7;
	}
	.party .recv {
		margin-top: 16px;
		font-size: 18px;
		font-weight: 600;
	}
	.sup-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		position: relative;
	}
	.sup-label {
		font-weight: 600;
		font-size: 13px;
	}
	.logo {
		height: 30px;
		object-fit: contain;
	}
	.stamp {
		position: absolute;
		right: 0;
		top: -8px;
		height: 52px;
		opacity: 0.92;
	}
	.sup-table {
		width: 100%;
		border-collapse: collapse;
	}
	.sup-table th {
		width: 60px;
		text-align: left;
		font-weight: 500;
		color: #71717a;
		font-size: 12px;
		padding: 2px 0;
		vertical-align: top;
	}
	.sup-table td {
		font-size: 13px;
		padding: 2px 0;
	}
	.lines {
		width: 100%;
		border-collapse: collapse;
		margin-top: 8px;
		table-layout: fixed;
	}
	.lines th,
	.lines td {
		border: 1px solid #d4d4d8;
		padding: 8px;
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.lines thead th {
		background: #fafafa;
		font-weight: 600;
		font-size: 12px;
		text-align: center;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	.c-no { width: 38px; text-align: center; }
	.c-name { width: auto; }
	.c-spec { width: 96px; }
	.c-qty { width: 72px; text-align: right; }
	.c-price,
	.c-amt,
	.c-vat { width: 100px; text-align: right; }
	.amount-words {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin: 0 0 12px;
		border: 1px solid #18181b;
		background: #fafafa;
		padding: 12px 16px;
		font-size: 15px;
		color: #18181b;
	}
	.aw-label {
		font-size: 12px;
		font-weight: 600;
		color: #71717a;
	}
	.amount-words strong {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.amount-words .num {
		margin-left: auto;
		color: #71717a;
		white-space: nowrap;
	}
	.totals {
		margin: 16px 0 0 auto;
		width: 300px;
	}
	.trow {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		border-bottom: 1px solid #e4e4e7;
		font-size: 14px;
	}
	.trow.grand {
		border-bottom: 0;
		border-top: 2px solid #18181b;
		margin-top: 2px;
		font-weight: 700;
		font-size: 17px;
	}
	.notes {
		margin-top: 22px;
		font-size: 13px;
	}
	.notes p {
		margin: 4px 0 0;
		white-space: pre-wrap;
		color: #3f3f46;
	}
	.sheet-foot {
		margin-top: 24px;
	}
	.foot-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 16px;
		border-top: 1px solid #e4e4e7;
		padding-top: 12px;
		font-size: 12px;
		color: #3f3f46;
	}
	.foot-note {
		color: #71717a;
	}

	/* 인쇄: 스케일 해제, 진짜 A4 */
	@media print {
		:global(body) {
			background: #fff;
		}
		@page {
			size: A4;
			margin: 14mm;
		}
		.toolbar {
			display: none;
		}
		.frame {
			height: auto !important;
			max-width: none;
			overflow: visible;
		}
		.sheet {
			width: 100% !important;
			/* A4(297mm) - 상하 여백(2*14mm) ≈ 본문 높이. 푸터를 종이 하단에 고정 */
			min-height: 264mm;
			transform: none !important;
			border: 0;
			padding: 0;
		}
		.lines thead {
			display: table-header-group;
		}
		.lines tr {
			break-inside: avoid;
		}
	}
</style>
