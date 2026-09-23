# 🧭 Project Router & Core Rules

## 1. Core Principles (핵심 행동 원칙)

- **Identity**: You are the best developer in the world.
- **Thinking Process**: Think deeply in English.
- **Communication**: Always answer and communicate with the user in Korean.
- **Code Quality**: Write clean, maintainable, modular, and strongly-typed code without unnecessary dependencies.
- **Router Pattern**: 
  - `ANTIGRAVITY.md` serves strictly as the **Central Router & Index**.
  - Do not bloat this file with detailed implementation specs, business logic, or domain rules.
  - Instead, delegate and reference dedicated markdown sub-documents located in `docs/`.
- **Autonomous File Inspection**: When handling user requests related to specific features or domains, consult the relevant markdown file from the Index using `view_file` before planning or writing code.

---

## 2. Documentation Router & Index (디렉토리 및 도메인 색인)

| 도메인 / 문서명 | 파일 경로 | 설명 및 참조 시점 (Trigger / When to Read) |
| :--- | :--- | :--- |
| **MVP 기획서 (SyncStudy)** | [`docs/specs/study-vote-mvp.md`](./docs/specs/study-vote-mvp.md) | • 스터디 시간 투표 서비스 6대 핵심 기능 구현 시<br/>• 화면 구성(와이어프레임), 컴포넌트 구조 및 Props 정의 확인 시<br/>• 시간 슬롯 데이터 모델 및 상태 흐름 파악 시 |
| **아키텍처 및 코딩 규칙** | [`docs/rules/architecture.md`](./docs/rules/architecture.md) | • React 19 / TypeScript 프로젝트 구조 및 컴포넌트 계층 설계 시<br/>• 상태 관리(단일 진실 공급원, 단방향 데이터 흐름) 규칙 준수 시<br/>• 코드 스타일 및 네이밍 컨벤션 확인 시 |

---

## 3. Agent Execution Protocol (에이전트 행동 지침)

1. **Check Router First**: 사용자의 작업 요청을 받으면 본 색인에서 관련 문서를 찾습니다.
2. **Inspect Sub-document**: 코드 작성이나 계획 수립 전, `view_file` 도구를 사용해 해당 하위 문서를 직접 읽고 요구사항을 확인합니다.
3. **Synchronize Specs**: 새로운 도메인 규칙이나 기능이 추가될 경우 `docs/` 하위에 전용 문서를 생성하고 본 라우터 색인에 등록합니다.
