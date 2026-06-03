import { describe, it, expect } from 'vitest';
import { sanitizeNumber, validateQuoteForSave } from './validation';

describe('sanitizeNumber', () => {
	it('비유한값은 min', () => {
		expect(sanitizeNumber(NaN)).toBe(0);
		expect(sanitizeNumber(undefined)).toBe(0);
		expect(sanitizeNumber('abc')).toBe(0);
		expect(sanitizeNumber(Infinity)).toBe(0);
	});
	it('min 미만은 클램프', () => {
		expect(sanitizeNumber(-5)).toBe(0);
		expect(sanitizeNumber(-5, 1)).toBe(1);
	});
	it('정상값·문자숫자 통과', () => {
		expect(sanitizeNumber(12345)).toBe(12345);
		expect(sanitizeNumber('1.5')).toBe(1.5);
	});
});

const L = (item_name: string, quantity: number, unit_price: number) => ({
	item_name,
	quantity,
	unit_price
});

describe('validateQuoteForSave', () => {
	it('빈 품목뿐이면 거부', () => {
		const r = validateQuoteForSave([L('', 1, 100), L('  ', 2, 200)]);
		expect(r.ok).toBe(false);
		expect(r.error).toMatch(/1개 이상/);
	});
	it('수량 0/음수는 거부하고 품명 안내', () => {
		const r = validateQuoteForSave([L('시멘트', 0, 8500)]);
		expect(r.ok).toBe(false);
		expect(r.error).toContain('시멘트');
	});
	it('빈 행은 무시하고 유효 라인만 통과', () => {
		const r = validateQuoteForSave([L('철근', 2, 980000), L('', 1, 0)]);
		expect(r.ok).toBe(true);
		expect(r.lines).toHaveLength(1);
		expect(r.lines[0].item_name).toBe('철근');
	});
	it('단가 음수/비정상은 0으로 클램프', () => {
		const r = validateQuoteForSave([L('철근', 1, -100)]);
		expect(r.ok).toBe(true);
		expect(r.lines[0].unit_price).toBe(0);
	});
	it('품명 공백 트림', () => {
		const r = validateQuoteForSave([L('  레미콘  ', 5, 78000)]);
		expect(r.ok).toBe(true);
		expect(r.lines[0].item_name).toBe('레미콘');
	});
	it('기타 필드 보존', () => {
		const r = validateQuoteForSave([{ item_name: '철근', quantity: 1, unit_price: 100, id: 'abc' }]);
		expect(r.ok).toBe(true);
		expect((r.lines[0] as { id: string }).id).toBe('abc');
	});
});
