# 아키텍처 & 프로젝트 규칙

## 스택
Vite + React 19 + TypeScript. 외부 상태 라이브러리/CSS 프레임워크 추가 금지 (lucide-react 아이콘만 사용).

## 디렉토리
```
src/
  types.ts            # 공용 타입
  data/cities.ts      # 도시 + 추천 장소 시드 (OpenStreetMap MCP로 생성·검증)
  lib/weather.ts      # Open-Meteo 호출 (forecast / archive 분기)
  lib/weatherCode.ts  # WMO 코드 → 라벨/아이콘
  lib/packing.ts      # 날씨 → 짐 목록 규칙 (순수 함수)
  lib/storage.ts      # localStorage 래퍼 (try/catch 필수)
  components/         # 화면 단위 컴포넌트, 1파일 1컴포넌트
  App.tsx             # 상태 소유 + 조합만
```

## 규칙
- 상태는 `App.tsx`가 소유하고 props로 내려준다. 컴포넌트는 가능한 한 표시 전용.
- 네트워크 호출은 `lib/`에만 둔다. 컴포넌트에서 `fetch` 직접 호출 금지.
- 날짜는 `YYYY-MM-DD` 문자열로 다룬다(타임존 버그 방지).
- 스타일은 `App.css`의 CSS 변수(`--accent` 등)를 사용, 인라인 스타일 최소화.
- 커밋 메시지: `feat:`, `fix:`, `docs:`, `chore:` 접두사.
