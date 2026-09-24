# MCP 사용 가이드

| MCP | 패키지 | 용도 | 필요한 키 |
| --- | --- | --- | --- |
| OpenStreetMap | `@cyanheads/openstreetmap-mcp-server` | 도시별 추천 장소 검색·좌표 검증(`openstreetmap_search_places`), 주변 카페·식당 탐색(`openstreetmap_query_nearby`) → `src/data/cities.ts` 시드 생성 | 없음 |
| Open-Meteo Weather | `open-meteo-mcp-server` | 개발 중 도시별 예보·과거 날씨를 조회해 짐 규칙 임계값 검증, 앱의 `lib/weather.ts` 응답과 교차 확인 | 없음 |
| GitHub | `@modelcontextprotocol/server-github` | 커밋 · 원격 푸시 · main 대상 PR 생성 | `GITHUB_PERSONAL_ACCESS_TOKEN` |

## 원칙
- MCP는 **개발 도구**로 사용한다. 두 MCP 모두 API 키가 필요 없고, 런타임 앱은 Open-Meteo만 직접 호출한다.
- OSM MCP 결과를 시드에 넣을 때는 `// source: openstreetmap MCP` 주석을 남긴다.
- 장소는 도시당 5~6개, 카테고리는 `sight | food | cafe | night | market` 중 하나.
