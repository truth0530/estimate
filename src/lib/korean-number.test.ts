import { describe, it, expect } from 'vitest';
import { numberToKorean, koreanAmount } from './korean-number';

describe('numberToKorean', () => {
	it('기본 자리', () => {
		expect(numberToKorean(0)).toBe('영');
		expect(numberToKorean(5)).toBe('오');
		expect(numberToKorean(10)).toBe('십'); // 일 생략
		expect(numberToKorean(15)).toBe('십오');
		expect(numberToKorean(20)).toBe('이십');
		expect(numberToKorean(100)).toBe('백');
		expect(numberToKorean(1000)).toBe('천');
		expect(numberToKorean(1234)).toBe('천이백삼십사');
	});
	it('만/억 단위', () => {
		expect(numberToKorean(10000)).toBe('일만'); // 만의 일은 유지
		expect(numberToKorean(12345)).toBe('일만이천삼백사십오');
		expect(numberToKorean(1000000)).toBe('백만');
		expect(numberToKorean(100000000)).toBe('일억');
	});
	it('대표 견적 합계', () => {
		expect(numberToKorean(2772000)).toBe('이백칠십칠만이천');
		expect(numberToKorean(170000)).toBe('십칠만');
	});
	it('음수·소수는 절대값·버림', () => {
		expect(numberToKorean(-2772000)).toBe('이백칠십칠만이천');
		expect(numberToKorean(1234.9)).toBe('천이백삼십사');
	});
});

describe('koreanAmount', () => {
	it('일금 …원정', () => {
		expect(koreanAmount(2772000)).toBe('일금 이백칠십칠만이천원정');
		expect(koreanAmount(0)).toBe('일금 영원정');
	});
});
