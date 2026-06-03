import { describe, it, expect } from 'vitest';
import { parseAutofill } from './autofill';
import type { Item } from './types';

const items: Item[] = [
	{ id: '1', name: '이형철근 SD400', spec: 'D13', unit: 'ton', unit_price: 980000, category: '철근', active: true },
	{ id: '2', name: '시멘트', spec: '40kg', unit: '포', unit_price: 8500, category: '자재', active: true },
	{ id: '3', name: '레미콘', spec: '25-24-150', unit: 'm³', unit_price: 78000, category: '콘크리트', active: true }
];

describe('parseAutofill', () => {
	it('대표 예시를 3개 라인으로 파싱', () => {
		const r = parseAutofill('이형철근 2톤, 시멘트 20포 8500원, 레미콘 5', items);
		expect(r).toHaveLength(3);
		expect(r[0].matched).toBe(true);
		expect(r[0].item_name).toBe('이형철근 SD400');
		expect(r[0].quantity).toBe(2);
		expect(r[1].quantity).toBe(20);
		expect(r[1].unit_price).toBe(8500); // 입력 단가 우선
		expect(r[2].quantity).toBe(5);
		expect(r[2].unit_price).toBe(78000); // DB 단가 폴백
	});

	it('회귀: 한글 단위 뒤 구두점에서도 수량 파싱 (\\b 버그)', () => {
		// "2톤" 뒤 쉼표가 오면 예전엔 수량이 1로 나왔다
		const r = parseAutofill('철근 2톤, 시멘트 20포', items);
		expect(r[0].quantity).toBe(2);
		expect(r[1].quantity).toBe(20);
	});

	it('단가 미입력 시 DB 단가 폴백', () => {
		const r = parseAutofill('시멘트 3포', items);
		expect(r[0].quantity).toBe(3);
		expect(r[0].unit_price).toBe(8500);
	});

	it('만원·콤마 가격 파싱', () => {
		const r = parseAutofill('철근 1톤 5만원, 시멘트 2포 8,500원', items);
		expect(r[0].unit_price).toBe(50000);
		expect(r[1].unit_price).toBe(8500);
	});

	it('미매칭 품목은 입력한 이름 그대로', () => {
		const r = parseAutofill('처음보는자재 3개 1000원', items);
		expect(r[0].matched).toBe(false);
		expect(r[0].quantity).toBe(3);
		expect(r[0].unit_price).toBe(1000);
		expect(r[0].item_name).toBeTruthy();
	});
});
