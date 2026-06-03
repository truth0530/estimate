<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Button from './Button.svelte';

	type Mode = 'none' | 'inapp' | 'ios' | 'android';
	let mode = $state<Mode>('none');
	let deferred = $state<any>(null);
	let dismissed = $state(false);

	onMount(() => {
		const ua = navigator.userAgent || '';
		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as any).standalone === true;
		const isMobile = /android|iphone|ipad|ipod/i.test(ua);
		const isIOS = /iphone|ipad|ipod/i.test(ua);
		const isAndroid = /android/i.test(ua);
		const inApp = /KAKAOTALK|instagram|naver|inapp|daumapps|FBAN|FBAV|Line\/|; wv\)/i.test(ua);

		if (sessionStorage.getItem('install-dismissed')) dismissed = true;

		// 설치됨(standalone)·데스크톱은 게이트 없음 → 일반 사용·e2e 영향 없음
		if (standalone || !isMobile) {
			mode = 'none';
			return;
		}
		if (inApp) mode = 'inapp';
		else if (isIOS) mode = 'ios';
		else if (isAndroid) mode = 'android';

		window.addEventListener('beforeinstallprompt', (e: Event) => {
			e.preventDefault();
			deferred = e;
		});
		window.addEventListener('appinstalled', () => (mode = 'none'));
	});

	const visible = $derived(mode !== 'none' && !dismissed && !page.url.pathname.endsWith('/print'));

	async function install() {
		if (!deferred) return;
		deferred.prompt();
		const res = await deferred.userChoice;
		if (res?.outcome === 'accepted') mode = 'none';
		deferred = null;
	}

	function openExternal() {
		const ua = navigator.userAgent || '';
		if (/KAKAOTALK/i.test(ua)) {
			location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
		} else {
			navigator.clipboard?.writeText(location.href);
			alert('주소가 복사됐습니다. 사파리/크롬 등 기본 브라우저에 붙여넣어 열어주세요.');
		}
	}

	function dismiss() {
		dismissed = true;
		try {
			sessionStorage.setItem('install-dismissed', '1');
		} catch {}
	}
</script>

{#if visible}
	<div class="fixed inset-0 z-50 flex flex-col bg-bg" style="padding-bottom: env(safe-area-inset-bottom);">
		<div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 text-center">
			<img src="/icons/icon-192.png" alt="" class="mx-auto mb-5 size-20 rounded-2xl" />

			{#if mode === 'inapp'}
				<h1 class="text-[22px] font-semibold text-strong">기본 브라우저로 열어주세요</h1>
				<p class="mt-2 text-[15px] text-muted">
					지금은 앱 안의 브라우저입니다. 설치와 저장이 제대로 되려면 사파리·크롬 등
					기본 브라우저에서 열어야 합니다.
				</p>
				<div class="mt-6">
					<Button variant="primary" onclick={openExternal} class="w-full">외부 브라우저로 열기</Button>
				</div>
				<p class="mt-3 text-[13px] text-faint">
					버튼이 안 되면 우측 상단 <span class="font-semibold">⋯ / 공유</span> → “다른 브라우저로 열기”
				</p>
			{:else}
				<h1 class="text-[22px] font-semibold text-strong">홈 화면에 앱으로 추가하세요</h1>
				<p class="mt-2 text-[15px] text-muted">
					설치하면 전체화면 앱으로 빠르게 열리고, <strong class="text-text">오프라인(비행기 모드)</strong>에서도
					작동합니다.
				</p>

				{#if mode === 'android'}
					<div class="mt-6">
						{#if deferred}
							<Button variant="primary" onclick={install} class="w-full">앱 설치하기</Button>
						{:else}
							<div class="rounded-md border border-line bg-sunken px-4 py-3 text-left text-[14px] text-text">
								크롬 메뉴 <span class="font-semibold">⋮</span> →
								<span class="font-semibold">“앱 설치”</span> 또는
								<span class="font-semibold">“홈 화면에 추가”</span>
							</div>
						{/if}
					</div>
				{:else if mode === 'ios'}
					<div class="mt-6 space-y-2 text-left">
						<!-- 1단계: 공유 버튼 -->
						<div class="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
							<span
								class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sunken text-accent"
							>
								<!-- iOS 공유 아이콘 (상자 + 위 화살표) -->
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 14V3.5" />
									<path d="M8.5 7 12 3.5 15.5 7" />
									<path
										d="M7 10H6.5A2.5 2.5 0 0 0 4 12.5v6A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 17.5 10H17"
									/>
								</svg>
							</span>
							<div class="text-[14px] text-text">
								<span class="font-semibold text-strong">1.</span> 사파리 도구막대의
								<span class="font-semibold text-accent">공유</span> 버튼을 누르세요
							</div>
						</div>

						<!-- 2단계: 공유 시트에서 "홈 화면에 추가" -->
						<div class="rounded-xl border border-line bg-surface px-4 py-3 text-[14px] text-text">
							<span class="font-semibold text-strong">2.</span> 목록을 내려
							<span class="font-semibold text-strong">홈 화면에 추가</span>를 누르세요
							<!-- 실제 공유 시트 항목 모양 -->
							<div class="mt-2 flex items-center justify-between rounded-lg bg-sunken px-3 py-2.5">
								<span class="text-[15px] font-medium text-strong">홈 화면에 추가</span>
								<span
									class="flex size-7 shrink-0 items-center justify-center rounded-md border border-line-strong text-strong"
								>
									<!-- 둥근 사각 + 플러스 -->
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
									>
										<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
										<path d="M12 8.5v7M8.5 12h7" />
									</svg>
								</span>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<div class="pb-6 text-center">
			<button class="text-[13px] text-faint underline-offset-2 hover:underline" onclick={dismiss}>
				그냥 웹으로 계속 보기
			</button>
		</div>
	</div>
{/if}
