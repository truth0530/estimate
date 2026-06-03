// 금액 계산 규칙 — PLAN.md 6장. 원 단위 floor 통일.
// DB(save_quote RPC/생성 컬럼)와 동일한 규칙을 클라이언트 표시용으로 복제한다.

import type { QuoteLine } from './types';

/** 라인 금액: floor(수량 × 단가) */
export function lineAmount(quantity: number, unitPrice: number): number {
	if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
	return Math.floor(quantity * unitPrice);
}

export interface Totals {
	supply: number;
	vat: number;
	total: number;
}

/** 합계: 공급가액 = Σ라인, VAT = floor(공급가액 × 0.1)(면세면 0), 합계 = 공급+VAT */
export function computeTotals(lines: QuoteLine[], isTaxFree: boolean): Totals {
	const supply = lines.reduce((sum, l) => sum + lineAmount(l.quantity, l.unit_price), 0);
	const vat = isTaxFree ? 0 : Math.floor(supply * 0.1);
	return { supply, vat, total: supply + vat };
}

/** 원화 표기: 1,234,567 */
export function won(n: number): string {
	return (n ?? 0).toLocaleString('ko-KR');
}
