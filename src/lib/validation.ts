// 입력 검증 (순수 함수) — 저장 전 사용자 피드백과 숫자 정규화.

/** 숫자 정규화: 비유한값·min 미만은 min으로 클램프. */
export function sanitizeNumber(v: unknown, min = 0): number {
	const n = typeof v === 'number' ? v : Number(v);
	if (!Number.isFinite(n)) return min;
	return n < min ? min : n;
}

export interface ValidatableLine {
	item_name: string;
	quantity: number;
	unit_price: number;
}

export interface QuoteValidation<T> {
	ok: boolean;
	error?: string;
	lines: T[];
}

/**
 * 견적 저장 검증:
 * - 품명 있는 라인이 1개 이상이어야 한다.
 * - 그 라인들의 수량은 0보다 커야 한다(빈 행은 무시).
 * - 단가 음수/비정상은 0으로 클램프.
 * 통과 시 숫자가 정규화된 라인 배열을 돌려준다(기타 필드는 보존).
 */
export function validateQuoteForSave<T extends ValidatableLine>(lines: T[]): QuoteValidation<T> {
	const named = lines.filter((l) => (l.item_name ?? '').trim() !== '');
	if (named.length === 0) {
		return { ok: false, error: '품목을 1개 이상 입력하세요.', lines: [] };
	}
	const cleaned: T[] = [];
	for (const l of named) {
		const quantity = sanitizeNumber(l.quantity, 0);
		const unit_price = sanitizeNumber(l.unit_price, 0);
		if (quantity <= 0) {
			return { ok: false, error: `수량은 0보다 커야 합니다: ${l.item_name.trim()}`, lines: [] };
		}
		cleaned.push({ ...l, item_name: l.item_name.trim(), quantity, unit_price });
	}
	return { ok: true, lines: cleaned };
}
