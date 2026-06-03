// 표시용 순수 포맷 헬퍼 (단위 테스트 대상).

/** 바이트 → 사람이 읽는 크기 (KB/MB) */
export function formatBytes(n: number): string {
	if (!Number.isFinite(n) || n < 0) return '0 B';
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** ISO 문자열과 기준 시각(ms) 사이의 경과 일수(내림). null이면 null. */
export function daysSince(iso: string | null, nowMs: number): number | null {
	if (!iso) return null;
	const t = Date.parse(iso);
	if (Number.isNaN(t)) return null;
	return Math.floor((nowMs - t) / 86_400_000);
}

/** "마지막 백업: …" 라벨 */
export function lastBackupLabel(days: number | null): string {
	if (days === null) return '백업한 적 없음';
	if (days <= 0) return '오늘 백업함';
	if (days === 1) return '어제 백업함';
	return `${days}일 전 백업함`;
}
