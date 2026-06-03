import { describe, it, expect } from 'vitest';
import { nextQuoteNumber, yearMonth } from './quote-number';

describe('yearMonth', () => {
	it('YYYY-MM-DD → YYYYMM', () => {
		expect(yearMonth('2026-06-03')).toBe('202606');
	});
});

describe('nextQuoteNumber', () => {
	it('빈 달은 001부터', () => {
		expect(nextQuoteNumber([], '2026-06-03')).toBe('202606-001');
	});
	it('같은 달에서 증가', () => {
		expect(nextQuoteNumber(['202606-001'], '2026-06-10')).toBe('202606-002');
	});
	it('개수가 아니라 최대값+1', () => {
		expect(nextQuoteNumber(['202606-001', '202606-003'], '2026-06-10')).toBe('202606-004');
	});
	it('월이 바뀌면 다시 001 (롤오버)', () => {
		expect(nextQuoteNumber(['202605-007'], '2026-06-01')).toBe('202606-001');
	});
	it('다른 달 번호는 카운트에서 제외', () => {
		expect(nextQuoteNumber(['202605-009', '202606-002'], '2026-06-20')).toBe('202606-003');
	});
});
