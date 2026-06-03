// 이미지 압축 — 로고/직인 업로드 시 큰 원본이 localStorage(~5MB)를 잠식하는 것을 막는다.
// 최대 변(maxDim)으로 리사이즈하고 WebP(알파 보존·작음)로 재인코딩, 미지원 시 PNG 폴백.

function readAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
		img.src = src;
	});
}

/**
 * 업로드 파일을 리사이즈·압축한 dataURL로 반환한다.
 * @param maxDim 가장 긴 변의 상한(px)
 * @param quality 0~1 (WebP/JPEG 품질)
 */
export async function compressImage(file: File, maxDim = 512, quality = 0.85): Promise<string> {
	const dataUrl = await readAsDataURL(file);
	const img = await loadImage(dataUrl);
	const longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height) || 1;
	const scale = Math.min(1, maxDim / longest);
	const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
	const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) return dataUrl; // 캔버스 미지원 시 원본 유지
	ctx.drawImage(img, 0, 0, w, h);

	let out = canvas.toDataURL('image/webp', quality);
	if (!out.startsWith('data:image/webp')) {
		// WebP 미지원 브라우저 → PNG (알파 보존)
		out = canvas.toDataURL('image/png');
	}
	// 압축 결과가 원본보다 크면(작은 PNG 등) 원본을 쓴다.
	return out.length < dataUrl.length ? out : dataUrl;
}
