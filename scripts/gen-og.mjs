// 링크 미리보기(OG) 이미지 생성 — 1200×630, 헤드리스 Chromium 렌더.
// 재생성: node scripts/gen-og.mjs
import { chromium } from '@playwright/test';

const html = `<!doctype html><html><body style="margin:0">
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#18181b"/>
  <!-- 워터마크 견 -->
  <text x="1190" y="430" font-family="sans-serif" font-size="520" font-weight="700"
        fill="#ffffff" fill-opacity="0.05" text-anchor="end">견</text>
  <!-- 본문 -->
  <text x="90" y="300" font-family="sans-serif" font-size="150" font-weight="700"
        fill="#ffffff" letter-spacing="-4">견적서</text>
  <text x="96" y="372" font-family="sans-serif" font-size="44" font-weight="600"
        fill="#e4e4e7">육일하우스</text>
  <text x="96" y="424" font-family="sans-serif" font-size="30"
        fill="#a1a1aa">견적 작성 · PDF / Excel 출력 · 모바일 앱</text>
  <text x="96" y="560" font-family="sans-serif" font-size="28"
        fill="#71717a">6day.pages.dev</text>
</svg></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.screenshot({ path: 'static/og.png' });
await browser.close();
console.log('wrote static/og.png 1200x630');
