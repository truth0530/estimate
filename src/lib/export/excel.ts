// 견적서 Excel 내보내기 — ExcelJS 동적 import (버튼 클릭 시에만 로드).
// 병합·테두리·서식 적용 (DESIGN.md: SheetJS Community 대신 ExcelJS).

import type { Company, Customer, Quote } from '$lib/types';
import { koreanAmount } from '$lib/korean-number';

export async function exportQuoteExcel(quote: Quote, company: Company | null, customer: Customer | null) {
	const ExcelJS = (await import('exceljs')).default;
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('견적서', {
		pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true }
	});

	ws.columns = [
		{ width: 5 },
		{ width: 26 },
		{ width: 12 },
		{ width: 8 },
		{ width: 14 },
		{ width: 14 },
		{ width: 12 }
	];

	const thin = { style: 'thin' as const, color: { argb: 'FFD4D4D8' } };
	const border = { top: thin, left: thin, bottom: thin, right: thin };

	// 제목
	ws.mergeCells('A1:G1');
	const title = ws.getCell('A1');
	title.value = '견 적 서';
	title.font = { size: 20, bold: true };
	title.alignment = { horizontal: 'center', vertical: 'middle' };
	ws.getRow(1).height = 36;

	// 메타
	ws.getCell('A3').value = `견적번호  ${quote.quote_number}`;
	ws.getCell('A4').value = `발행일      ${quote.issue_date}`;
	ws.getCell('E3').value = `공급자  ${company?.name ?? ''}`;
	ws.getCell('E4').value = `사업자  ${company?.business_number ?? ''}`;
	ws.getCell('A6').value = `공급받는자  ${customer?.name ?? ''} 귀하`;
	ws.getCell('A6').font = { bold: true };

	// 표 헤더
	const headRow = 8;
	const heads = ['No', '품명', '규격', '수량', '단가', '공급가액', '세액'];
	heads.forEach((h, i) => {
		const cell = ws.getCell(headRow, i + 1);
		cell.value = h;
		cell.font = { bold: true, size: 10 };
		cell.alignment = { horizontal: 'center', vertical: 'middle' };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
		cell.border = border;
	});

	const taxFree = company?.is_tax_free ?? false;
	quote.lines.forEach((l, idx) => {
		const r = headRow + 1 + idx;
		const vat = taxFree ? 0 : Math.floor(l.amount * 0.1);
		const row = [idx + 1, l.item_name, l.spec, l.quantity, l.unit_price, l.amount, vat];
		row.forEach((v, i) => {
			const cell = ws.getCell(r, i + 1);
			cell.value = v as never;
			cell.border = border;
			cell.font = { size: 10 };
			if (i === 0) cell.alignment = { horizontal: 'center' };
			if (i >= 3) {
				cell.alignment = { horizontal: 'right' };
				cell.numFmt = '#,##0';
			}
		});
	});

	const totalRow = headRow + 1 + quote.lines.length;
	const labels: Array<[string, number]> = [
		['공급가액 합계', quote.supply_amount],
		['세액 합계', quote.vat_amount],
		['합계 금액', quote.total_amount]
	];
	labels.forEach(([label, val], i) => {
		const r = totalRow + i;
		ws.mergeCells(r, 1, r, 5);
		const lc = ws.getCell(r, 1);
		lc.value = label;
		lc.alignment = { horizontal: 'right' };
		lc.font = { bold: i === 2, size: 10 };
		lc.border = border;
		ws.mergeCells(r, 6, r, 7);
		const vc = ws.getCell(r, 6);
		vc.value = val;
		vc.numFmt = '#,##0';
		vc.alignment = { horizontal: 'right' };
		vc.font = { bold: i === 2, size: i === 2 ? 12 : 10 };
		vc.border = border;
	});

	// 한글 금액 병기 행
	const wordsRow = totalRow + labels.length;
	ws.mergeCells(wordsRow, 1, wordsRow, 7);
	const wc = ws.getCell(wordsRow, 1);
	wc.value = koreanAmount(quote.total_amount);
	wc.alignment = { horizontal: 'center' };
	wc.font = { bold: true, size: 11 };
	wc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
	wc.border = border;

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
