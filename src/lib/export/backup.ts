// JSON 백업 다운로드 (설정 화면·백업 넛지 배너 공용).
import { db } from '$lib/data/db.svelte';

export function downloadBackup() {
	const json = db.exportSnapshot();
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `견적백업_${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
