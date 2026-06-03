// PWA 검증 — preview 서버(4180)에 대해 매니페스트·SW 등록·오프라인 구동 확인.
// 사용: npm run build && npm run preview -- --port 4180 (별도 실행) 후 node scripts/verify-pwa.mjs
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4180';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
let failed = false;
const ok = (label, cond) => {
	console.log(`${cond ? '✓' : '✗'} ${label}`);
	if (!cond) failed = true;
};

// 1) 매니페스트
const m = await page.goto(`${BASE}/manifest.webmanifest`);
const manifest = await m.json();
ok('manifest name = 견적서', manifest.name === '견적서');
ok('manifest standalone', manifest.display === 'standalone');
ok('manifest icons 192+512', manifest.icons.length >= 2);

// 2) 아이콘 접근
const i192 = await page.goto(`${BASE}/icons/icon-192.png`);
ok('icon-192 200', i192.status() === 200);

// 3) SW 등록/활성 (SvelteKit 자동 등록)
await page.goto(`${BASE}/`);
await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.ready, null, {
	timeout: 15000
});
await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
ok('service worker controls page', await page.evaluate(() => !!navigator.serviceWorker.controller));

// 4) 오프라인 구동
await ctx.setOffline(true);
await page.reload({ waitUntil: 'load' });
const title = await page.title();
const hasShell = await page.evaluate(() => !!document.querySelector('main, nav'));
ok('offline: 페이지 로드', title.includes('견적'));
ok('offline: 앱 셸 렌더', hasShell);

await browser.close();
console.log(failed ? '\nFAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
