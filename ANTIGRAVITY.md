# 🧭 ANTIGRAVITY Central Router & Rules

## 1. Core Principles (핵심 규칙)
- **Role**: You are the best developer and world-class software architect.
- **Language**: Think in English, but always answer in Korean.
- **Philosophy**: 
  - Keep this file (`ANTIGRAVITY.md`) lightweight as a **Central Router & Directory Index**.
  - Detailed domain rules, architecture guides, and product specifications must reside in dedicated Markdown files under `docs/`.
  - Always check and refer to the relevant indexed documents before planning, designing, or implementing features.

---

## 2. Documentation Router & Index (디렉토리 색인)

| 도메인 / 영역 | 대상 문서 경로 | 주요 내용 및 목적 | 탐색 및 로드 시점 |
| :--- | :--- | :--- | :--- |
| **제품 기획 & UX** | [`docs/planning/todo_proposal.md`](file:///C:/sh/2026/like_lion/seminar/fall/week3/ai-seminar2/docs/planning/todo_proposal.md) | FlowDo 서비스 비전, 핵심 기능 명세, 단일 뷰 와이어프레임, 차별화 포인트(Top 3, 감각적 보상), 개발 로드맵 | 신규 기능 개발, UI/UX 디자인 결정, 기획 검토 시 |
| **개발 & 코딩 표준** | [`docs/rules/project_rules.md`](file:///C:/sh/2026/like_lion/seminar/fall/week3/ai-seminar2/docs/rules/project_rules.md) | 디렉토리 구조(src 하위), 네이밍 컨벤션, TypeScript 및 React 컴포넌트 작성 원칙, Git 커밋 규칙 | 컴포넌트/훅 개발, 코드 리팩토링, 코드 리뷰 시 |
| **시스템 아키텍처** | [`docs/architecture/architecture_rules.md`](file:///C:/sh/2026/like_lion/seminar/fall/week3/ai-seminar2/docs/architecture/architecture_rules.md) | 4계층 아키텍처(UI-Application-Domain-Data), Todo 엔티티 모델, Local-First 스토리지 전략, 비즈니스 불변식, 렌더링 최적화 | 상태 설계, 데이터 모델 변경, 스토리지 연동 시 |

---

## 3. Agent Operating Protocol (에이전트 행동 지침)
1. **Context Routing**: 사용자 요청을 받으면 위 인덱스를 확인하여 관련 세부 문서를 먼저 `view_file`로 확인한 후 작업을 진행합니다.
2. **Modular Documentation**: 새로운 규칙이나 상세 사양이 발생하면 `ANTIGRAVITY.md`에 직접 누적하지 않고 `docs/` 하위에 목적별 문서를 신설한 뒤 본 라우터에 링크를 등록합니다.
3. **Link Integrity**: 모든 파일 및 심볼 참조 시 절대 경로 또는 작업 공간 기준의 유효한 마크다운 링크 형식을 준수합니다.
