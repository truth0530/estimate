---
version: alpha
name: Estimate App Design System
description: 1인 사업자를 위한 견적서 관리 앱 디자인 시스템 — 절제된 잉크 기반 모노크롬, 헤어라인 구분, 밀도 높은 행 레이아웃
colors:
  # Action / Ink (주요 액션, 텍스트의 기준이 되는 잉크색)
  primary: "#18181b"                # Zinc 900 (주요 버튼, 강조 텍스트)
  on-primary: "#ffffff"
  primary-hover: "#27272a"          # Zinc 800

  # Text scale (단일 잉크에서 농도만 낮춘 위계 — 색을 쓰지 않는다)
  text-strong: "#18181b"            # 제목, 금액, 핵심 데이터
  text: "#3f3f46"                   # Zinc 700 (본문)
  text-muted: "#71717a"             # Zinc 500 (메타, 보조 설명)
  text-faint: "#a1a1aa"             # Zinc 400 (플레이스홀더, 비활성)

  # Surfaces (배경과 면을 색이 아니라 헤어라인으로 구분한다)
  background: "#ffffff"             # 앱 전체 단일 흰 배경
  surface: "#ffffff"
  surface-sunken: "#fafafa"         # Zinc 50 (입력 필드 비활성, 표 머리 등 극히 미묘한 음영)

  # Lines (구분의 주역. 그림자·카드 대신 이 헤어라인을 쓴다)
  border: "#e4e4e7"                 # Zinc 200 (일반 구분선·테두리)
  border-strong: "#d4d4d8"          # Zinc 300 (입력 포커스 외 강조 경계)
  border-focus: "#18181b"           # 포커스 시 잉크 보더

  # Status (배경 알약 금지. 작은 점 또는 텍스트 색으로만 쓴다)
  status-draft: "#a1a1aa"           # 회색 (작성 중)
  status-sent: "#2563eb"            # 절제된 블루 (발송)
  status-accepted: "#15803d"        # 절제된 딥 그린 (승인)
  status-rejected: "#b91c1c"        # 절제된 딥 레드 (반려)
  status-canceled: "#d4d4d8"        # 연회색 (취소) — 레이블에 line-through 병기해 draft와 구분

  # Functional accent (포커스 링, 링크 등 기능적 강조에만 최소 사용)
  accent: "#2563eb"                 # Blue 600
  error: "#b91c1c"                  # Red 700

typography:
  amount-lg:                        # 견적 최종 합계 (유일하게 큰 텍스트, 표시는 절제)
    fontFamily: Pretendard
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontVariantNumeric: tabular-nums
  page-title:
    fontFamily: Pretendard
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  numeric:                          # 표 안의 수량·단가·금액 전용 (정렬 안정성 핵심)
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    fontVariantNumeric: tabular-nums

rounded:
  none: 0px
  sm: 4px
  DEFAULT: 6px
  md: 8px

spacing:
  unit: 4px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  container-padding: 16px
  row-padding-y: 12px               # 행(리스트/표) 세로 패딩 — 밀도와 터치의 균형

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.DEFAULT}"
    height: 44px
    padding: "0px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:                 # 면이 아닌 테두리로 구분 (배경색 없음)
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    border: "1px solid {colors.border-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.DEFAULT}"
    height: 44px
    padding: "0px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunken}"
  button-ghost:                     # 행 내부 인라인 동작 (수정/삭제 등)
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    padding: "0px 8px"
    height: 36px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    border: "1px solid {colors.border}"
    focusBorder: "1px solid {colors.border-focus}"
    typography: "{typography.body}"
    rounded: "{rounded.DEFAULT}"
    height: 44px
    padding: "0px 12px"
  status-indicator:                 # 알약 뱃지 대체 — 6px 점 + 텍스트, 배경 없음
    layout: "dot(6px) + label(gap 6px)"
    typography: "{typography.label}"
    textColor: "{colors.text}"
    dotColor: "{colors.status-*}"   # draft/sent/accepted/rejected/canceled
    canceled: "레이블에 line-through 병기해 draft와 구분"
  list-row:                         # 견적/거래처/품목 목록의 기본 단위 (카드 아님)
    borderBottom: "1px solid {colors.border}"
    padding: "{spacing.row-padding-y} {spacing.container-padding}"
    minHeight: 56px
  line-item-row:                    # 견적 작성 품목 행 — 행별 뷰어/편집 모드
    borderBottom: "1px solid {colors.border}"
    viewerMode: "compact-text"      # 기본: 품명·규격 + (수량×단가) + 금액 + [수정][×] 한 줄
    editMode: "expanded-inputs"     # 수정 클릭 시만: 품명 한 줄 + (수량|단가|금액) 한 줄, surface-sunken 음영
    rationale: "항목이 늘어도 스크롤이 커지지 않도록 입력란은 편집 중인 행에만 노출"
  totals-bar:                       # 하단 합계 — 면이 아니라 상단 헤어라인으로 분리
    backgroundColor: "{colors.surface}"
    borderTop: "1px solid {colors.border-strong}"
    padding: "{spacing.sm} {spacing.container-padding}"
  dock-nav:                         # 하단 고정 탭 (상단 탭 대체)
    position: "fixed bottom, full-width"
    borderTop: "1px solid {colors.border}"
    items: "견적/거래처/품목/설정 — 모노크롬 라인 아이콘 + 레이블"
    activeColor: "{colors.text-strong}"
    inactiveColor: "{colors.text-faint}"
    hiddenOn: "폼·인쇄 화면 (자체 하단 액션바와 이중 고정 방지)"
    safeArea: "padding-bottom: env(safe-area-inset-bottom)"
---

## Overview

1인 사업자가 견적을 빠르게 작성·저장·출력하는 도구다. 디자인의 목표는 장식이 아니라 **밀도와 신뢰성**이다. 잉크 한 색(Zinc 900)을 텍스트와 액션의 기준으로 삼고, 면과 영역은 색이나 그림자가 아니라 **1px 헤어라인**으로 구분한다. 카드로 정보를 감싸 부풀리지 않고, 화면 한 번에 더 많은 행이 들어오도록 평평하고 촘촘하게 배치한다. 색은 의미가 있을 때(상태, 오류, 포커스)에만 최소로 등장한다.

## Colors

색은 정보의 위계를 만드는 도구이지 분위기를 내는 장식이 아니다.

- **Ink (`#18181b`):** 주요 버튼, 제목, 금액 등 가장 중요한 요소의 기준색. 흰 바탕 대비율 16:1 이상으로 WCAG AAA를 만족한다.
- **Text scale:** 본문(`#3f3f46`) → 메타(`#71717a`) → 비활성(`#a1a1aa`)으로 **단일 잉크의 농도만** 낮춰 위계를 만든다. 보조 텍스트에 별도 색상(슬레이트·에메랄드 등)을 쓰지 않는다.
- **Border (`#e4e4e7`):** 이 시스템의 주역. 구분선·테두리·표 격자가 모두 이 헤어라인에서 나온다.
- **Status:** 작성 중·발송·승인·반려는 6px 점의 색으로만 표시하고 텍스트 레이블을 항상 병기한다. 색 배경 알약을 쓰지 않는다.
- **Accent (`#2563eb`):** 포커스 링과 링크 등 기능적 강조에만 쓴다. 금액·합계는 색이 아니라 **굵기와 크기**로 강조한다.

## Typography

한글 정렬이 정밀한 **Pretendard**를 사용한다. 큰 글자를 남발하지 않고 위계를 좁게 가져가 화면 밀도를 높인다.

- `amount-lg`(26px)는 상세 화면의 **최종 합계 금액 한 곳**에만 쓰는 유일한 큰 텍스트다.
- `page-title`(20px) → `section-title`(16px) → `body`(15px)의 좁은 3단 위계로 페이지를 구성한다.
- `numeric`는 표 안의 수량·단가·금액 전용으로, `font-variant-numeric: tabular-nums`를 강제해 자릿수가 달라도 세로 정렬이 흔들리지 않게 한다.

## Layout

면을 쌓지 않고 행을 쌓는다. 모바일에서도 정보를 카드로 감싸지 않고, 헤어라인으로 구분된 행으로 나열해 한 화면에 더 많은 데이터를 보여준다.

- **단일 흰 배경:** 배경과 카드의 색 대비로 영역을 나누지 않는다. 모든 구분은 `border`가 담당한다.
- **List Row (최소 높이 56px):** 견적·거래처·품목 목록의 기본 단위. 좌측에 핵심 정보, 우측에 금액/상태를 두고 사이는 늘어나는 여백(`flex`)으로 채운다.
- **하단 독바(DockNav):** 전역 내비게이션은 상단 탭이 아니라 **하단 고정 독바**(견적/거래처/품목/설정)로 둔다. 모노크롬 라인 아이콘 + 레이블, 활성은 잉크·비활성은 faint, 상단 헤어라인으로 본문과 분리한다. 단, **자체 하단 액션바를 가진 폼·인쇄 화면에서는 독바를 숨겨** 이중 고정 바를 방지한다.
- **Sticky 하단 영역(폼 화면):**
  - **TotalsBar:** 작성 중 합계를 항상 보이도록 하단에 고정한다. 면 분리가 아니라 상단 헤어라인 한 줄로 본문과 나눈다.
  - **ActionBar:** 저장·출력 액션을 하단 최외곽에 고정한다. TotalsBar와 합쳐 2단 고정 영역을 이루되, 본문 스크롤 영역의 높이를 침범하지 않도록 고정 영역 높이만큼 본문 하단 패딩을 확보한다. 폼 화면에서는 이 액션바가 독바를 대체한다.
- **스크롤 최소화:** 한 화면에서 끝낼 수 있는 폼은 세로로 길게 늘이지 않는다. 읽기 전용 정보 행은 라벨을 좌측 정렬하고 관련 항목을 한 행에 묶어 높이를 줄인다. 단, 라벨이 긴 한글(사업자등록번호·공급받는자 상호 등)이면 좌측 라벨이 입력 폭을 침범하지 않도록 라벨 열 너비를 고정하고 나머지를 입력에 할당한다.
- **카드 없음 ≠ 세로 쌓기 없음:** 카드 최소화는 정보를 박스로 감싸 부풀리지 말라는 뜻이지, 모든 것을 한 행에 욱여넣으라는 뜻이 아니다. 특히 **편집 가능한 다중 필드(견적 품목 입력: 품명·규격·수량·단가·금액)는 좁은 모바일에서 세로로 쌓는다.** 입력 중인 텍스트는 ellipsis로 줄일 수 없으므로, 5개 입력을 한 행에 평평하게 두면 가로 스크롤이나 줄바꿈으로 레이아웃이 깨진다. 박스·그림자·패딩 패널 없이 헤어라인으로만 항목을 구분하면 카드 최소화와 무파손을 동시에 만족한다.
- **제약 충돌 시 우선순위:** "스크롤 최소화(밀도)"와 "줄바꿈/레이아웃 무파손"이 부딪히면 **무파손이 항상 우선한다.** 밀도를 위해 한 행에 묶다가 깨질 위험이 있으면 세로로 쌓는다.

## Lines, not Boxes

깊이 표현은 그림자와 카드 대신 헤어라인으로 한다.

- 영역 구분: `1px solid {colors.border}`.
- 강조 경계(입력 포커스, 표 외곽): `border-strong` 또는 `border-focus`.
- 그림자는 쓰지 않는다. 굳이 떠 있는 깊이가 필요한 하단 고정 바조차도 그림자 대신 `border-top`으로 분리한다.

## Shapes

라운딩을 최소화해 절제된 인상을 준다.

- **DEFAULT (`6px`):** 버튼·입력 필드의 기본값. 손끝에 닿되 둥글지 않다.
- **md (`8px`):** 모달·팝오버 등 큰 면에만.
- 알약(`9999px`) 라운딩은 쓰지 않는다. 상태 표시는 점과 텍스트이지 알약이 아니다.

## Components

- **button (primary/secondary/ghost/danger):** 높이 44px로 터치 최소 규격을 지킨다. primary는 잉크 면, secondary·danger는 배경색 대신 테두리로 구분(danger는 글자만 위험색), ghost는 행 내 인라인 동작(수정·삭제)으로 배경·테두리 없이 텍스트만 쓴다.
- **input-field:** 헤어라인 테두리, 포커스 시 잉크 테두리로 상태를 알린다. 채워진 색 배경을 쓰지 않는다. 표 안 무테 변형(`inp-cell`)은 격자만으로 구분한다.
- **status-indicator:** 6px 점 + 텍스트 레이블. 색 배경 알약을 대체하며, 점 색은 상태별 `status-*`를 따른다. `canceled`는 draft와 구분되도록 레이블에 line-through를 병기한다.
- **dock-nav:** 하단 고정 탭. 모노크롬 라인 아이콘 + 레이블(이모지 아님), 활성=잉크/비활성=faint, 상단 헤어라인. 폼·인쇄 화면에서는 숨긴다.
- **list-row:** 견적·거래처·품목 **목록(읽기 전용)**의 기본 단위. 좌측 텍스트 + 우측 금액/상태를 한 행에 두고 헤어라인으로 구분한다. 카드로 감싸지 않는다.
- **line-item-row (뷰어/편집 모드):** 견적 작성 화면의 품목 행. **기본은 컴팩트 텍스트 뷰**(품명·규격, `수량×단가`, 금액, [수정][×]) — 항목이 많아도 한 줄씩이라 스크롤이 폭증하지 않는다. **[수정]을 누른 행만** 입력란으로 펼쳐지고(`surface-sunken` 음영으로 편집 중 표시: 품명 한 줄 + 수량·단가·금액 한 줄), [완료]로 다시 접힌다. 새 행·빈 행은 편집 모드로 시작하고, 빈 채로 완료하면 제거된다. 합계는 접힘 여부와 무관하게 전 행을 실시간 합산한다.

## Do's and Don'ts

### Do's

- **Do:** 수량·단가·금액 등 숫자가 들어가는 모든 칼럼에 `font-variant-numeric: tabular-nums`와 우측 정렬을 적용해, 자릿수가 달라져도 세로 정렬이 절대 흔들리지 않게 한다.
- **Do:** 가변 길이 텍스트(거래처명·품목명)를 담는 셀은 `min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`로 처리해, 긴 텍스트가 레이아웃을 밀어내거나 줄바꿈으로 행 높이를 깨뜨리지 않게 한다.
- **Do:** 한 행에 가변 텍스트(좌)와 고정폭 숫자/상태(우)를 함께 둘 때, 숫자 영역은 `flex-shrink: 0`으로 고정하고 텍스트 영역만 `flex: 1; min-width: 0`으로 줄어들게 한다.
- **Do:** 금액/수량 입력창에 `inputmode="decimal"` 또는 `inputmode="numeric"`을 넣어 모바일 숫자 키패드를 띄운다.
- **Do:** 인쇄 화면(`/quotes/[id]/print`)은 다중 페이지 대응으로 `thead`에 `display: table-header-group`, `tr`에 `break-inside: avoid`를 선언한다.
- **Do:** 인쇄 시트는 A4 비율(210:297)을 기준으로 **헤더(상단)·본문(`flex:1`)·푸터(하단 고정)** 3영역으로 구성해 종이를 채운다. 화면 미리보기에서는 시트를 794px(A4@96dpi)로 두고 프레임 폭에 맞춰 `transform: scale()`로 통째로 축소해 **모바일 가로 스크롤을 없앤다**(인쇄 시 스케일 해제, `@page { size: A4 }`로 실제 A4 출력).
- **Do:** 로고·직인 등 비공개 storage 이미지는 Base64 dataURL 또는 signed URL로 변환해 브라우저와 PDF 엔진이 동일하게 렌더링하도록 한다.

### Don'ts

- **Don't:** 통계 카드, 박스형 위젯, 카드 그리드로 정보를 부풀리지 않는다. 정보는 헤어라인으로 구분된 행과 표로 평평하게 나열한다.
- **Don't:** 색 배경 알약 뱃지를 쓰지 않는다. 상태는 점 + 텍스트로 표시한다.
- **Don't:** 금액·합계를 색(에메랄드 등)으로 강조하지 않는다. 강조는 굵기·크기·위치로 한다.
- **Don't:** 이모지를 UI에 쓰지 않는다. 의미 전달은 텍스트 레이블로 한다.
- **Don't:** 화면 너비를 벗어나는 고정 너비(예: `width: 600px`)를 쓰지 않는다. 모든 표·행은 유연하게 줄어들되, 줄바꿈으로 행 높이가 들쭉날쭉해지지 않도록 위의 truncation·고정폭 규칙을 함께 적용한다.
- **Don't:** 불필요하게 세로로 긴 폼으로 스크롤을 유발하지 않는다. 라벨은 입력 위가 아니라 좌측에 두고, 관련 입력은 한 행에 묶어 화면 밀도를 높인다.
- **Don't:** 그림자와 그라데이션으로 깊이를 만들지 않는다. 구분은 헤어라인으로 충분하다.
- **Don't:** 상태·액션을 색만으로 구별하지 않는다. 텍스트 레이블을 항상 병기해 접근성을 지킨다.

## 구현 현황 (Implementation, 2026-06-03)

이 디자인 시스템은 코드로 구현되어 검증됐다. 스펙과 구현이 어긋난 부분은 아래로 일치시켰다.

**토큰의 출처:** 위 frontmatter의 색·타이포·라운드·간격은 [`src/app.css`](src/app.css)의 Tailwind v4 `@theme` 블록으로 코드화되어 유틸리티(`bg-ink`, `text-muted`, `border-line`, `rounded` 등)로 생성된다. 본문 폰트 Pretendard는 CDN의 dynamic-subset로 로드한다. 입력 공통 클래스(`.inp`, `.inp-cell`, `.inp-num`)와 숫자 정렬(`.num`)·truncation(`.truncate-cell`) 유틸도 같은 파일에 있다.

**구현된 컴포넌트:** `AppShell`(상단 슬림 헤더 + 하단 독바), `Button`(primary/secondary/ghost/danger), `Field`(좌측 라벨 행), `StatusDot`, `QuoteEditor`(뷰어/편집 모드 라인 + TotalsBar + ActionBar). 화면: 견적 목록/작성/수정/상세/인쇄, 거래처, 품목, 설정, 로그인.

**초기 스펙에서 진화한 결정 (구현이 기준):**

- **내비게이션:** 상단 탭 → **하단 독바**(DockNav). 모바일 우선 도구에 맞고, 폼·인쇄 화면에서는 숨겨 이중 고정 바를 방지한다.
- **품목 라인:** "모바일 세로 스택" → **행별 뷰어/편집 모드**. 입력란을 상시 펼치면 항목이 늘수록 스크롤이 폭증하므로, 기본은 컴팩트 텍스트 행이고 [수정]한 행만 펼친다. 편집 시 수량·단가·금액은 (세로 스택이 아니라) 한 줄 다열로 묶는다 — "무파손" 제약은 입력 5개를 평평하게 펴지 않는 한 만족된다.
- **인쇄:** 단순 폭 축소 → **A4 채움 구조**(헤더 상단·본문 신축·푸터 하단) + 화면 스케일-투-핏. 가로 스크롤 0과 A4 비율을 동시에 만족한다.

**데이터 백업 UI:** 설정 화면에 JSON 내보내기/가져오기 섹션을 두되, 통계 카드가 아니라 헤어라인 섹션 + secondary 버튼으로 표시한다(무카드 원칙 유지).
