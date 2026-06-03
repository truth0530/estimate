<script lang="ts">
	// 로컬 프로토타입에서는 인증이 형식상 존재한다.
	// 운영 전환 시 이 화면을 Supabase 이메일+비밀번호 로그인으로 교체한다(PLAN.md §3-1).
	import Button from '$lib/components/Button.svelte';
</script>

<div class="mx-auto max-w-sm pt-24 text-center">
	<h1 class="text-[24px]">견적서</h1>
	<p class="pt-2 text-[14px] text-muted">1인 사업자용 견적 작성 도구</p>
	<div class="mt-8 text-left">
		<input class="inp mb-2" type="email" placeholder="이메일" />
		<input class="inp mb-3" type="password" placeholder="비밀번호" />
		<Button variant="primary" href="/" class="w-full">시작하기</Button>
		<p class="pt-3 text-center text-[12px] text-faint">
			현재 로컬 모드(브라우저 저장). 운영 시 Supabase 인증으로 연결됩니다.
		</p>
	</div>
</div>
