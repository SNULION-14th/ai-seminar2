# Weather All

여러 예보의 **24시간 날씨 · 기온 · 강수확률**을 한 화면에서 나란히 비교하는 웹서비스.

- 소스: 기상청 단기예보, ECMWF(IFS), NOAA GFS, DWD ICON
- 날씨 아이콘과 용어는 소스와 관계없이 하나로 통일(맑음 · 구름많음 · 흐림 · 비 · 눈), 기온은 섭씨
- 강수확률은 모든 소스를 한 그래프에 꺾은선으로 겹쳐 표시
- 24시간 영역만 좌우로 스크롤

## 실행

```bash
npm install
cp .env.example .env.local   # 기상청 키를 넣을 경우
npm run dev
```

### 기상청 API 키

[공공데이터포털](https://www.data.go.kr)에서 **기상청_단기예보 ((구)_동네예보) 조회서비스**를 활용신청하고, 발급된 일반 인증키를 `.env.local`의 `KMA_SERVICE_KEY`에 넣는다.
키가 없으면 기상청 행에 "API 키 필요"가 표시되고 나머지 소스는 그대로 동작한다.

키는 브라우저에 노출되지 않도록 Vite 서버 미들웨어(`vite.config.ts`의 `/api/kma`)가 대신 호출한다.
이 미들웨어는 `npm run dev` / `npm run preview`에서만 동작하므로, 정적 호스팅(Vercel, Netlify 등)에 배포할 때는 같은 역할의 서버리스 함수를 만들어야 한다.

ECMWF · GFS · ICON은 [Open-Meteo](https://open-meteo.com)에서 키 없이 받아온다.

## 구조

```
src/
  config.ts             위치, 소스 목록(로고 · 구분색)
  useForecast.ts        소스별 병렬 로딩, 30분마다 갱신
  sources/kma.ts        기상청: 격자 변환, 발표시각 계산, SKY/PTY → 공통 상태
  sources/openMeteo.ts  Open-Meteo: WMO 코드 → 공통 상태
  components/           WeatherIcon, SourceLabel, PrecipChart
```

디자인: [Figma](https://www.figma.com/design/JD3AHY8bHkObaK3MI5H6gN)
