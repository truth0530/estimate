import { test, expect } from '@playwright/test';

// 로컬 우선 앱: 빈 컨텍스트마다 시드가 채워진다. 결정성을 위해 시작 시 초기화.
test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => localStorage.clear());
	await page.goto('/'); // 재시드
});

async function createQuote(page: import('@playwright/test').Page, text: string) {
	await page.goto('/quotes/new');
	await page.locator('textarea[placeholder^="품목과"]').fill(text);
	await page.getByRole('button', { name: '채우기' }).click();
	await page.getByRole('button', { name: '저장' }).click();
	await expect(page).toHaveURL(/\/quotes\/[0-9a-f-]+$/);
}

test('작성 → 자동입력 → 저장 → 합계 계산', async ({ page }) => {
	await createQuote(page, '이형철근 2톤, 시멘트 20포 8500원, 레미콘 5');
	// 2,520,000(공급) + 252,000(세액) = 2,772,000
	await expect(page.getByText('2,772,000').first()).toBeVisible();
});

test('빈 견적은 저장이 차단되고 안내가 뜬다', async ({ page }) => {
	await page.goto('/quotes/new');
	await page.getByRole('button', { name: '저장' }).click();
	await expect(page).toHaveURL(/\/quotes\/new$/);
	await expect(page.getByText('품목을 1개 이상 입력하세요.')).toBeVisible();
});

test('인쇄 미리보기는 모바일에서 가로 스크롤이 없다', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await createQuote(page, '시멘트 10포');
	const url = page.url();
	await page.goto(`${url}/print`);
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);
	expect(overflow).toBe(false);
	await expect(page.getByText('견 적 서')).toBeVisible();
	// 한글 금액 병기 ("일금 …원정")
	await expect(page.getByText(/일금 .+원정/)).toBeVisible();
});

test('Excel·백업 파일 다운로드', async ({ page }) => {
	await createQuote(page, '시멘트 10포');

	const [xlsx] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Excel' }).click()
	]);
	expect(xlsx.suggestedFilename()).toMatch(/\.xlsx$/);

	await page.goto('/settings');
	const [json] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: '내보내기' }).click()
	]);
	expect(json.suggestedFilename()).toMatch(/\.json$/);
});
