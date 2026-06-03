import { defineConfig, devices } from '@playwright/test';

// e2e 스모크 — dev 서버를 띄워 핵심 플로우를 블랙박스로 검증.
// 단위 테스트(src/**/*.test.ts, vitest)와 분리: testDir = e2e.
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run dev -- --port 4173',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000
	}
});
