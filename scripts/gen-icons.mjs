// PWA 아이콘 생성 — 헤드리스 Chromium으로 SVG를 정확한 픽셀 크기 PNG로 렌더.
// 재생성: node scripts/gen-icons.mjs
import { chromium } from '@playwright/test';

const svg = (s) =>
	`<!doctype html><html><body style="margin:0;padding:0">
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#18181b"/>
  <text x="256" y="256" font-family="sans-serif" font-size="280" font-weight="700"
        fill="#ffffff" text-anchor="middle" dominant-baseline="central">견</text>
</svg></body></html>`;

const targets = [
	{ file: 'static/icons/icon-192.png', size: 192 },
	{ file: 'static/icons/icon-512.png', size: 512 },
	{ file: 'static/icons/apple-touch-icon.png', size: 180 }
];

const browser = await chromium.launch();
for (const { file, size } of targets) {
	const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
	await page.setContent(svg(size));
	await page.screenshot({ path: file });
	await page.close();
	console.log('wrote', file, `${size}x${size}`);
}
await browser.close();
