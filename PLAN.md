# 견적서 앱 구현 계획서

> 최종 수정: 2026-06-03  
> 목표: 1인 사업자가 모바일에서 거래처/품목을 입력하고, 견적서를 저장한 뒤 PDF/Excel로 출력하는 웹앱을 먼저 완성한다. 자동입력, 세금계산서, 매출 관리는 검증된 필요가 생긴 뒤 확장한다.

---

## 0. 결론

현재 목표가 **1인용 모바일 견적서 작성 + PDF/Excel 출력**이라면 프레임워크나 아키텍처를 바꿀 필요는 없다.

| 영역 | 결정 | 이유 |
|------|------|------|
| 프론트엔드 | SvelteKit + Svelte 5 (SPA, `ssr=false`) | 작은 업무 앱에 충분. SPA라 모든 출력이 클라이언트에서 돌고, 서버 인증 복잡도가 없다. |
| 데이터(현재) | **로컬 우선 (localStorage 어댑터)** | 1인·소량·간헐 사용엔 이게 가장 싸고 위험 0. 백엔드는 교체 가능한 어댑터 뒤에 분리. |
| 데이터(향후) | **Supabase (보류 가능한 기본값)** | 동기화가 실제로 필요해질 때 연결. 자세한 비교는 §0.1. |
| 배포 | Cloudflare Pages | 비용이 낮고 SvelteKit 배포가 단순하다. |
| PDF | 1차: 인쇄 CSS, 2차: pdfmake 지연 로딩 | 한글 PDF 안정성을 먼저 확보하고, 클라이언트 번들 비대화를 피한다. |
| Excel | ExcelJS 지연 로딩 | 병합, 테두리, 서식이 필요하므로 SheetJS Community보다 적합하다. |
| 자동입력 | Fuse.js + 규칙 기반 파서 | 짧은 품목명 매칭은 LLM/임베딩보다 문자열 사전 대조가 싸고 검증하기 쉽다. |
| iOS | 웹앱 완성 후 Capacitor 검토 | Swift 재작성은 현재 범위에서는 과하다. |

**즉시 방향 전환이 필요한 경우**

아래 중 하나가 MVP의 필수 조건이면 이 계획을 멈추고 다시 설계해야 한다.

1. 세금계산서 전자 발행이 1차 목표다.  
   홈택스/민간 전자세금계산서 API는 서버 비밀키, 인증서, 콜백, 장애 재처리가 필요하므로 Cloudflare Pages 중심의 순수 클라이언트 앱만으로는 부족하다.
2. 여러 직원/권한/승인 워크플로우가 필요하다.  
   `owner_id` 단일 소유 모델 대신 조직, 역할, 감사 로그를 처음부터 넣어야 한다.
3. 오프라인 작성 후 동기화가 필수다.  
   IndexedDB, 충돌 해결, 로컬 파일 큐가 핵심 아키텍처가 된다.
4. 법적 원본 보관, 전자서명, 대량 발행이 필수다.  
   백업/감사/서버 처리/유료 인프라를 전제로 해야 한다.

위 조건이 아니라면 이 계획대로 진행한다.

---

## 0.1. 백엔드 재평가 (2026-06-03)

로컬 우선 프로토타입이 완성된 뒤 "Svelte+Supabase 조합이 현재 최적인가"를 다시 점검했다.

**핵심 인식: 백엔드는 아직 확정된 게 아니다.** 앱은 localStorage 로컬 우선으로 100% 작동하고, 데이터 접근은 교체 가능한 어댑터(`src/lib/data/db.svelte.ts`) 뒤에 분리돼 있다. 따라서 질문은 "Svelte vs Next"가 아니라 "백엔드가 지금 필요한가, 필요하면 무엇인가"이다.

**프론트엔드(SvelteKit): 유지 — 거의 최적.** 가볍고 모바일·Capacitor에 맞다. 현재 SPA(`ssr=false`)라 이전에 우려하던 `@supabase/ssr` 엣지 쿠키 인증 리스크가 사라진다(브라우저에서 `supabase-js` + anon키 + RLS로 직접 접근). Next.js 전환 근거 없음.

**백엔드: Supabase는 "교체 대상"이 아니라 "보류 가능한 기본값".** 대안들도 깔끔한 승자가 아니다.

| 선택지 | 장점 | 이 앱에서의 약점 |
|--------|------|------------------|
| 로컬 유지 + JSON 백업 | 비용·운영 0, 이미 작동 | 기기 간 동기화 없음 |
| **Supabase** | 관리형 인증·스토리지·**브라우저 직접 접근(SPA 유지)**, 마이그레이션 SQL 완성 | **7일 미사용 자동정지**(keepalive cron 필요), 무료 백업 없음 |
| Cloudflare D1+R2 | 정지 없음, 호스팅과 동일 플랫폼 | **SPA 탈피** — D1은 서버 전용이라 SvelteKit 서버 엔드포인트를 새로 짜야 함(=변경 더 큼) |
| PocketBase 자가호스팅 | 데이터 소유, 정지 없음, 월 $5 | **VPS 직접 운영**(가동·업데이트·백업) — 비개발 1인엔 오히려 부담 |

**정정 사항**: RLS는 1인이라도 보안 필수다. Supabase는 anon키가 클라이언트에 노출되고 모든 테이블이 PostgREST로 공개되므로, RLS가 없으면 데이터가 전 세계에 읽기/쓰기 가능해진다(멀티테넌트용 사치가 아니라 핵심 보안). Supabase의 유일한 실질 약점은 7일 자동정지다.

**결정(사용자 확인):** 동기화는 "곧 필요하지만 지금 당장은 아님", 백엔드 방향은 "사용량을 보고 결정". → 가장 싸고 되돌릴 수 있는 수로 **지금은 로컬 우선을 유지하고, JSON 내보내기/가져오기 백업을 추가**한다(설정 화면, `db.exportSnapshot`/`importSnapshot`). 이는 ① 로컬 모드의 백업 부재를 해결하고 ② "곧 필요"한 기기 간 이전을 수동(폰에서 내보내기 → 데스크톱에서 가져오기)으로 즉시 가능하게 한다.

**전환 트리거와 경로:** 기기 간 동기화가 실제로 필요해지면 → SPA를 유지하는 **Supabase 연결이 기본값**(7일 정지는 GitHub Actions keepalive로 처리, 마이그레이션 SQL은 `supabase/migrations/0001_init.sql`에 완성). 정지가 정말 거슬리고 직접 운영이 가능하면 PocketBase, Postgres 고유 기능(pgvector 등)이 필요해지면 Supabase로 확정. 어느 쪽이든 어댑터 교체만으로 화면 코드는 유지된다.

---

## 1. MVP 범위

### 반드시 구현

- 로그인
- 내 회사 정보 저장: 상호, 사업자번호, 대표자, 주소, 연락처, 로고, 직인, 계좌
- 거래처 CRUD
- 품목 CRUD: 품명, 규격, 단위, 최근 단가
- 견적서 작성/수정/삭제
- 견적서 라인 품목 자동완성 및 단가 자동입력
- 공급가액, VAT, 합계 자동 계산
- PDF 출력
- Excel 출력
- RLS로 사용자 데이터 격리

### MVP에서 제외

- 전자세금계산서 실제 발행
- 매출 분석 대시보드
- AI/임베딩 기반 의미 검색
- iOS 앱스토어 출시
- 다중 사용자 권한

### 구현 현황 (2026-06-03)

로컬 우선 프로토타입으로 다음이 동작하며 Playwright로 실제 검증됨:

- ✅ 회사정보(로고/직인 dataURL)·거래처·품목 CRUD, 견적 작성/수정/상세/목록
- ✅ 품목 자동완성·단가 자동입력, 빠른 입력 자동 채움(Fuse.js + 정규식)
- ✅ 견적 라인 행별 뷰어/편집 모드(컴팩트 텍스트 → 수정 시 펼침)
- ✅ 공급가액/세액/합계 실시간 계산(floor), A4 인쇄(헤더/본문/푸터), Excel 내보내기
- ✅ JSON 백업 내보내기/가져오기(로컬 백업 + 수동 기기 이전)
- ⏸ 로그인·RLS 데이터 격리: 백엔드 연결 단계로 보류(현재 로컬 모드는 단일 기기, §0.1)

---

## 2. 아키텍처

```text
[모바일/데스크톱 브라우저]
        |
        v
SvelteKit (Cloudflare Pages)
  - 인증 화면
  - 설정/거래처/품목/견적서 UI
  - 인쇄 전용 견적서 화면
  - PDF/Excel 생성 모듈은 필요 시 동적 import
  - SmartInput: Fuse.js + 규칙 기반 파서
        |
        v
Supabase
  - Auth
  - PostgreSQL + RLS
  - Storage: 로고/직인
```

원칙:

- 데이터 권한은 Supabase RLS에서 강제한다.
- PDF/Excel은 클라이언트에서 생성하되, 초기 번들에 넣지 않는다.
- 서버 비밀키가 필요한 기능은 클라이언트에 넣지 않는다.
- 금액 계산은 클라이언트에서 즉시 보여주고, 저장 직전과 DB 함수/검증 로직에서 다시 계산한다.

---

## 3. 기술 선택 상세

### 3-1. SvelteKit + Supabase

- `@supabase/supabase-js`와 `@supabase/ssr`를 사용한다.
- 서버 코드에서는 세션 객체만 믿지 말고 `auth.getUser()` 기준으로 사용자 검증을 한다.
- 보호 라우트는 `hooks.server.ts`와 layout load에서 처리한다.
- 1인 사용이므로 인증은 이메일+비밀번호로 충분하다. **최초 1회 가입 후 Supabase 대시보드에서 신규 가입(Sign-ups)을 비활성화**해 외부 가입을 막는다. RLS가 `owner_id = auth.uid()`로 데이터를 격리하므로, 인증을 통과한 본인 외에는 어떤 행도 보이지 않는다.

### 3-2. 호스팅 — Cloudflare Pages (vs Vercel)

호스팅(앱 파일 서빙)과 백엔드(데이터, §0.1)는 **다른 층**이다. 어느 백엔드를 쓰든 호스트는 따로 고른다. SvelteKit은 어댑터 한 줄 교체로 호스트를 바꾸므로 락인은 작다.

**결정: Cloudflare Pages.** 이 앱은 **사업자용 견적 도구 = 상업적 사용**인데, 이것이 결정적이다.

| 기준 | Cloudflare Pages | Vercel (Hobby 무료) |
|------|------------------|---------------------|
| **상업적 사용** | ✅ 무료 허용 | ❌ 금지 — 사업·수익 목적은 Pro $20/월 |
| 대역폭 | 무제한 | 100GB/월, 초과 시 앱 정지(오프라인) |
| 빌드 | 500회/월 | 넉넉 |
| SvelteKit | 1급(`adapter-cloudflare`) | 1급(`adapter-vercel`) |
| 한국 지연 | 서울 엣지 | 서울 엣지(정적 동등) |
| DX | 좋음 | 약간 더 매끄러움 |
| Supabase 연동 | 동일(별개 서비스) | 동일 |

- Vercel Hobby는 "관련자의 금전적 이득을 위한 배포"를 금지하고 위반 시 계정 정지 가능 → 사업 도구는 회색지대, 안전하려면 Pro $20/월. Cloudflare Pages는 무료로 상업 사용 허용 + 대역폭 무제한 + 초과 정지 없음.
- Vercel의 강점(DX, Next.js 최적화)은 SvelteKit SPA인 이 앱엔 거의 이득이 없다. "Vercel로 시작하라"는 통념은 비상업·Next.js 기준이다.
- 무거운 서버 PDF(Puppeteer/Chromium)는 어차피 클라이언트 인쇄-CSS로 대체했으므로 엣지 제약과 무관.
- Cron/keepalive(Supabase 도입 시)는 Cloudflare Worker Cron 또는 외부 cron으로 별도.
- **현재 배포 방식**: 순수 SPA(`ssr=false`)이므로 `@sveltejs/adapter-static`으로 정적 빌드(`build/`)해 Cloudflare Pages에 올린다(Worker 불필요·이식성 최대, 무제한 정적 대역폭에 정합). SPA 딥링크는 `static/_redirects`로 처리. SSR이 필요해지면(Phase 6 SSR 인증 등) `adapter-cloudflare`/`adapter-node`로 교체.

⚠️ **Supabase를 SSR로 붙일 경우(Phase 6)** `@supabase/ssr` 쿠키 인증이 Cloudflare Workers 엣지에서 동작하는지 먼저 스모크 테스트한다. 이건 배포 어댑터 문제이지 Svelte+Supabase 호환 문제가 아니다. 충돌하면 `@sveltejs/adapter-node` + Node 호스트로 교체이지 Next.js 전환이 아니다. (현재는 SPA + 클라이언트 직접 접근이라 이 이슈는 발생하지 않는다.)

### 3-3. PDF

권장 순서:

1. `/quotes/[id]/print` 인쇄 전용 화면 + `@media print`
2. pdfmake를 동적 import로 추가
3. 한글 폰트는 나눔고딕/프리텐다드 등 라이선스 확인 후 지연 로딩

주의:

- 한글 폰트를 VFS에 통째로 넣으면 초기 JS가 커진다.
- PDF 버튼을 누를 때만 라이브러리와 폰트를 로드한다.
- PDF 출력 실패 시 브라우저 인쇄 저장 경로를 유지한다.
- **로고/직인 임베딩**: Storage 버킷은 비공개(경로=`{owner_id}/...`, §5)이므로 pdfmake에 URL을 직접 넣을 수 없다. 서명 URL로 받거나 바이트를 내려받아 **dataURL(base64)** 로 변환해 `image`에 넣는다. 인쇄 CSS 경로에서는 서명 URL을 `<img src>`로 써도 된다.
- **여러 페이지 견적**: 라인이 많아 페이지를 넘기면 인쇄 CSS에서 `thead { display: table-header-group }`로 표 머리글을 반복하고, 행에 `break-inside: avoid`를 둔다. pdfmake는 표가 자동 분할되지만 합계 블록에 `unbreakable`을 적용한다.

### 3-4. Excel

- ExcelJS를 동적 import한다.
- 견적서 양식에 필요한 병합, 테두리, 정렬, 숫자 서식을 적용한다.
- Excel 내보내기는 저장된 견적서를 기준으로 생성해 화면 상태와 파일 내용이 어긋나지 않게 한다.

---

## 4. 데이터 모델

모든 업무 테이블은 `owner_id uuid not null references auth.users(id)`를 갖는다. 특히 `quote_items`에도 `owner_id`를 둔다. 상위 `quotes` 조인으로만 RLS를 걸 수는 있지만, 정책과 쿼리가 복잡해지고 실수 여지가 커진다.

### 4-1. companies

```sql
create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  business_number text not null,
  name text not null,
  ceo_name text,
  address text,
  phone text,
  logo_path text,
  stamp_path text,
  bank_account text,
  is_tax_free boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);
```

### 4-2. customers

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  business_number text,
  ceo_name text,
  address text,
  contact text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_owner_name_idx on customers (owner_id, name);
create unique index customers_owner_id_idx on customers (owner_id, id);
```

### 4-3. items

```sql
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  spec text,
  unit text,
  unit_price numeric(14,0) not null default 0,
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_owner_name_idx on items (owner_id, name);
create unique index items_owner_id_idx on items (owner_id, id);
```

### 4-4. quotes

```sql
create table quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  quote_number text not null,
  customer_id uuid,
  issue_date date not null default current_date,
  valid_until date,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'canceled')),
  supply_amount numeric(14,0) not null default 0,
  vat_amount numeric(14,0) not null default 0,
  total_amount numeric(14,0) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, quote_number),
  unique (owner_id, id),
  foreign key (owner_id, customer_id) references customers(owner_id, id)
);
```

### 4-5. quote_items

```sql
create table quote_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  quote_id uuid not null,
  item_id uuid,
  item_name text not null,
  spec text,
  unit text,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,0) not null check (unit_price >= 0),
  amount numeric(14,0) not null
    generated always as (floor(quantity * unit_price)) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  foreign key (owner_id, quote_id) references quotes(owner_id, id) on delete cascade,
  foreign key (owner_id, item_id) references items(owner_id, id)
    on delete set null (item_id)
);

create index quote_items_quote_idx on quote_items (owner_id, quote_id, sort_order);
```

설계 의도:

- `amount`는 **생성 컬럼**으로 둬서 클라이언트가 보낸 값을 신뢰하지 않는다. `quantity`/`unit_price`는 발행 시점 스냅샷이므로 `amount`도 그 시점 값으로 고정된다.
- `item_id` FK는 `on delete set null (item_id)`(PostgreSQL 15+, Supabase 지원)로 둔다. 복합 FK `(owner_id, item_id)`에서 `owner_id`는 `not null`이라 전체 SET NULL이 불가하므로 **`item_id`만 null로** 비운다. 품목 마스터를 지워도 과거 견적 라인은 스냅샷으로 살아남는다.
- 다만 운영상 품목은 **하드 삭제 대신 `items.active = false` 소프트 삭제**를 기본 경로로 한다(자동완성에서만 숨김). 하드 삭제는 위 FK가 안전망이다.
- ⚠️ `on delete set null (item_id)` 컬럼 지정 구문은 **PostgreSQL 15+** 전용이다. 신규 Supabase 프로젝트는 15+라 안전하지만, 마이그레이션 전 프로젝트의 Postgres 버전을 한 번 확인한다(구버전이면 이 DDL이 실패한다).

### 4-6. 견적번호 채번

클라이언트에서 `YYYYMM-NNN`을 직접 만들면 동시에 저장할 때 중복될 수 있다. DB RPC로 원자적으로 발급한다.

```sql
create table quote_counters (
  owner_id uuid not null references auth.users(id),
  year_month text not null,
  last_seq int not null default 0,
  primary key (owner_id, year_month)
);
```

`next_quote_number` 함수가 `insert ... on conflict ... do update returning`으로 `last_seq`를 원자적으로 증가시킨다.

```sql
create or replace function next_quote_number(p_year_month text)
returns text
language plpgsql
security invoker        -- 호출자 권한으로 실행 → quote_counters RLS가 그대로 적용됨
set search_path = public
as $$
declare
  v_seq int;
begin
  insert into quote_counters (owner_id, year_month, last_seq)
  values (auth.uid(), p_year_month, 1)
  on conflict (owner_id, year_month)
  do update set last_seq = quote_counters.last_seq + 1
  returning last_seq into v_seq;

  return p_year_month || '-' || lpad(v_seq::text, 3, '0');  -- 예: 202606-001
end;
$$;
```

`on conflict do update`는 단일 문장 안에서 행 잠금→증가→반환을 처리하므로, 두 요청이 동시에 같은 달을 채번해도 번호가 겹치지 않는다.

---

### 4-7. 견적서 원자적 저장 (save_quote RPC)

견적서 저장은 ①채번 ②헤더 insert ③라인 N건 insert ④헤더 합계 갱신이 **하나의 트랜잭션**이어야 한다. supabase-js에서 이를 개별 요청으로 쪼개면 중간 실패 시 고아 레코드가 남는다. 따라서 저장 경로를 단일 RPC로 통일한다.

```sql
create or replace function save_quote(p_quote jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_is_new    boolean := (p_quote->>'id') is null;
  v_quote_id  uuid := coalesce((p_quote->>'id')::uuid, gen_random_uuid());
  v_number    text := p_quote->>'quote_number';
  v_supply    numeric(14,0);
  v_vat       numeric(14,0);
  v_tax_free  boolean;
begin
  -- 채번은 '진짜 신규'일 때만. 편집이면 기존 번호를 유지해 시퀀스 낭비/번호 변경을 막는다.
  if v_number is null then
    if v_is_new then
      v_number := next_quote_number(to_char(coalesce((p_quote->>'issue_date')::date, current_date), 'YYYYMM'));
    else
      select quote_number into v_number from quotes where id = v_quote_id and owner_id = v_uid;
    end if;
  end if;

  -- 헤더 upsert (합계는 라인 반영 후 다시 계산)
  insert into quotes (id, owner_id, quote_number, customer_id, issue_date, valid_until, status, notes)
  values (v_quote_id, v_uid, v_number,
          (p_quote->>'customer_id')::uuid,
          coalesce((p_quote->>'issue_date')::date, current_date),
          (p_quote->>'valid_until')::date,
          coalesce(p_quote->>'status', 'draft'),
          p_quote->>'notes')
  on conflict (id) do update
    set customer_id = excluded.customer_id,
        issue_date  = excluded.issue_date,
        valid_until = excluded.valid_until,
        status      = excluded.status,
        notes       = excluded.notes,
        updated_at  = now();

  -- 라인 전체 교체 (amount는 생성 컬럼이라 삽입 대상 아님)
  delete from quote_items where owner_id = v_uid and quote_id = v_quote_id;
  insert into quote_items (owner_id, quote_id, item_id, item_name, spec, unit, quantity, unit_price, sort_order)
  select v_uid, v_quote_id,
         (e->>'item_id')::uuid, e->>'item_name', e->>'spec', e->>'unit',
         (e->>'quantity')::numeric, (e->>'unit_price')::numeric,
         coalesce((e->>'sort_order')::int, ordinality::int)
  from jsonb_array_elements(p_items) with ordinality as t(e, ordinality);

  -- 합계 재계산 (클라이언트 값 불신, DB가 진실의 원천)
  select coalesce(sum(amount), 0) into v_supply
  from quote_items where owner_id = v_uid and quote_id = v_quote_id;

  select is_tax_free into v_tax_free from companies where owner_id = v_uid;
  v_vat := case when coalesce(v_tax_free, false) then 0 else floor(v_supply * 0.1) end;

  update quotes
     set supply_amount = v_supply,
         vat_amount    = v_vat,
         total_amount  = v_supply + v_vat,
         updated_at    = now()
   where id = v_quote_id and owner_id = v_uid;

  return v_quote_id;
end;
$$;
```

- 클라이언트는 `supabase.rpc('save_quote', { p_quote, p_items })` 한 번만 호출한다.
- 함수 전체가 하나의 트랜잭션이라 중간 실패 시 전부 롤백된다.
- **호출 계약**: ① `customer_id`는 FK가 걸려 있으므로 **거래처가 먼저 저장돼 있어야** 한다. CustomerPicker에서 신규 거래처를 입력하면 `save_quote` 전에 customers에 insert하고 그 id를 넘긴다(또는 향후 `save_quote`에 거래처 필드를 받아 upsert하도록 확장). ② **편집 시에는 `id`와 기존 `quote_number`를 함께 보낸다**(번호 누락 시 위 가드가 기존 번호를 복구하지만, 명시 전달이 안전).
- 합계와 VAT는 **DB가 다시 계산**하므로 §6의 "서버 재계산" 요구가 여기서 충족된다. 별도 서버 티어가 없어도 무결성이 보장된다.
- `security invoker` + RLS 덕분에 함수 안의 모든 접근도 소유자 범위로 제한된다.

### 4-8. updated_at 자동 갱신

`updated_at`을 둔 테이블(companies/customers/items/quotes)은 공용 트리거로 갱신한다.

```sql
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger trg_items_touch before update on items
  for each row execute function touch_updated_at();
-- companies/customers/quotes에도 동일 트리거 부착
```

---

## 5. RLS 정책

기본 패턴:

```sql
alter table items enable row level security;

create policy items_owner_select on items
  for select using (owner_id = auth.uid());

create policy items_owner_insert on items
  for insert with check (owner_id = auth.uid());

create policy items_owner_update on items
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy items_owner_delete on items
  for delete using (owner_id = auth.uid());
```

`companies`, `customers`, `quotes`, `quote_items`, `quote_counters`도 동일한 소유자 정책을 둔다.

Storage 정책:

- 버킷: `company-assets`
- 경로 규칙: `{owner_id}/logo/*`, `{owner_id}/stamp/*`
- 업로드/조회/삭제는 경로 첫 세그먼트가 `auth.uid()`와 같을 때만 허용한다.

---

## 6. 금액 계산 규칙

기본은 과세 사업자 기준이다.

- 라인 금액: `amount = floor(quantity * unit_price)`
- 공급가액: `supply_amount = sum(amount)`
- VAT: `vat_amount = floor(supply_amount * 0.1)`
- 합계: `total_amount = supply_amount + vat_amount`
- 면세 사업자: `companies.is_tax_free = true`이면 `vat_amount = 0`

주의:

- 기존 문서의 `round(...)`와 "원 단위 절사" 표현이 충돌했으므로 `floor`로 통일한다.
- 원화 기준 금액은 `numeric(14,0)`으로 저장한다.
- 수량은 소수점이 필요할 수 있으므로 `numeric(14,2)`를 유지한다.
- 클라이언트 값은 화면 표시용일 뿐이다. **진실의 원천은 DB**다: 라인 `amount`는 생성 컬럼(§4-5), 헤더 `supply_amount`/`vat_amount`/`total_amount`는 `save_quote` RPC(§4-7)가 재계산한다. Cloudflare Pages엔 별도 서버 티어가 없으므로 무결성은 DB 계층(생성 컬럼 + RPC 트랜잭션)에서만 강제한다.

---

## 7. 화면 구성

| 경로 | 역할 |
|------|------|
| `/login` | 로그인 |
| `/settings` | 회사 정보, 로고, 직인, 계좌 |
| `/customers` | 거래처 목록/등록/수정 |
| `/items` | 품목 목록/등록/수정 |
| `/quotes` | 견적서 목록, 상태 필터 |
| `/quotes/new` | 견적서 작성 |
| `/quotes/[id]` | 견적서 상세, 수정, PDF/Excel 출력 |
| `/quotes/[id]/print` | 인쇄/PDF 저장 전용 화면 |

`/quotes/new` 컴포넌트:

```text
QuoteForm
  CustomerPicker
  QuoteMeta
  SmartInput
  LineItemTable
    LineItemRow
    ItemPicker
  TotalsBar
  ActionBar
```

모바일 UX:

- 하단 고정 저장/출력 액션
- 합계 sticky 표시
- 숫자 입력은 `inputmode="decimal"` 또는 `inputmode="numeric"`
- 라인 편집은 카드 블록이 아니라 헤어라인으로 구분된 행으로 한다. 모바일에서는 품명·규격·수량·단가·금액 입력을 세로로 쌓아 줄바꿈/가로 스크롤로 레이아웃이 깨지는 것을 막는다(DESIGN.md `line-item-row` 참조).
- PDF 미리보기는 인쇄 화면으로 검증

---

## 8. 자동입력

1차 구현은 Fuse.js와 정규식 파서다.

입력 예:

```text
철근 10개 5만원, 시멘트 20포대 단가 8000
```

처리 흐름:

```text
1. 쉼표/줄바꿈으로 청크 분리
2. 각 청크에서 수량, 단위, 금액/단가 토큰 추출
3. 숫자/단위/가격 토큰을 제거한 텍스트를 품목 후보명으로 사용
4. Fuse.js로 items.name/spec 검색
5. 매칭 신뢰도가 낮으면 사용자 확인 표시
6. 입력 가격이 있으면 입력값 우선, 없으면 품목 DB 단가 사용
7. 견적 라인에 반영
```

지원 규칙:

- `10개`, `20 포대`, `3.5m`
- `5만원`, `50,000원`, `단가 8000`, `@8000`
- 미매칭 품목은 사용자가 입력한 이름 그대로 행을 만든다.

보류:

- Transformers.js/WebGPU는 품목명이 동의어/문장으로 자주 들어오는 것이 확인된 뒤 도입한다.
- n8n은 이메일/메신저에서 견적 초안을 자동 생성해야 할 때 검토한다.

구현 메모:

- Fuse.js는 클라이언트에서 `items` 전체를 메모리에 올려 검색한다. 1인·수백~수천 품목 규모에선 문제없다. 품목이 수만 건으로 커지면 서버측 `pg_trgm`/`ilike` 검색으로 옮긴다.
- 파서 규칙은 데이터로 검증되는 휴리스틱이다. 단위/금액 표기 변형이 나올 때마다 규칙을 추가하고, 신뢰도 낮은 행은 항상 사용자 확인을 거친다(자동 확정 금지).

---

## 9. 개발 순서

전략: **Supabase 프로젝트를 만들기 전에 로컬 앱을 "실제로 믿을 수 있는 제품"으로 만들고, 동시에 백엔드 교체가 구조적으로 보장되도록 데이터 계층을 정렬한다.** 이 둘은 모두 백엔드 없이 할 수 있고, 미래의 백엔드 결정(§0.1) 위험을 가장 크게 줄이는 작업이다. Supabase는 동기화가 실제로 필요해질 때(Phase 7) 연결한다.

### Phase 0. 로컬 프로토타입 — ✅ 완료

스캐폴딩(SvelteKit+TS+Tailwind v4) → 디자인 토큰 → 로컬 어댑터 → 화면 9종 → 자동입력 → 출력(PDF/Excel) → JSON 백업까지 구현·검증 완료. 현재 `localStorage` 단일 기기로 전체 흐름이 동작한다(§1 구현 현황).

---

> **이하 Phase 1~5는 Supabase 생성 전에 수행한다.** 우선순위 = 안정성·신뢰성 > 신규 기능.
> 순서 원칙: **안전망(테스트)을 먼저 깔고, 현재 데이터 손실 위험부터 막은 뒤, 침습적 변경을 한다.** 가장 침습적인 비동기 어댑터 전환은 사용자 가치가 0이고 아직 필요 없는 교체를 위한 것이므로 Phase 6(백엔드)의 첫 단계로 미룬다 — 그때는 e2e 스모크가 보호해 준다.

### Phase 1. 자동 테스트 (안전망 — 가장 먼저)

목적: 한번 맞춘 동작을 회귀로부터 잠근다. 이후 모든 리팩터(특히 Phase 6의 동기→비동기 전환)가 동작을 깨지 않았음을 이 그물이 증명한다.

1. Vitest 단위 테스트(순수 함수라 리팩터와 무관하게 살아남음):
   - `money.ts`: `floor` 라인금액, VAT 10%, 면세 0 처리, 합계.
   - `autofill.ts`: 한글 단위 파싱("2톤"·"20포"의 `\b` 버그 회귀 테스트), 만/천·콤마·`@`·"단가" 가격 파싱, 미매칭 폴백.
   - 채번: `YYYYMM-NNN`, 월 롤오버.
2. Playwright e2e 스모크(블랙박스 — UI 클릭→합계/PDF/Excel 확인이라 리팩터 후에도 그대로 통과): 작성→자동입력→저장→상세→인쇄(가로 스크롤 0)→Excel→백업 라운드트립.
3. CI(선택): GitHub Actions에서 `npm run check` + 테스트.

**완료 기준**: 핵심 계산·파싱·채번·플로우가 녹색으로 고정된다. (이 그물이 있어야 이후 단계를 안심하고 진행한다.)

### Phase 2. 로컬 데이터 안전 (용량·백업) — 현재 데이터 손실 위험 차단

목적: 백엔드가 없는 동안 데이터를 잃지 않게. 이건 미래 과제가 아니라 **지금 있는 버그**다.

1. **저장 실패 가드(완료)**: `persist()`가 용량 초과 등으로 조용히 던져 데이터가 사라지던 문제를 try/catch로 감싸 사용자에게 알리도록 수정함(`db.saveError`).
2. **이미지 압축(완료)**: 로고/직인을 업로드 시 리사이즈·압축(`compressImage`)해 ~5MB 한도 잠식을 막음.
3. **백업 환기(완료)**: 설정의 "마지막 백업: N일 전" + 미백업/14일↑ 시 상단 넛지 배너([지금 백업]).

**IndexedDB 전환 — 보류 결정(2026-06-04).** 근거: ⓐ 용량 문제가 아직 없음(견적 1~2KB·압축 이미지 → 5MB에 수천 건). ⓑ **IndexedDB는 내구성을 올리지 않는다** — Safari ITP는 홈 화면 미설치 시 localStorage·IndexedDB·Cache를 동일하게 7일에 삭제. ⓒ 실데이터(실 사업자번호·계좌) 저장소 이전은 손실 위험만 큼. **내구성의 진짜 레버는 PWA 설치 강제(완료)·백업 넛지(완료)·Supabase(§0.1).** 데이터가 실제로 커질 때만 용량 목적으로 도입하고, 그때도 localStorage 백업 유지·`ready` 게이트·마이그레이션 검증을 둔다.

**완료 기준**: 이미지 포함 데이터가 쌓여도 저장이 조용히 실패하지 않고, 옛 백업도 안전하게 복원된다.

### Phase 3. 입력 검증·에러·엣지케이스 (신뢰성)

목적: 1인이 매일 써도 데이터가 어긋나지 않게.

1. 필수값 검증: 회사정보 미입력 시 첫 견적 안내, 라인은 품명 필수·수량>0, 금액 음수/NaN 방지.
2. 숫자 입력 견고화: 콤마 입력 허용·정규화, 거대값·소수 처리, 단가 0 허용 정책화.
3. 채번 점검: `YYYYMM-NNN` 월 경계, 수동 수정 시 충돌 방지(단일 기기 동시성은 사실상 안전 — 문서화).
4. 상태 전이 규칙: **결정 — 1인 도구이므로 하드 잠금 없이 항상 수정 허용**(유연성 우선). 다중 사용자/감사가 필요해지면 그때 잠금·경고 도입.
5. 손상 대비: `localStorage` 파싱 실패 시 시드 폴백 검증, 잘못된 백업 거부 회귀 방지.

**완료 기준**: 빈 값·이상값·연속 추가/삭제/수정에서 합계·번호·스냅샷이 어긋나지 않는다.

### Phase 4. 출력 완성도 (실무 신뢰)

목적: PDF/Excel이 실제 거래처에 보낼 품질이 되게.

1. 한글 금액 병기: "일금 이백칠십칠만이천원정" 변환을 견적서에 추가.
2. 다중 페이지 검증: 라인 수십 개 → 페이지 분할·표 머리 반복(`thead`), 푸터 위치.
3. 엣지: 긴 품명 말줄임, 면세·0라인·옵션 누락, Excel 긴 이름·열 너비·회사 헤더.
4. PDF 경로 결정 문서화: 인쇄-CSS(무의존·한글 완벽)를 1차로 유지, "다운로드형 PDF 파일"이 필요할 때만 pdfmake 도입(§3-3).

**완료 기준**: 면세/과세·장문·다중 페이지에서 PDF·Excel이 깨지지 않고 한글이 정확하다.

### Phase 5. 모바일 앱화 (PWA) — 로컬 우선과 정확히 맞는 고가치 작업

목적: 백엔드 없이도 실제 휴대폰에서 매일 쓰는 도구로. 로컬 우선이라 오프라인이 자연히 된다.

1. Web App Manifest + 아이콘: 홈 화면 설치 가능하게.
2. Service Worker: 앱 셸 캐시로 오프라인 구동(데이터는 이미 로컬).
3. iOS Safari "홈 화면에 추가" 동작·상태바·safe-area 점검.

**완료 기준**: 휴대폰 홈 화면에서 실행되고, 비행기 모드에서도 작성·출력이 된다.

---

### Phase 6. 백엔드 연결 (Supabase) — 동기화가 실제 필요해질 때만

(전환 트리거·근거는 §0.1) **첫 단계가 어댑터 비동기 전환**이다 — 가치 중립적·침습적이므로 여기서, Phase 1의 e2e 스모크가 보호하는 가운데 한다.

1. **어댑터 심(비동기 전환)**: `Repository` 인터페이스를 정의하고 모든 메서드를 `Promise` 반환으로 선언. `LocalRepo`를 async로 래핑하고 화면 호출부에 `await`·로딩/에러 도입. 교체 지점을 단일 provider(`getRepo()`)로 모은다. → 이후 `SupabaseRepo`는 같은 인터페이스만 구현하면 화면 변경 0. **e2e 스모크로 회귀 0 확인.**
2. Supabase 프로젝트 생성 + `supabase/migrations/0001_init.sql` 적용(테이블·인덱스·FK·RLS·RPC).
3. Storage 비공개 버킷 `company-assets` + 경로 정책(§5).
4. `SupabaseRepo` 작성 → `saveQuote`는 `rpc('save_quote', …)`, 채번은 서버 RPC. `getRepo()` 한 줄 교체.
5. 인증: `/login`·보호 라우트. SPA 유지 시 `supabase-js` 클라이언트 직접 사용(서버 쿠키 불필요). SSR이 필요하면 `@supabase/ssr` + `hooks.server.ts`.
6. **검증**: (SSR 채택 시) `@supabase/ssr` 쿠키 인증이 Cloudflare Workers 엣지에서 동작하는지 스모크. 충돌 시 `adapter-node`(§3-2). SPA면 해당 없음. 로컬 백업(JSON)을 Supabase로 1회 임포트하는 경로 제공.

### Phase 7. 확장 검토

- 전자세금계산서: 서버 API·공급업체·인증서·비용 검토 후 별도 계획.
- 매출 대시보드: quotes 집계.
- iOS 네이티브: 모바일 웹/PWA 사용성이 검증된 뒤 Capacitor 래핑.

---

## 10. 테스트 기준

### 로컬 단계 (Phase 1~6, 지금 검증 가능)

- VAT 계산이 `floor` 기준으로 일관됨, 면세 설정 시 세액 0원
- 라인 금액 = `floor(수량×단가)`, 합계 = 공급가액+세액(실시간)
- 자동입력: 한글 단위("2톤"·"20포") 수량 정확, 가격 파싱(만/콤마/`@`/단가) 정확, 미매칭 폴백
- 견적번호: `YYYYMM-NNN` 월 롤오버, 동일 월 연속 발급 시 중복 없음
- 품목 단가 변경 후에도 과거 견적 라인 금액 유지(스냅샷)
- 품목 소프트 삭제 시 자동완성엔 안 뜨고 과거 견적은 유지
- 빈 값·이상값·연속 추가/삭제/수정에서 합계·번호가 어긋나지 않음
- PDF 한글·로고·직인 표시, 모바일 인쇄 가로 스크롤 0(scrollWidth=clientWidth)
- Excel 병합·테두리·금액 서식 표시, 유효한 .xlsx
- 백업: 내보내기→가져오기 라운드트립으로 동일 데이터 복원, 잘못된 파일 거부
- 모바일에서 라인 추가/수정(뷰어↔편집)/삭제가 불편하지 않음

### 백엔드 단계 (Phase 7, Supabase 연결 후)

- RLS: 다른 사용자 데이터 조회/수정/삭제 불가, 로그아웃 시 보호 라우트 접근 불가
- 채번: 동시에 2개 생성해도 중복 없음(`next_quote_number` 원자성)
- 원자성: `save_quote` 중간 실패 시 고아 라인 없이 전부 롤백
- 무결성: 클라이언트가 조작한 `amount`/합계를 보내도 DB 생성 컬럼·RPC 계산값으로 저장
- 하드 삭제 시 `item_id`만 null·라인 보존

---

## 11. 운영

### 로컬 모드 (현재)

- 데이터는 이 브라우저에만 있다. **백업이 유일한 안전망** — 설정 화면에서 주기적으로 JSON 내보내기.
- `localStorage`는 ~5MB 한도다. 로고/직인(base64)·견적 누적이 한도에 닿을 수 있으므로 Phase 4에서 이미지 압축 또는 IndexedDB 이전으로 대비한다.
- 브라우저 데이터 삭제·기기 분실 = 데이터 소실. 가져오기로 복원하려면 최신 백업 파일이 필요하다.

### 백엔드 모드 (Phase 7 이후)

- Supabase 무료 플랜은 7일 미사용 자동정지와 백업 부재가 가장 큰 리스크다. GitHub Actions 등으로 keepalive 핑(주 2회 권장), 배포 직전 최신 요금제 재확인.
- 주 1회 `supabase db dump` 또는 `pg_dump` 백업.
- service role key는 클라이언트 번들에 절대 넣지 않는다. `.env`는 로컬·배포 환경 변수로만 관리.

---

## 12. 참고

- Supabase SvelteKit SSR 인증: https://supabase.com/docs/guides/auth/server-side/sveltekit
- Supabase 가격/무료 한도: https://supabase.com/pricing
- Supabase 백업 안내: https://supabase.com/docs/guides/platform/backups
- Cloudflare Workers/Pages 가격: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Pages SvelteKit 배포: https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/
- pdfmake: https://github.com/bpampuch/pdfmake
- ExcelJS: https://github.com/exceljs/exceljs
- Fuse.js: https://www.fusejs.io/
