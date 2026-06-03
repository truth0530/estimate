# 실행 및 다음 단계

## 지금 실행하기 (로컬 모드)

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속. 데이터는 브라우저 `localStorage`에 저장되며,
첫 실행 시 샘플 회사·거래처·품목이 자동 시드된다. Supabase 없이 전체 흐름이 동작한다.

- `/` 견적 목록 · `/quotes/new` 작성(빠른 입력 자동완성 포함) · `/quotes/[id]` 상세
- `/quotes/[id]/print` 인쇄·PDF(브라우저 "PDF로 저장") · 상세에서 Excel 내보내기
- `/items` 품목 · `/customers` 거래처 · `/settings` 회사정보/로고/직인/면세 + **데이터 백업(JSON)**

데이터 백업: 설정 화면에서 **내보내기(.json)** 로 보관하고, 다른 기기에서는 **가져오기** 로 옮긴다
(백엔드 동기화 전까지의 수동 백업·이전 수단).

데이터 초기화: 브라우저 콘솔에서 `localStorage.clear()` 후 새로고침.

## 검증된 동작 (Playwright로 실제 클릭/렌더 검증 완료)

- 빠른 입력 "이형철근 2톤, 시멘트 20포 8500원, 레미콘 5" → 3개 라인 자동 채움
  (품목 퍼지매칭, 수량/단위/단가 파싱, 입력단가 우선·DB단가 fallback)
- 채번 202606-001 자동 생성(월별 YYYYMM-NNN)
- 합계: 공급가액 2,520,000 / 세액 252,000(10% floor) / 합계 2,772,000
- Excel: 버튼 클릭 → `견적서_202606-001.xlsx` 다운로드, 유효한 Office Open XML
  (테두리·병합·셀서식 포함) 확인
- 인쇄 견적서: 한글·로고·직인(dataURL `<img>`)·공급자/공급받는자·라인별 세액 렌더 확인
- 모바일(390px): 인쇄 견적서가 A4 비율 그대로 화면폭에 축소되어 **가로 스크롤 0**(scrollWidth=clientWidth)
- 하단 독바 4탭, 폼 화면에서는 독바 숨김(자체 액션바와 이중 고정 방지)
- 설정 화면 JSON 내보내기 → 유효한 백업 파일(회사·거래처·품목·견적 전체) 확인

## 백엔드 결정 상태 (요약, 상세는 PLAN.md §0.1)

프론트엔드 SvelteKit은 확정(거의 최적). **백엔드는 아직 미확정** — 현재는 로컬 우선 +
JSON 백업으로 운영하며, 기기 간 동기화가 실제로 필요해질 때 연결한다. 그때 SPA를 유지하는
**Supabase가 보류 가능한 기본값**(7일 정지만 keepalive로 처리), 정지가 거슬리면 PocketBase,
Postgres 고유 기능이 필요하면 Supabase 확정. 어느 쪽이든 데이터 어댑터 교체만으로 화면 코드는 유지된다.

## 구조

```
src/lib/
  types.ts            도메인 타입 (PLAN.md 스키마 대응)
  money.ts            금액 계산 규칙 (floor, VAT 10%)
  autofill.ts         빠른 입력 파서 (Fuse.js + 정규식)
  data/db.svelte.ts   로컬 어댑터 (localStorage, 반응형 싱글턴) + JSON export/import
  export/excel.ts     ExcelJS 내보내기 (동적 import)
  components/         AppShell, Button, Field, StatusDot, QuoteEditor
src/routes/          화면 (목록/작성/상세/수정/인쇄/거래처/품목/설정/로그인)
supabase/migrations/0001_init.sql   운영 DB 스키마+RLS+RPC
```

## 운영(Supabase)으로 전환하기

1. Supabase 프로젝트 생성 후 SQL Editor에 `supabase/migrations/0001_init.sql` 적용
   (PostgreSQL 15+ 확인 필요 — `on delete set null (column)` 구문).
2. Storage 비공개 버킷 `company-assets` 생성 후 마이그레이션 6장 주석의 정책 적용.
3. `npm i @supabase/supabase-js @supabase/ssr` 후 `.env`에 URL/anon key 설정.
4. `src/lib/data/db.svelte.ts`와 **동일한 메서드 시그니처**로
   `src/lib/data/supabase.svelte.ts`를 만들어 싱글턴을 교체.
   - `saveQuote` → `supabase.rpc('save_quote', { p_quote, p_items })`
   - `nextQuoteNumber` → 서버 RPC가 처리(클라이언트 호출 불필요)
   - 화면 코드(`db.xxx` 호출)는 그대로 둔다.
5. `src/routes/+layout.ts`의 `ssr = false`를 제거하고 `hooks.server.ts`에서
   `@supabase/ssr` 세션 검증 추가(PLAN.md §3-1).
6. **최우선 검증**: `@supabase/ssr` 쿠키 인증이 Cloudflare Workers 엣지에서
   동작하는지 스모크 테스트. 충돌 시 `adapter-node`로 교체(PLAN.md §3-2).

## 배포

```bash
npm i -D @sveltejs/adapter-cloudflare
```
`svelte.config.js`의 adapter를 `adapter-cloudflare`로 교체 후 Cloudflare Pages 연결.
(로컬 프로토타입은 `adapter-auto` 기본값으로 충분.)
