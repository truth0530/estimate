// 로컬 우선 프로토타입: localStorage가 모든 환경에서 동작하도록 SPA 모드.
// 운영(Supabase) 전환 시 SSR을 다시 켜고 load 함수에서 세션을 검증한다(PLAN.md §3-1).
export const ssr = false;
export const prerender = false;
