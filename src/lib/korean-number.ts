// 숫자 → 한글 금액 (견적서 "금 …원" 표기, 국립국어원 기준). 순수 함수.
// 규칙: 4자리 그룹마다 만/억/조 단위를 붙인다.
// 위변조 방지를 위해 숫자 1도 항상 '일'로 적는다(일천·일백·일십).
//  예) 452,100 → "사십오만이천일백", 2,772,000 → "이백칠십칠만이천"

const DIGITS = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const SMALL = ['', '십', '백', '천']; // 그룹 내 자리
const BIG = ['', '만', '억', '조', '경']; // 4자리 그룹 단위

/** 0~9999 한 그룹 읽기 */
function readGroup(n: number): string {
	let s = '';
	const d = [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10, Math.floor(n / 1000) % 10];
	for (let pos = 3; pos >= 0; pos--) {
		const digit = d[pos];
		if (digit === 0) continue;
		// 위변조 방지: 십/백/천 앞의 1도 '일'을 살린다 (일십·일백·일천)
		s += DIGITS[digit] + SMALL[pos];
	}
	return s;
}

/** 정수를 한글 수사로. 음수는 절대값, 소수는 버림. */
export function numberToKorean(value: number): string {
	if (!Number.isFinite(value)) return '';
	let n = Math.floor(Math.abs(value));
	if (n === 0) return '영';
	const groups: number[] = [];
	while (n > 0) {
		groups.push(n % 10000);
		n = Math.floor(n / 10000);
	}
	let s = '';
	for (let i = groups.length - 1; i >= 0; i--) {
		if (groups[i] === 0) continue;
		s += readGroup(groups[i]) + BIG[i];
	}
	return s;
}

/** 견적서 표기: "금 사십오만이천일백원" (국립국어원 기준) */
export function koreanAmount(value: number): string {
	return `금 ${numberToKorean(value)}원`;
}
