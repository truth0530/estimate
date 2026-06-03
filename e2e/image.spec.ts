import { test, expect } from '@playwright/test';
import { deflateSync } from 'node:zlib';

// 큰 치수의 단색 PNG를 즉석 생성 (압축/리사이즈 회귀 검증용 픽스처).
function crc32(buf: Buffer): number {
	let c = ~0;
	for (let i = 0; i < buf.length; i++) {
		c ^= buf[i];
		for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
	}
	return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const t = Buffer.from(type, 'ascii');
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
	return Buffer.concat([len, t, data, crc]);
}
function makeSolidPng(w: number, h: number, rgb: [number, number, number]): Buffer {
	const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // color type RGB
	const row = Buffer.alloc(1 + w * 3);
	for (let x = 0; x < w; x++) {
		row[1 + x * 3] = rgb[0];
		row[1 + x * 3 + 1] = rgb[1];
		row[1 + x * 3 + 2] = rgb[2];
	}
	const raw = Buffer.concat(Array.from({ length: h }, () => row));
	const idat = deflateSync(raw);
	return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

test('업로드 로고는 512px 이하로 리사이즈되어 저장된다', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => localStorage.clear());
	await page.goto('/settings');

	const big = makeSolidPng(2000, 1500, [200, 30, 30]);
	await page
		.locator('input[type=file][accept="image/*"]')
		.first()
		.setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: big });

	// 압축은 async — 미리보기 이미지가 로드될 때까지 대기
	await page.waitForFunction(() => {
		const img = document.querySelector('img[alt="로고"]') as HTMLImageElement | null;
		return !!img && img.complete && img.naturalWidth > 0;
	});

	const width = await page.evaluate(
		() => (document.querySelector('img[alt="로고"]') as HTMLImageElement).naturalWidth
	);
	expect(width).toBeGreaterThan(0);
	expect(width).toBeLessThanOrEqual(512); // 2000px 원본이 다운사이즈됨
});
