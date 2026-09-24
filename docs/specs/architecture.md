# 아키텍처 & 기술 스택

> Status: **Approved** (2026-09-24) · 마일스톤: M0

## 1. 원칙

- **서버 없음**: 정적 SPA. 모든 사용자 데이터는 기기 로컬에 저장한다. 배포는 정적 호스팅(Vercel/Netlify/GitHub Pages)으로 충분하다.
- **도메인 로직은 순수 함수로**: `src/domain/`은 React와 브라우저 API에 의존하지 않는다. 그래서 단위 테스트가 가능하다.
- **의존성 최소화**: 새 라이브러리는 아래 표에 있는 것만 쓴다. 추가가 필요하면 이 문서부터 갱신한다.
- **한국어 전용**: `index.html`은 `<html lang="ko">`, 문서 제목은 "강따라 633"으로 한다. 날짜·숫자 포맷은 `Intl`의 `ko-KR` 로케일을 쓴다. i18n 라이브러리는 쓰지 않고 문구를 컴포넌트에 직접 한국어로 쓴다.

## 2. 기술 스택

| 영역 | 선택 | 상태 |
| --- | --- | --- |
| 프레임워크 | React 19 + TypeScript + Vite 8 | 설치됨 |
| 아이콘 | lucide-react | 설치됨 |
| 라우팅 | `react-router` v7 (hash router: 정적 호스팅과 공유 해시 호환) | 추가 예정 |
| 상태 관리 | `zustand` + `persist` 미들웨어(localStorage) | 추가 예정 |
| 지도 | `leaflet` + `react-leaflet` + OSM 타일 (확정) | 추가 예정 |
| 공유 | `lz-string`(URL 압축), `html-to-image`(카드 PNG) | 추가 예정 |
| 스키마 검증 | `zod` (공유 payload, 백업 import) | 추가 예정 |
| 테스트 | `vitest` (도메인 로직 단위 테스트) + Playwright MCP (UI 검증, [mcp.md](mcp.md)) | 추가 예정 |
| 스타일 | 순수 CSS + CSS Modules + `tokens.css` | 기본 제공 |

## 3. 디렉터리 구조

```text
src/
├── main.tsx / App.tsx        # 라우터 루트
├── styles/
│   ├── tokens.css            # 디자인 토큰 (design-system.md §2)
│   └── global.css
├── data/                     # 정적 도메인 데이터
│   ├── sections.ts
│   ├── centers.ts
│   └── route.ts              # 단순화된 경로 polyline + 고도
├── domain/                   # 순수 함수 (React 비의존)
│   ├── types.ts              # domain-data.md §4 타입 (계약)
│   ├── geo.ts                # haversine, snapToRoute, nextCenter
│   ├── tracking.ts           # GPS 점 필터링·샘플링 (TRK-02)
│   ├── itinerary.ts          # splitItinerary
│   ├── progress.ts
│   ├── share-codec.ts        # encode/decode 공유 payload
│   └── *.test.ts
├── store/                    # zustand stores (plan, ride, stamps)
├── features/
│   ├── home/                 # 강줄기 인트로 (DS-01)
│   ├── plan/
│   ├── track/
│   │   └── simulator.ts      # TRK-10
│   └── share/
└── components/               # RidgeProfile, Stamp, WaveProgress, RiverLine ...
```

폴더별 담당 에이전트(누가 어떤 파일을 고칠 수 있는지)는 [agent-team.md](agent-team.md) §3을 따른다.

## 4. 라우트

| 경로 | 화면 |
| --- | --- |
| `#/` | 홈 (강줄기 인트로 + 현재 상태 요약) |
| `#/plan` | 계획 |
| `#/track` | 트래킹 |
| `#/journal` | 기록 (도장판, 일지) |
| `#/s/:payload` | 읽기 전용 공유 페이지 |

하단 탭 바: 홈 / 계획 / 트래킹 / 기록. 공유 페이지에서는 탭 바를 숨긴다.

## 5. 저장소

| 키 | 내용 | 저장 위치 |
| --- | --- | --- |
| `gt.plan` | 활성 TripPlan | localStorage (zustand persist) |
| `gt.rides` | Ride[] | localStorage. 궤적이 커지면 IndexedDB로 옮긴다(5MB 한도 고려) |
| `gt.stamps` | Stamp[] | localStorage |
| `gt.activeRide` | 진행 중 라이드 상태 | localStorage (TRK-01 복구용) |

모든 저장 스키마에 `version` 필드를 두고, 스키마가 바뀌면 persist `migrate`로 처리한다.

## 6. 수용 기준 (M0)

- [ ] `npm run dev`로 4개 탭 라우트가 빈 화면으로 이동된다
- [ ] `npm run test`(vitest)가 동작하고 [domain-data.md](domain-data.md) §6 테스트가 통과한다
- [ ] `npm run build`, `npm run lint`가 통과한다
- [ ] 기존 Vite 템플릿 데모 코드(카운터, hero 이미지 등)가 제거되어 있다
- [ ] `index.html`이 `lang="ko"`이고 제목이 "강따라 633"이다
