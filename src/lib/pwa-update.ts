// PWA 자동(강제) 업데이트
// SW(install: skipWaiting / activate: clients.claim)와 짝을 이뤄,
// 새 배포가 감지되면 새 SW가 즉시 활성화→페이지 제어를 잡고(controllerchange),
// 그 순간 새로고침해 최신 버전을 띄운다.
// 또 주기적·포그라운드 복귀 시 update()로 새 배포를 능동 탐지한다.
export function initPwaAutoUpdate() {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

	// 1) 새 SW가 제어를 잡으면 새로고침 (단, 최초 방문의 첫 제어는 제외)
	const startReloadWatch = () => {
		let reloading = false;
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (reloading) return;
			reloading = true;
			location.reload();
		});
	};
	if (navigator.serviceWorker.controller) {
		// 이미 SW가 제어 중(재방문) → 다음 controllerchange는 곧 새 버전
		startReloadWatch();
	} else {
		// 아직 제어 SW 없음(최초) → 최초 제어 1회는 무시하고 이후부터 감시
		const once = () => {
			navigator.serviceWorker.removeEventListener('controllerchange', once);
			startReloadWatch();
		};
		navigator.serviceWorker.addEventListener('controllerchange', once);
	}

	// 2) 새 배포 능동 탐지: 등록 준비 후 주기적 + 포그라운드 복귀 시 update()
	const check = () =>
		navigator.serviceWorker
			.getRegistration()
			.then((r) => r?.update())
			.catch(() => {});
	navigator.serviceWorker.ready.then(() => {
		check();
		setInterval(check, 60_000);
	});
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') check();
	});
}
