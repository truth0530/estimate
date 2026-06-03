// 자동입력 — PLAN.md §5-1: Fuse.js 어휘 퍼지매칭 + 정규식 수량/금액 파서.
// "철근 10개 5만원, 시멘트 20포대 단가 8000" → 견적 라인 후보.

import Fuse from 'fuse.js';
import type { Item, QuoteLine } from './types';
import { lineAmount } from './money';

export interface ParsedLine extends Partial<QuoteLine> {
	confidence: number; // 0=확실, ↑=불확실 (Fuse score). null 매칭이면 1
	matched: boolean;
}

const UNIT_WORDS = ['개', '포대', '포', '장', '톤', 'ton', 't', 'm3', 'm³', 'm', 'ea', 'set', '세트', '박스', '롤', 'kg', 'g'];

/** "5만원", "50,000원", "단가 8000", "@8000" → 숫자 */
function parsePrice(text: string): number | null {
	// 한글 만/천 단위
	const manMatch = text.match(/(\d+(?:\.\d+)?)\s*만\s*원?/);
	if (manMatch) return Math.round(parseFloat(manMatch[1]) * 10000);
	// @8000 또는 단가 8000 또는 50,000원
	const at = text.match(/(?:@|단가\s*)([\d,]+)/);
	if (at) return parseInt(at[1].replace(/,/g, ''), 10);
	const won = text.match(/([\d,]{3,})\s*원/);
	if (won) return parseInt(won[1].replace(/,/g, ''), 10);
	return null;
}

/** "10개", "20 포대", "3.5m" → { value, unit } */
function parseQuantity(text: string): { value: number; unit: string } | null {
	// 한글 단위 뒤에는 ASCII \b가 동작하지 않으므로, 영문 단위만 글자 연속을 차단한다.
	const unitAlt = UNIT_WORDS.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
	const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitAlt})(?![A-Za-z])`, 'i');
	const m = text.match(re);
	if (m) return { value: parseFloat(m[1]), unit: m[2] };
	// 단위 없는 맨 숫자(가격 토큰 제외 후)
	const bare = text.match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/);
	if (bare) return { value: parseFloat(bare[1]), unit: '' };
	return null;
}

/** 숫자·단위·가격 토큰을 제거해 품목 후보명만 남김 */
function extractName(chunk: string): string {
	return chunk
		.replace(/(\d+(?:\.\d+)?)\s*만\s*원?/g, ' ')
		.replace(/(?:@|단가\s*)[\d,]+/g, ' ')
		.replace(/[\d,]+\s*원/g, ' ')
		.replace(new RegExp(`\\d+(?:\\.\\d+)?\\s*(?:${UNIT_WORDS.join('|')})(?![A-Za-z])`, 'gi'), ' ')
		.replace(/\d+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function parseAutofill(text: string, items: Item[]): ParsedLine[] {
	const fuse = new Fuse(items, {
		keys: ['name', 'spec', 'category'],
		includeScore: true,
		threshold: 0.45,
		ignoreLocation: true
	});

	const chunks = text
		.split(/[,\n·•]/)
		.map((c) => c.trim())
		.filter(Boolean);

	return chunks.map((chunk): ParsedLine => {
		const qty = parseQuantity(chunk);
		const price = parsePrice(chunk);
		const name = extractName(chunk);

		const hit = name ? fuse.search(name)[0] : undefined;
		const item = hit?.item;
		const quantity = qty?.value ?? 1;
		const unit_price = price ?? item?.unit_price ?? 0;

		return {
			item_id: item?.id ?? null,
			item_name: item?.name ?? name ?? chunk,
			spec: item?.spec ?? '',
			unit: qty?.unit || item?.unit || '',
			quantity,
			unit_price,
			amount: lineAmount(quantity, unit_price),
			confidence: hit?.score ?? 1,
			matched: !!item
		};
	});
}
