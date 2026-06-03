# CI·보안·배포 가이드 (GitHub Actions 최소화)

처음 쓰는 SvelteKit·Cloudflare라도 따라 할 수 있도록 정리했다.
Rails의 **Kamal 수동 배포 + 로컬 CI** 방식과 똑같은 철학이다: **검증은 내 기기에서, 배포는 내가 직접.**

---

## 0. 먼저 풀어야 할 오해 3가지

1. **호스팅 ≠ 백엔드.** Cloudflare Pages = 앱 파일을 올리는 곳(호스팅). Supabase = 데이터 서버(백엔드). 지금은 백엔드 없이 호스팅만 한다(데이터는 휴대폰 로컬에 저장).
2. **GitHub에 올리는 것 ≠ GitHub Actions 사용.** Actions(자동 CI)는 *비공개* 저장소에서만 무료 분을 소모한다(공개 저장소는 무제한 무료). 우리는 Actions를 **안 쓴다.**
3. **Cloudflare Pages의 빌드는 GitHub Actions가 아니다.** GitHub 연동 자동배포를 켜도 빌드는 **Cloudflare 인프라**(월 500회 무료)에서 돌고 Actions 분을 쓰지 않는다.

→ 결론: GitHub은 **코드 보관소**로만 쓰고, 검증은 로컬에서, 배포는 Wrangler로 수동. Actions 의존 0.

---

## 1. 로컬 검증 명령 (이게 우리의 CI)

| 명령 | 하는 일 | 언제 |
|------|---------|------|
| `npm run check` | 타입·Svelte 오류 검사(svelte-check) | 수시 |
| `npm run test:unit` | 단위 테스트(Vitest) — 계산·파싱·채번 등 | 수시 |
| `npm run test:e2e` | 브라우저 E2E(Playwright) — 작성→저장→인쇄→Excel 플로우 | 기능 변경 시 |
| `npm run ci` | check + unit + e2e + build (전체 CI) | push/배포 전 |
| `npm run ci:fast` | check + unit (빠른 게이트) | push 훅이 자동 실행 |
| `npm run security` | 보안 스캔(의존성 + 비밀키) | 배포 전 |
| `npm run verify` | **ci + security = 배포 직전 최종 게이트** | 배포 전 항상 |
| `npm run deploy` | verify 통과 시 Cloudflare로 배포 | 배포할 때 |

**핵심 루틴(Kamal식):**
```bash
# 코드 수정 후
npm run verify      # 전부 통과해야 함 (테스트+빌드+보안)
npm run deploy      # 통과하면 수동 배포
```

### Git push 훅 (자동 로컬 게이트)
`git push` 직전에 `ci:fast`가 자동으로 돈다(`.githooks/pre-push`). 실패하면 push가 막힌다.
- 활성화(클론 후 1회): `npm run hooks:install` (또는 `npm install`이 자동 설정)
- 긴급 우회: `git push --no-verify`

---

## 2. 보안 스캔 (Rails의 brakeman/bundler-audit 대응)

| 도구 | 역할 | Rails 비유 | 설치 |
|------|------|-----------|------|
| `npm audit` | 의존성 취약점(CVE) | bundler-audit | 내장 |
| `gitleaks` | 커밋에 섞인 비밀키·토큰 탐지 | (gitleaks 동일) | `brew install gitleaks` |

- `npm run audit` = **운영 의존성만, high 이상이면 실패**. (dev 전용 패키지는 사용자에게 배포되지 않으니 제외)
- `npm run scan:secrets` = `gitleaks`로 전체 git 이력 스캔. 설정은 `.gitleaks.toml`.
- 정적 SPA라 서버 공격면이 없고, Svelte가 출력값을 자동 이스케이프(XSS 방지)하므로 위 둘이 핵심이다.

### 알려진·수용된 취약점
- **uuid (moderate, exceljs 의존)**: `uuid v3/v5/v6`에 `buf` 인자를 줄 때만 발생하는데 exceljs는 그렇게 쓰지 않아 **실제 노출 없음**. 고치려면 exceljs를 깨는 다운그레이드가 필요하므로 **수용**한다. 그래서 audit 기준을 `high`로 둬 이 moderate는 차단하지 않되 매번 출력되어 보인다. exceljs 상위 버전이 나오면 `npm update exceljs`로 해소.

> SAST를 더 강화하고 싶으면(선택) `brew install semgrep` 후 `semgrep --config auto` — Rails의 brakeman에 더 가깝다. 지금 규모엔 과해서 기본 구성엔 넣지 않았다.

---

## 3. Cloudflare 계정 + 배포 (수동, Wrangler)

### 3-1. 계정 만들기
1. https://dash.cloudflare.com/sign-up 에서 무료 가입(카드 불필요).
2. 이메일 인증.

### 3-2. Wrangler로 배포 (GitHub 없이도 가능)
Wrangler = Cloudflare 공식 CLI(= Kamal 같은 배포 도구).
```bash
npm i -D wrangler                 # 프로젝트에 설치
npx wrangler login                # 브라우저로 Cloudflare 로그인 (최초 1회)
npm run verify                    # 로컬 검증 (필수)
npm run deploy                    # = verify 후 build/를 Cloudflare Pages로 업로드
```
- 첫 배포 때 프로젝트가 자동 생성된다(이름 `estimate`, `package.json`의 deploy 스크립트).
- 끝나면 `https://estimate-xxxx.pages.dev` 주소가 출력된다.

### 3-3. 휴대폰에 설치 (PWA)
1. 휴대폰 브라우저(아이폰=사파리, 안드로이드=크롬)로 그 주소를 연다.
2. 공유/메뉴 → **홈 화면에 추가**.
3. 홈 아이콘으로 실행 → 전체화면 앱처럼 뜨고, **비행기 모드에서도 작동**(오프라인).

---

## 4. (선택) GitHub은 백업용으로만

코드 이력 보관이 목적이면 GitHub에 올려도 Actions는 안 쓴다.
```bash
# GitHub에서 빈 비공개 저장소 생성 후
git remote add origin git@github.com:<사용자>/estimate.git
git push -u origin main          # pre-push 훅이 ci:fast 자동 실행
```
- 자동배포까지 원하면: Cloudflare 대시보드 → Workers & Pages → Pages → **Connect to Git** →
  Build command `npm run build`, Output directory `build`. (이 빌드는 Cloudflare에서 돌아 Actions 분 소모 0.)
- 자동배포가 부담되면 그냥 `npm run deploy`(수동)만 쓰면 된다.

---

## 5. 데이터 주의 (백엔드 없는 동안)
- 데이터는 **그 기기 브라우저에만** 있다. 설정 화면에서 **주기적으로 JSON 내보내기**로 백업.
- 다른 기기로 옮기려면 내보낸 파일을 그 기기에서 **가져오기**.
- 기기 간 실시간 동기화가 꼭 필요해지면 그때 Supabase를 붙인다(PLAN.md §0.1·Phase 6).
