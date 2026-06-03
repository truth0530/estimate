import { describe, it, expect } from 'vitest';
import { lineAmount, computeTotals, won } from './money';
import type { QuoteLine } from './types';

function line(quantity: number, unit_price: number): QuoteLine {
	return {
		id: 'x',
		item_id: null,
		item_name: 'i',
		spec: '',
		unit: '',
		quantity,
		unit_price,
		amount: 0,
		sort_order: 0
	};
}

describe('lineAmount', () => {
	it('수량 × 단가를 floor 한다', () => {
		expect(lineAmount(2, 980000)).toBe(1960000);
		expect(lineAmount(1.5, 100)).toBe(150);
		expect(lineAmount(0.1, 7)).toBe(0); // floor(0.7)
		expect(lineAmount(3, 333)).toBe(999);
	});
	it('비정상 입력은 0', () => {
		expect(lineAmount(NaN, 100)).toBe(0);
		expect(lineAmount(2, NaN)).toBe(0);
	});
});

describe('computeTotals', () => {
	it('과세: 공급가액·세액(10% floor)·합계', () => {
		const t = computeTotals([line(2, 980000), line(20, 8500)], false);
		expect(t.supply).toBe(2130000); // 1,960,000 + 170,000
		expect(t.vat).toBe(213000); // floor(2,130,000 × 0.1)
		expect(t.total).toBe(2343000);
	});
	it('면세: 세액 0', () => {
		const t = computeTotals([line(1, 12345)], true);
		expect(t.supply).toBe(12345);
		expect(t.vat).toBe(0);
		expect(t.total).toBe(12345);
	});
	it('세액은 원 단위 절사(floor)', () => {
		const t = computeTotals([line(1, 12345)], false); // floor(1234.5) = 1234
		expect(t.vat).toBe(1234);
	});
	it('빈 라인은 모두 0', () => {
		const t = computeTotals([], false);
		expect(t).toEqual({ supply: 0, vat: 0, total: 0 });
	});
});

describe('won', () => {
	it('천 단위 구분', () => {
		expect(won(2772000)).toBe('2,772,000');
		expect(won(0)).toBe('0');
	});
});
