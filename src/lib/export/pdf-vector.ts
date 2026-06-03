// 벡터(텍스트) PDF — jsPDF + jspdf-autotable + 나눔고딕(OFL).
// 텍스트가 선택·복사 가능(계좌번호 등), 표는 행 경계에서 자동 페이지 분할(머리행 반복).
// 폰트(~2.2MB)는 첫 생성 때만 네트워크로 받고 Cache API에 캐시 → 이후 오프라인 동작.

import type { Company, Customer, Quote } from '$lib/types';
import { won } from '$lib/money';
import { koreanAmount } from '$lib/korean-number';

const FONT_URL = 'https://cdn.jsdelivr.net/gh/fonts-archive/NanumGothic/NanumGothic.ttf';
let fontB64: string | null = null;

function abToB64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let bin = '';
	const CH = 0x8000;
	for (let i = 0; i < bytes.length; i += CH) {
		bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH) as unknown as number[]);
	}
	return btoa(bin);
}

async function loadFont(): Promise<string> {
	if (fontB64) return fontB64;
	let res: Response | undefined;
	try {
		const cache = await caches.open('font-cache-v1');
		res = await cache.match(FONT_URL);
		if (!res) {
			res = await fetch(FONT_URL);
			if (res.ok) await cache.put(FONT_URL, res.clone());
		}
	} catch {
		res = await fetch(FONT_URL);
	}
	if (!res || !res.ok) throw new Error('폰트를 불러오지 못했습니다(오프라인이면 온라인에서 한 번 생성 후 사용).');
	fontB64 = abToB64(await res.arrayBuffer());
	return fontB64;
}

export async function exportQuotePdfVector(
	quote: Quote,
	company: Company | null,
	customer: Customer | null,
	fileName: string
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const autoTable = (await import('jspdf-autotable')).default;
	const b64 = await loadFont();

	const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
	doc.addFileToVFS('NanumGothic.ttf', b64);
	doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
	doc.setFont('NanumGothic', 'normal');

	const W = doc.internal.pageSize.getWidth();
	const M = 40;
	const taxFree = company?.is_tax_free ?? false;
	const ink = [24, 24, 27] as [number, number, number];
	const muted = [113, 113, 122] as [number, number, number];

	// 제목
	doc.setFontSize(22).setTextColor(...ink);
	doc.text('견  적  서', W / 2, 64, { align: 'center' });

	// 좌: 견적정보 / 우: 공급자
	doc.setFontSize(10).setTextColor(...muted);
	let ly = 104;
	const leftRow = (label: string, val: string) => {
		doc.setTextColor(...muted).text(label, M, ly);
		doc.setTextColor(...ink).text(val, M + 56, ly);
		ly += 16;
	};
	leftRow('견적번호', quote.quote_number);
	leftRow('발행일', quote.issue_date);
	leftRow('유효기간', quote.valid_until ?? '-');

	const RX = 320;
	let ry = 104;
	const rightRow = (label: string, val: string) => {
		doc.setTextColor(...muted).text(label, RX, ry);
		doc.setTextColor(...ink).text(val ?? '', RX + 56, ry);
		ry += 16;
	};
	doc.setTextColor(...ink).text('공급자', RX, ry);
	ry += 16;
	rightRow('상호', company?.name ?? '');
	rightRow('사업자', company?.business_number ?? '');
	rightRow('대표', company?.ceo_name ?? '');
	rightRow('주소', company?.address ?? '');

	// 공급받는자
	doc.setFontSize(14).setTextColor(...ink);
	doc.text(`${customer?.name ?? ''} 귀하`, M, ly + 10);

	// 합계금액 배너
	const bandY = Math.max(ly + 22, ry + 8);
	doc.setFillColor(250, 250, 250).setDrawColor(212, 212, 216);
	doc.rect(M, bandY, W - M * 2, 26, 'FD');
	doc.setFontSize(10).setTextColor(...muted).text('합계금액', M + 10, bandY + 17);
	doc.setFontSize(12).setTextColor(...ink).text(koreanAmount(quote.total_amount), M + 60, bandY + 17);
	doc.setFontSize(10).setTextColor(...muted)
		.text(`(₩${won(quote.total_amount)})`, W - M - 10, bandY + 17, { align: 'right' });

	// 품목 표 (autotable: 행 경계 분할·머리행 반복)
	const head = taxFree
		? [['No', '품명', '규격', '수량', '단가', '공급가액']]
		: [['No', '품명', '규격', '수량', '단가', '공급가액', '세액']];
	const body = quote.lines.map((l, i) => {
		const vat = taxFree ? 0 : Math.floor(l.amount * 0.1);
		const base = [
			String(i + 1),
			l.item_name,
			l.spec ?? '',
			`${l.quantity}${l.unit ?? ''}`,
			won(l.unit_price),
			won(l.amount)
		];
		return taxFree ? base : [...base, won(vat)];
	});

	autoTable(doc, {
		startY: bandY + 38,
		head,
		body,
		margin: { left: M, right: M },
		styles: { font: 'NanumGothic', fontStyle: 'normal', fontSize: 9, cellPadding: 4, lineColor: [212, 212, 216], lineWidth: 0.5, textColor: ink },
		headStyles: { fillColor: [250, 250, 250], textColor: ink, halign: 'center' },
		columnStyles: {
			0: { halign: 'center', cellWidth: 28 },
			2: { cellWidth: 64 },
			3: { halign: 'right', cellWidth: 50 },
			4: { halign: 'right', cellWidth: 70 },
			5: { halign: 'right', cellWidth: 74 },
			6: { halign: 'right', cellWidth: 60 }
		}
	});

	const pageH = doc.internal.pageSize.getHeight();
	let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
	// 표가 페이지 하단까지 찼으면 이후 내용은 새 페이지로
	const ensure = (need: number) => {
		if (y + need > pageH - M) {
			doc.addPage();
			y = M + 10;
		}
	};

	// 합계 (공급가액·세액)
	doc.setFontSize(10);
	ensure(taxFree ? 20 : 36);
	const totalLine = (label: string, val: number) => {
		doc.setTextColor(...muted).text(label, W - M - 150, y, { align: 'right' });
		doc.setTextColor(...ink).text(won(val), W - M, y, { align: 'right' });
		y += 16;
	};
	totalLine('공급가액 합계', quote.supply_amount);
	if (!taxFree) totalLine('세액 합계', quote.vat_amount);

	// 비고 / 입금계좌
	y += 12;
	if (quote.notes) {
		const noteLines = doc.splitTextToSize(quote.notes, W - M * 2);
		ensure(18 + 14 * Math.max(1, noteLines.length));
		doc.setTextColor(...ink).text('비고', M, y);
		doc.setTextColor(...muted).text(noteLines, M, y + 14);
		y += 14 + 14 * Math.max(1, noteLines.length);
	}
	if (company?.bank_account) {
		ensure(20);
		doc.setTextColor(...muted).text(`입금계좌   ${company.bank_account}`, M, y + 6);
	}

	doc.save(fileName);
}
