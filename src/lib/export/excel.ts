// 견적서 Excel 내보내기 — ExcelJS 동적 import (버튼 클릭 시에만 로드).
// 견적서 화면과 같은 내용·순서를 "편집 가능한 데이터"로 담는다(숫자는 실제 셀 값).
// 시각 사본은 PDF가 담당하고, Excel은 셀에서 다시 계산·수정할 수 있는 버전이다.

import type { Company, Customer, Quote } from '$lib/types';
import { koreanAmount } from '$lib/korean-number';

export async function exportQuoteExcel(quote: Quote, company: Company | null, customer: Customer | null) {
	const ExcelJS = (await import('exceljs')).default;
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('견적서', {
		pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 } }
	});

	ws.columns = [
		{ width: 5 }, // A No
		{ width: 26 }, // B 품명
		{ width: 12 }, // C 규격
		{ width: 8 }, // D 수량
		{ width: 13 }, // E 단가
		{ width: 14 }, // F 공급가액
		{ width: 12 } // G 세액
	];

	const ink = 'FF18181B';
	const line = 'FFD4D4D8';
	const muted = 'FF71717A';
	const sunken = 'FFFAFAFA';
	const thin = { style: 'thin' as const, color: { argb: line } };
	const box = { top: thin, left: thin, bottom: thin, right: thin };
	const taxFree = company?.is_tax_free ?? false;

	// ── 제목 ──
	ws.mergeCells('A1:G1');
	const title = ws.getCell('A1');
	title.value = '견  적  서';
	title.font = { size: 22, bold: true, color: { argb: ink } };
	title.alignment = { horizontal: 'center', vertical: 'middle' };
	ws.getRow(1).height = 40;

	// ── 메타: 좌(견적정보) / 우(공급자) ──
	const meta: Array<[string, string]> = [
		[`견적번호   ${quote.quote_number}`, `공급자   ${company?.name ?? ''}`],
		[`발행일      ${quote.issue_date}`, `사업자   ${company?.business_number ?? ''}`],
		[`유효기간   ${quote.valid_until ?? '-'}`, `대표      ${company?.ceo_name ?? ''}`],
		['', `주소      ${company?.address ?? ''}`]
	];
	meta.forEach(([left, right], i) => {
		const r = 3 + i;
		ws.mergeCells(r, 1, r, 3);
		const lc = ws.getCell(r, 1);
		lc.value = left;
		lc.font = { size: 11, color: { argb: 'FF3F3F46' } };
		ws.mergeCells(r, 5, r, 7);
		const rc = ws.getCell(r, 5);
		rc.value = right;
		rc.font = { size: 11, bold: i === 0, color: { argb: i === 0 ? ink : 'FF3F3F46' } };
	});

	// 공급받는자
	ws.mergeCells('A8:D8');
	const recv = ws.getCell('A8');
	recv.value = `${customer?.name ?? ''} 귀하`;
	recv.font = { size: 15, bold: true, color: { argb: ink } };
	ws.getRow(8).height = 24;

	// ── 합계금액 (한글) 상단 배너 ──
	ws.mergeCells('A10:G10');
	const band = ws.getCell('A10');
	band.value = {
		richText: [
			{ text: '합계금액    ', font: { size: 11, color: { argb: muted } } },
			{ text: koreanAmount(quote.total_amount), font: { size: 13, bold: true, color: { argb: ink } } },
			{ text: `    (₩${quote.total_amount.toLocaleString('ko-KR')})`, font: { size: 11, color: { argb: muted } } }
		]
	};
	band.alignment = { horizontal: 'left', vertical: 'middle' };
	band.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sunken } };
	['A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10'].forEach((a) => (ws.getCell(a).border = box));
	ws.getRow(10).height = 26;

	// ── 품목 표 ──
	const headRow = 12;
	const heads = ['No', '품명', '규격', '수량', '단가', '공급가액', '세액'];
	heads.forEach((h, i) => {
		const cell = ws.getCell(headRow, i + 1);
		cell.value = h;
		cell.font = { bold: true, size: 10, color: { argb: ink } };
		cell.alignment = { horizontal: 'center', vertical: 'middle' };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sunken } };
		cell.border = box;
	});
	ws.getRow(headRow).height = 20;

	quote.lines.forEach((l, idx) => {
		const r = headRow + 1 + idx;
		const vat = taxFree ? 0 : Math.floor(l.amount * 0.1);
		const cells: Array<{ v: string | number; align?: 'center' | 'right'; num?: boolean }> = [
			{ v: idx + 1, align: 'center' },
			{ v: l.item_name },
			{ v: l.spec },
			{ v: l.quantity, align: 'right' },
			{ v: l.unit_price, align: 'right', num: true },
			{ v: l.amount, align: 'right', num: true },
			{ v: vat, align: 'right', num: true }
		];
		cells.forEach((c, i) => {
			const cell = ws.getCell(r, i + 1);
			cell.value = c.v as never;
			cell.border = box;
			cell.font = { size: 10 };
			if (c.align) cell.alignment = { horizontal: c.align, vertical: 'middle' };
			if (c.num) cell.numFmt = '#,##0';
		});
	});

	// ── 합계 (공급가액·세액) ──
	let r = headRow + 1 + quote.lines.length;
	const totals: Array<[string, number]> = taxFree
		? [['공급가액 합계', quote.supply_amount]]
		: [
				['공급가액 합계', quote.supply_amount],
				['세액 합계', quote.vat_amount]
			];
	totals.forEach(([label, val]) => {
		ws.mergeCells(r, 1, r, 5);
		const lc = ws.getCell(r, 1);
		lc.value = label;
		lc.alignment = { horizontal: 'right', vertical: 'middle' };
		lc.font = { size: 11, color: { argb: 'FF3F3F46' } };
		lc.border = box;
		ws.mergeCells(r, 6, r, 7);
		const vc = ws.getCell(r, 6);
		vc.value = val;
		vc.numFmt = '#,##0';
		vc.alignment = { horizontal: 'right', vertical: 'middle' };
		vc.font = { size: 11, color: { argb: ink } };
		vc.border = box;
		r++;
	});

	// ── 비고 ──
	if (quote.notes) {
		r += 1;
		ws.mergeCells(r, 1, r, 7);
		const n = ws.getCell(r, 1);
		n.value = `비고   ${quote.notes}`;
		n.font = { size: 10, color: { argb: 'FF3F3F46' } };
		n.alignment = { wrapText: true, vertical: 'top' };
		r++;
	}

	// ── 입금계좌 ──
	if (company?.bank_account) {
		r += 1;
		ws.mergeCells(r, 1, r, 7);
		const bk = ws.getCell(r, 1);
		bk.value = `입금계좌   ${company.bank_account}`;
		bk.font = { size: 10, color: { argb: 'FF3F3F46' } };
	}

	const buf = await wb.xlsx.writeBuffer();
	const blob = new Blob([buf], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `견적서_${quote.quote_number}.xlsx`;
	a.click();
	URL.revokeObjectURL(url);
}
