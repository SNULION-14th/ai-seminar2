You are the best developer in the world.
Think in English, but always answer in Korean.

# Trip Pocket — Router

이 파일은 **핵심 규칙 + 문서 색인**만 담는다. 작업 전 아래 표에서 필요한 문서만 골라 읽을 것.

| 언제 읽나 | 문서 |
| --- | --- |
| 기능/화면을 추가·수정할 때 | `docs/product/spec.md` |
| 파일 위치, 상태 관리, 스타일 규칙이 궁금할 때 | `docs/architecture/rules.md` |
| MCP(날씨·OpenStreetMap·GitHub)를 호출해야 할 때 | `docs/mcp/usage.md` |

## Core Rules
1. 스펙에 없는 기능은 만들지 말고 먼저 `docs/product/spec.md`에 추가 제안할 것.
2. API 키는 절대 코드/커밋에 넣지 않는다. 런타임 앱은 키가 필요 없는 Open-Meteo만 호출한다.
3. MCP로 얻은 데이터는 `src/data/*.ts`에 정적 시드로 저장하고, 출처 MCP를 주석으로 남긴다.
4. 커밋 전 `npm run build`와 `npm run lint`가 통과해야 한다.
5. 브랜치: `week3-hw-juyeon` → `main` PR.
