import { describe, it, expect } from 'vitest';
import { numberToKorean, koreanAmount } from './korean-number';

describe('numberToKorean (위변조 방지: 1도 일로)', () => {
	it('기본 자리 — 십/백/천 앞 1도 일 유지', () => {
		expect(numberToKorean(0)).toBe('영');
		expect(numberToKorean(5)).toBe('오');
		expect(numberToKorean(10)).toBe('일십');
		expect(numberToKorean(11)).toBe('일십일');
		expect(numberToKorean(15)).toBe('일십오');
		expect(numberToKorean(20)).toBe('이십');
		expect(numberToKorean(100)).toBe('일백');
		expect(numberToKorean(110)).toBe('일백일십');
		expect(numberToKorean(1000)).toBe('일천');
		expect(numberToKorean(1234)).toBe('일천이백삼십사');
	});
	it('만/억 단위', () => {
		expect(numberToKorean(10000)).toBe('일만');
		expect(numberToKorean(12345)).toBe('일만이천삼백사십오');
		expect(numberToKorean(170000)).toBe('일십칠만');
		expect(numberToKorean(1000000)).toBe('일백만');
		expect(numberToKorean(100000000)).toBe('일억');
	});
	it('대표 견적 합계', () => {
		expect(numberToKorean(2772000)).toBe('이백칠십칠만이천');
		expect(numberToKorean(452100)).toBe('사십오만이천일백');
	});
	it('음수·소수는 절대값·버림', () => {
		expect(numberToKorean(-452100)).toBe('사십오만이천일백');
		expect(numberToKorean(1234.9)).toBe('일천이백삼십사');
	});
});

describe('koreanAmount', () => {
	it('금 …원 (국립국어원)', () => {
		expect(koreanAmount(452100)).toBe('금 사십오만이천일백원');
		expect(koreanAmount(2772000)).toBe('금 이백칠십칠만이천원');
		expect(koreanAmount(0)).toBe('금 영원');
	});
});
