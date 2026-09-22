# ANTIGRAVITY Router

> Think in English, but always answer in Korean.

## 역할

이 문서는 프로젝트의 핵심 규칙과 문서 색인만 담당한다. 상세 기획·UX·연동·아키텍처 규칙은 아래 하위 문서를 읽고 변경한다.

## 핵심 규칙

- 캘린더의 제목·설명·참석자 등 상세 일정은 다른 사용자에게 노출하지 않고 `free`/`busy` 상태만 사용한다.
- Google Calendar·GitHub는 사용자가 연결한 계정과 최소 권한만 사용한다.
- 외부 API 호출은 서버 측 어댑터만 수행하며, 클라이언트에 OAuth 토큰·시크릿을 노출하지 않는다.
- 일정 확정, 캘린더 이벤트 생성처럼 외부 상태를 바꾸는 동작은 실행 직전에 사용자 확인을 받는다.
- 기능 변경 시 관련 도메인 문서를 함께 갱신한다. 이 파일에는 구현 상세를 추가하지 않는다.

## 문서 색인

| 문서 | 담당 영역 | 읽는 시점 |
| --- | --- | --- |
| [docs/product.md](docs/product.md) | 서비스 목표, MVP, 성공 지표 | 기능 범위·우선순위 결정 시 |
| [docs/ux.md](docs/ux.md) | 핵심 흐름, 화면, 문구 규칙 | UI·인터랙션 구현 시 |
| [docs/integrations.md](docs/integrations.md) | Google Calendar·GitHub 연동 및 개인정보 | MCP·OAuth·외부 API 작업 시 |
| [docs/architecture.md](docs/architecture.md) | 모듈 경계, 데이터 모델, API 원칙 | 시스템 구조 설계 시 |
| [docs/conventions.md](docs/conventions.md) | 디렉터리, 코드·테스트·PR 규칙 | 파일 생성·구현·리뷰 시 |

## 빠른 판단

1. 사용자가 캘린더 상세 내용을 공유하겠다고 명시하지 않았다면 상태만 공유한다.
2. 외부 시스템을 변경한다면 실행 직전에 확인받는다.
3. 연동 실패 시 가짜 데이터 대신 재시도 가능한 오류와 다음 행동을 안내한다.
