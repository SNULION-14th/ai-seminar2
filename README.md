# NBA Game Night Log

## 서비스 소개

NBA 집관 팬이 오늘의 경기와 선수 정보를 확인하고, 사진·감상·평점이 담긴 집관 일기를 기록 및 아카이브하는 서비스입니다.

React 19, TypeScript, Vite와 브라우저 `localStorage`만으로 동작하는 과제 MVP입니다. 다크 네이비와 코트 오렌지 기반의 화면은 [Figma 디자인](https://www.figma.com/design/Q4YL3LB8dqZeHVV9pT0PIQ/homework_mcp2?node-id=1-2&m=dev)을 기준으로 구현했습니다.

## 주요 기능

- 홈
  - 샘플 NBA 경기 데이터로 오늘의 매치업, 경기 상태 및 스코어를 표시합니다.
  - 샘플 선수 데이터로 르브론 제임스, 스테픈 커리, 앤서니 데이비스 관전 포인트를 표시합니다.
  - 최근 저장한 관람 일기 최대 2건을 표시하고 아카이브·작성 화면으로 이동합니다.
- 집관 일기 작성
  - 경기 선택, 응원 팀, 상대 팀, 관람 방식(집관·직관·스포츠 펍·팝업), 장소, 직관 좌석을 입력합니다.
  - 평점(1~5), 감정, 감상, 최애 선수를 기록합니다.
  - 직접 촬영한 사진은 최대 3장, 티켓 이미지는 1장까지 브라우저 내 미리보기로 첨부합니다.
  - 이미지 파일 여부와 개별 1.5MB 용량을 검사하며, 티켓의 QR 코드·바코드·예매 번호 주의 문구를 표시합니다.
- 아카이브 및 상세
  - `localStorage`에 저장한 일기를 최신순으로 조회하고 월별로 필터링합니다.
  - 일기 상세에서 경기 정보, 관람 정보, 평점, 감상, 첨부 사진·티켓을 확인합니다.
  - 상세 화면에서 수정 및 삭제할 수 있습니다.
  - `UPCOMING`이 아닌 일기 수와 `WIN`/`LOSS` 기준 승률을 계산합니다.
- 상태 UI
  - NBA 데이터가 비어 있을 때의 로딩 문구, 데이터 오류 카드, 빈 아카이브 CTA를 구현했습니다.

## MCP 활용

| MCP | 활용 목적 | 서비스 내 적용 위치 | 실제 구현 상태 |
| --- | --- | --- | --- |
| NBA Stats MCP | 경기 일정, 팀, 경기 결과·스코어 데이터 조회 | 홈의 오늘의 경기, 일기 작성 시 경기 선택 | MCP의 `get_scoreboard` 호출은 개발 중 확인했지만, 브라우저 앱에는 직접 연결하지 않았습니다. 현재 [src/data/nba.ts](src/data/nba.ts)의 샘플 경기 데이터를 사용합니다. |
| NBA Player Stats MCP | 선수 커리어·시즌·고급 스탯 조회 | 선수 관전 포인트, 일기의 최애 선수 선택 | 현재 [src/data/nba.ts](src/data/nba.ts)의 샘플 선수 데이터만 표시합니다. 선수 커리어·고급 스탯 조회 및 선수 비교 화면은 구현하지 않았습니다. |
| Figma MCP | Figma 디자인을 React UI로 구현하는 기준 | 전체 화면 및 컴포넌트 디자인 반영 | `get_figma_data`로 디자인 구조·색상·텍스트를 분석했고, 이미지 에셋을 내려받아 [src/assets/figma](src/assets/figma)에 적용했습니다. |
| GitHub MCP | 브랜치 변경 사항 관리 및 PR 생성 | 과제 제출 PR | 이 저장소의 현재 구현에서는 GitHub MCP를 사용한 브랜치·커밋·PR 생성은 수행하지 않았습니다. |

## 아키텍처 및 데이터 처리

[CODEX.md](CODEX.md)와 연결된 기획·도메인·MCP·아키텍처 문서를 작업 기준으로 사용했습니다. 화면, 도메인 타입, 저장·통계, NBA 데이터 제공 책임을 분리했습니다.

```text
src/
├── data/nba.ts                 # 브라우저용 샘플 NBA 경기·선수 데이터
├── features/
│   ├── diary/DiaryForm.tsx     # 입력, 이미지 미리보기, 유효성 안내
│   └── archive/DiaryCard.tsx   # 일기 카드 표시
├── lib/
│   ├── storage.ts              # localStorage 읽기·쓰기
│   ├── statistics.ts           # 관람 횟수·승률 순수 계산
│   └── images.ts               # 이미지 형식·크기 검사 및 data URL 변환
├── services/nbaService.ts      # NBA 데이터 adapter 인터페이스와 mock adapter
├── types/
│   ├── diary.ts                # DiaryEntry 및 작성 타입
│   └── nba.ts                  # 경기·팀·선수 공통 타입
└── App.tsx                     # 화면 전환 및 최상위 일기 상태 조합
```

### NBA 데이터 adapter

브라우저는 MCP 도구를 직접 호출할 수 없으므로, UI는 [src/services/nbaService.ts](src/services/nbaService.ts)의 `NbaDataAdapter` 인터페이스만 바라봅니다. 현재 `mockNbaAdapter`가 샘플 데이터를 반환합니다. 이후 서버 API route가 NBA Stats MCP와 NBA Player Stats MCP를 호출한 뒤 `NbaGame`, `PlayerSpotlight` 타입으로 변환하도록 구현하고, 이 adapter만 교체하면 UI를 바꾸지 않고 실제 데이터로 전환할 수 있습니다.

### 일기 저장

[src/lib/storage.ts](src/lib/storage.ts)는 `nba-game-night-log:diaries` 단일 키에 `DiaryEntry[]`를 JSON으로 저장·복원합니다. 사진과 티켓은 외부 전송 없이 data URL로 변환되어 같은 브라우저에만 저장됩니다. 저장 공간 부족 시 기존 기록을 지우지 않고, 사진 수 또는 크기를 줄이라는 안내를 표시합니다.

## 실행 방법

Node.js와 npm이 설치된 환경에서 실행합니다.

```bash
npm install
npm run dev
```

개발 서버가 출력한 로컬 주소(일반적으로 `http://localhost:5173`)를 브라우저에서 엽니다.

정적 검사와 프로덕션 빌드는 다음 명령으로 실행합니다.

```bash
npm run lint
npm run build
npm run preview
```

## 확인 사항 및 제한

- `npm run lint`와 `npm run build`를 통과했습니다.
- 브라우저에서 텍스트만 포함한 일기 작성 → 저장 → 상세 조회 → 새로고침 후 복원 → 아카이브 조회 흐름을 확인했습니다.
- 사진·티켓 첨부 UI, data URL 미리보기, 파일 형식·1.5MB 제한은 구현되어 있으나, 실제 파일을 선택하는 브라우저 수동 검증은 이번 확인 범위에 포함하지 않았습니다.
- NBA Stats MCP의 `get_scoreboard`는 개발 환경에서 호출했으며, 확인 시점 날짜에는 경기 없음 응답을 받았습니다. 서비스 UI는 해당 MCP 결과를 사용하지 않고 샘플 데이터로 동작합니다.
- NBA Player Stats MCP는 앱 코드에서 아직 호출하지 않습니다. 선수 카드 및 선택 목록은 샘플 데이터입니다.
- 로그인, 서버 데이터베이스, 기기 간 동기화, 실시간 스코어 갱신, 선수 비교·상세 분석 기능은 MVP 범위에 포함하지 않았습니다.
- `localStorage`는 브라우저·기기마다 분리되며, 브라우저 저장소를 지우면 일기와 첨부 이미지도 삭제됩니다.

향후에는 백엔드/API route에서 NBA MCP 응답을 공통 타입으로 변환해 `NbaDataAdapter`에 연결하면 실제 경기·선수 데이터를 안전하게 제공할 수 있습니다.
