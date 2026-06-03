import { defineConfig } from 'vitest/config';

// 순수 로직 단위 테스트 (money / autofill / quote-number).
// SvelteKit·Tailwind 플러그인 없이 순수 TS만 실행해 빠르고 안정적이다.
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
