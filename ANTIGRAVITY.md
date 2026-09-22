# 카드뉴스 작업 라우터

이 프로젝트는 로컬 React/Vite 입력 앱과 Figma 개발 플러그인이다. 웹앱은 AI API를 호출하지 않는다. 사용 중인 에이전트가 브리프를 읽고 배치 JSON을 만든다.

## 항상 지킬 것

- 생성 요청은 `brief/latest.json`을 먼저 읽는다. 사용자 자료에 없는 사실·가격·성과를 추가하지 않는다.
- 결과는 현재 `briefId`·`templateHash`를 그대로 포함해 `brief/layout.json`에 저장한다. 장수·순서를 지키며 최신 브리프가 바뀌면 이전 결과를 덮어쓰지 않는다.
- 화면의 입력·레퍼런스가 저장된 결과와 달라도 조회·미리보기·복사를 허용하고 차이만 안내한다. 미리보기·검증·Figma 복사는 결과에 포함된 레퍼런스와 적용 방식을 사용한다.
- `validateLayout(deck, extractTokens(manifest), input.templateMode)`로 검사한다. 생성 결과를 통과시키기 위해 검사 기준을 임의로 낮추지 않는다.
- 미리보기는 사이트의 `LayoutPreview`를 사용한다. 별도 PNG 미리보기·내보내기를 임의로 추가하지 않는다. 최종 이미지가 필요하면 Figma에서 확인한 뒤 내보낸다.
- Figma 연동을 바꿀 때는 현재 연결된 MCP 도구의 읽기·쓰기 범위를 확인한다. MCP가 읽기 전용이거나 커스텀 플러그인이 필수라고 단정하지 않는다.
- 수작업 레퍼런스는 중복 이름과 작은 누락을 허용하고 `parseManifest`로 보완한다. 정상 명세와 재파싱 해시는 유지한다. 자세한 범위는 [구조 규칙](docs/architecture.md)을 따른다.
- Figma 원본은 읽기만 한다. 측정은 임시 복제본에서 하고, 실패한 생성은 이번 실행의 노드만 정리한다.
- `.env`, 토큰, `brief/`, `renders/`, 개인 MCP 설정은 커밋하지 않는다. 테스트에는 공개 가능한 예시만 사용한다.

## 필요한 문서만 읽기

| 작업 | 문서 |
| --- | --- |
| 설치·실행·Figma 가져오기 | [README.md](README.md) |
| 문구 생성·브랜드 우선순위·3가지 배치 방식 | [docs/input-manual.md](docs/input-manual.md) |
| 구조 변경·파일 계약·로컬 서버 | [docs/architecture.md](docs/architecture.md) |
| 동작 검증·공개 전 확인 | [docs/acceptance.md](docs/acceptance.md) |
| Figma 플러그인 수정 | [figma-plugin/README.md](figma-plugin/README.md) |

코드 변경 후 `npm run check`를 실행한다. 실제 Figma에서 확인하지 않은 동작은 실행 검증했다고 기록하지 않는다.
