// 견적번호 채번 (순수 함수) — YYYYMM-NNN, 월별 일련번호.
// db에서 분리해 단위 테스트가 runes/localStorage 없이 가능하도록 한다.

/** "2026-06-03" → "202606" */
export function yearMonth(issueDate: string): string {
	return issueDate.slice(0, 7).replace('-', '');
}

/**
 * 같은 달의 기존 견적번호들에서 다음 번호를 만든다.
 * @param existingNumbers 모든 견적의 quote_number 배열
 * @param issueDate YYYY-MM-DD
 */
export function nextQuoteNumber(existingNumbers: string[], issueDate: string): string {
	const ym = yearMonth(issueDate);
	const seqs = existingNumbers
		.filter((n) => n.startsWith(ym + '-'))
		.map((n) => parseInt(n.split('-')[1] ?? '0', 10))
		.filter((n) => !isNaN(n));
	const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
	return `${ym}-${String(next).padStart(3, '0')}`;
}
