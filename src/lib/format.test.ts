import { describe, it, expect } from 'vitest';
import { formatBytes, daysSince, lastBackupLabel } from './format';

describe('formatBytes', () => {
	it('B/KB/MB 경계', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(2048)).toBe('2 KB');
		expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
	});
	it('비정상은 0 B', () => {
		expect(formatBytes(-1)).toBe('0 B');
		expect(formatBytes(NaN)).toBe('0 B');
	});
});

describe('daysSince', () => {
	const now = Date.parse('2026-06-10T00:00:00Z');
	it('경과 일수 내림', () => {
		expect(daysSince('2026-06-10T00:00:00Z', now)).toBe(0);
		expect(daysSince('2026-06-09T00:00:00Z', now)).toBe(1);
		expect(daysSince('2026-06-01T00:00:00Z', now)).toBe(9);
	});
	it('null·잘못된 값은 null', () => {
		expect(daysSince(null, now)).toBeNull();
		expect(daysSince('nope', now)).toBeNull();
	});
});

describe('lastBackupLabel', () => {
	it('일수별 라벨', () => {
		expect(lastBackupLabel(null)).toBe('백업한 적 없음');
		expect(lastBackupLabel(0)).toBe('오늘 백업함');
		expect(lastBackupLabel(1)).toBe('어제 백업함');
		expect(lastBackupLabel(5)).toBe('5일 전 백업함');
	});
});
