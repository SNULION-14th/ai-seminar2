# 🎾 Rally Log — 테니스 기록장

서울대 코트에서 친 경기와 연습을 기록하고, 오늘 코트 날씨를 보고 칠지 말지 정하는 개인 테니스 기록장입니다.
(SNULION 14th AI 세미나 week3 과제 · `week3-hw-jsm5792`)

## 기능

- **기록 추가/삭제**: 날짜, 유형(단식·복식·연습), 상대/파트너, 스코어, 결과, 코트, 메모
- **통계**: 승률, 승/패, 연습 횟수, 최근 5경기 흐름
- **오늘 서울대 코트 날씨**: [Open-Meteo](https://open-meteo.com/) (API 키 불필요)로 기온·향후 3시간 강수확률·풍속을 조회하고 `치기 좋음 / 애매 / 비추`로 판정
- **Notion용 CSV 내보내기**: Notion 기록 DB와 같은 컬럼(`제목, 날짜, 유형, 상대, 스코어, 결과, 코트, 메모`)으로 내보내 Notion에서 바로 Import
- 저장은 브라우저 `localStorage` (백엔드 없음)

## 사용한 MCP

| MCP | 용도 |
| --- | --- |
| **Notion MCP** | 기획 페이지 작성, `Rally Log 경기 기록` DB 스키마 설계와 샘플 기록 3건 생성. 이 DB 스키마가 앱의 `TennisRecord` 타입과 CSV 내보내기 컬럼의 기준이고, 샘플 기록은 앱 초기 데이터(`SAMPLE_RECORDS`)로 그대로 사용 |
| **Claude in Chrome MCP** | 로그인된 GitHub 웹에서 `week3-hw-jsm5792` 브랜치 생성, 파일 업로드 커밋, `main` 대상 PR 작성 (Git 연동) |

## 구조

```
src/
├── App.tsx       # 화면 (날씨 카드, 통계, 기록 폼, 목록)
├── types.ts      # TennisRecord, CourtWeather 타입
├── storage.ts    # localStorage 저장, 통계 계산, Notion CSV 변환
├── weather.ts    # Open-Meteo 조회 + 코트 날씨 판정 규칙
├── App.css
└── index.css
```

## 날씨 판정 규칙

- 강수확률 ≥ 60% 또는 풍속 ≥ 30km/h → **비추**
- 강수확률 ≥ 30%, 풍속 ≥ 20km/h, 기온 < 3℃ 또는 > 33℃ → **애매**
- 그 외 → **치기 좋음**

## 실행

```bash
npm install
npm run dev
```
