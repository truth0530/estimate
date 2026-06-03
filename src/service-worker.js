// @ts-nocheck
// 앱 셸 캐시로 오프라인 구동 (SvelteKit이 프로덕션 빌드에서 자동 등록).
// 데이터는 이미 localStorage에 있으므로, 셸만 캐시하면 비행기 모드에서도 작동한다.
import { build, files, version } from '$service-worker';

const CACHE = `estimate-${version}`;
// 빌드 자산(JS/CSS) + static 파일 + SPA 셸('/')
const ASSETS = [...build, ...files, '/'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== self.location.origin) return; // 외부(폰트 CDN 등)는 그대로 통과

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// 불변 빌드 자산은 캐시 우선
			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			try {
				const res = await fetch(req);
				if (res && res.status === 200 && res.type === 'basic') {
					cache.put(req, res.clone());
				}
				return res;
			} catch {
				const hit = await cache.match(req);
				if (hit) return hit;
				// SPA: 네비게이션은 캐시된 셸로 폴백
				if (req.mode === 'navigate') {
					const shell = await cache.match('/');
					if (shell) return shell;
				}
				throw new Error('offline and not cached');
			}
		})()
	);
});
