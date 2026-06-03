// WYSIWYG PDF — 화면의 견적 시트를 그대로 캡처해 A4 PDF로 저장.
// 브라우저 인쇄(머리글·여백·축소·페이지 분할)를 피하려고 직접 렌더한다.
// 오프스크린 794px(A4@96dpi)·무변형으로 복제 후 html2canvas-pro → jsPDF.
// (이미지 기반이라 PDF 안의 텍스트는 선택·검색되지 않는다.)

export async function exportQuotePdf(sheetEl: HTMLElement, fileName: string): Promise<void> {
	const html2canvas = (await import('html2canvas-pro')).default;
	const { jsPDF } = await import('jspdf');

	// 한글 폰트 로드 대기 (깨짐 방지)
	try {
		await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
	} catch {
		/* ignore */
	}

	// 화면 시트는 transform: scale()로 축소돼 있다 → 무변형 794px 복제본을 오프스크린에서 캡처
	const clone = sheetEl.cloneNode(true) as HTMLElement;
	clone.style.transform = 'none';
	clone.style.margin = '0';
	clone.style.boxShadow = 'none';
	const holder = document.createElement('div');
	holder.style.cssText =
		'position:fixed;left:-99999px;top:0;width:794px;background:#ffffff;z-index:-1';
	holder.appendChild(clone);
	document.body.appendChild(holder);

	let canvas: HTMLCanvasElement;
	try {
		canvas = await html2canvas(clone, {
			scale: 2,
			backgroundColor: '#ffffff',
			useCORS: true,
			logging: false
		});
	} finally {
		document.body.removeChild(holder);
	}

	const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
	const pageW = pdf.internal.pageSize.getWidth();
	const pageH = pdf.internal.pageSize.getHeight();
	const ratio = pageW / canvas.width; // 캔버스 px → PDF pt
	const imgH = canvas.height * ratio;

	if (imgH <= pageH + 1) {
		// 한 페이지에 맞음 (A4 비율 시트 → 보통 1페이지)
		pdf.addImage(canvas, 'PNG', 0, 0, pageW, imgH);
	} else {
		// 페이지 높이만큼 캔버스를 잘라 여러 장으로
		const pagePx = pageH / ratio;
		let pos = 0;
		let first = true;
		while (pos < canvas.height - 1) {
			const h = Math.min(pagePx, canvas.height - pos);
			const slice = document.createElement('canvas');
			slice.width = canvas.width;
			slice.height = Math.round(h);
			const ctx = slice.getContext('2d')!;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, slice.width, slice.height);
			ctx.drawImage(canvas, 0, pos, canvas.width, h, 0, 0, canvas.width, h);
			if (!first) pdf.addPage();
			pdf.addImage(slice, 'PNG', 0, 0, pageW, h * ratio);
			pos += h;
			first = false;
		}
	}

	pdf.save(fileName);
}
