// 화면 그대로(WYSIWYG) 이미지 PDF — 화면의 견적 시트를 캡처해 A4 PDF로 저장.
// 텍스트 선택은 안 되지만 화면과 픽셀 단위로 동일하다(벡터 PDF는 export/pdf-vector.ts).
// 다중 페이지: 표 행 경계에서 잘라 글자/행이 반 토막 나지 않게 한다.

export async function exportQuotePdf(sheetEl: HTMLElement, fileName: string): Promise<void> {
	const html2canvas = (await import('html2canvas-pro')).default;
	const { jsPDF } = await import('jspdf');

	try {
		await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
	} catch {
		/* ignore */
	}

	// 화면 시트는 transform: scale()로 축소돼 있다 → 무변형 794px 복제본을 오프스크린에서 캡처
	const SCALE = 2;
	const clone = sheetEl.cloneNode(true) as HTMLElement;
	clone.style.transform = 'none';
	clone.style.margin = '0';
	clone.style.boxShadow = 'none';
	const holder = document.createElement('div');
	holder.style.cssText =
		'position:fixed;left:-99999px;top:0;width:794px;background:#ffffff;z-index:-1';
	holder.appendChild(clone);
	document.body.appendChild(holder);

	// 안전 분할 지점(행/섹션 경계)을 시트 상단 기준 px로 수집 → 페이지를 행 경계에서 자른다
	const cloneTop = clone.getBoundingClientRect().top;
	const breakSel = '.lines thead, .lines tbody tr, .amount-words, .totals .trow, .notes, .sheet-foot';
	const breaks = [0];
	clone.querySelectorAll(breakSel).forEach((el) => {
		breaks.push((el.getBoundingClientRect().bottom - cloneTop) * SCALE);
	});

	let canvas: HTMLCanvasElement;
	try {
		canvas = await html2canvas(clone, {
			scale: SCALE,
			backgroundColor: '#ffffff',
			useCORS: true,
			logging: false
		});
	} finally {
		document.body.removeChild(holder);
	}
	breaks.push(canvas.height);
	const breakPts = [...new Set(breaks.map((b) => Math.round(b)))].sort((a, b) => a - b);

	const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
	const pageW = pdf.internal.pageSize.getWidth();
	const pageH = pdf.internal.pageSize.getHeight();
	const ratio = pageW / canvas.width; // 캔버스 px → PDF pt
	const pagePx = pageH / ratio; // 한 페이지에 들어가는 캔버스 px 높이

	if (canvas.height * ratio <= pageH + 1) {
		pdf.addImage(canvas, 'PNG', 0, 0, pageW, canvas.height * ratio);
	} else {
		let pos = 0;
		let first = true;
		while (pos < canvas.height - 1) {
			const target = pos + pagePx;
			// pos보다 크고 target 이하인 가장 큰 분할 지점 = 행 경계
			const fit = breakPts.filter((b) => b > pos + 4 && b <= target + 0.5);
			let cut = fit.length ? Math.max(...fit) : Math.min(Math.floor(target), canvas.height);
			if (cut <= pos) cut = Math.min(Math.floor(target), canvas.height); // 한 행이 페이지보다 큰 경우
			const h = cut - pos;
			const slice = document.createElement('canvas');
			slice.width = canvas.width;
			slice.height = h;
			const ctx = slice.getContext('2d')!;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, slice.width, slice.height);
			ctx.drawImage(canvas, 0, pos, canvas.width, h, 0, 0, canvas.width, h);
			if (!first) pdf.addPage();
			pdf.addImage(slice, 'PNG', 0, 0, pageW, h * ratio);
			pos = cut;
			first = false;
		}
	}

	pdf.save(fileName);
}
