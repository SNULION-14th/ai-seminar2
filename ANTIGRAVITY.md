# 🧭 ANTIGRAVITY Router & Master Index

## ⚡ Core Rules (핵심 원칙)
1. **Identity & Excellence:** You are the best developer in the world.
2. **Language:** Think in English, but always answer in Korean.
3. **Router Pattern:** This file serves as the top-level index and router. Keep this file lean and concise. Detailed product requirements, conventions, and architectural rules reside in subordinate documents under `docs/`. Before planning, modifying, or writing code, inspect the corresponding document.

---

## 🗺️ Documentation Router (문서 색인 및 라우팅)

작업 컨텍스트에 따라 아래 하위 문서를 순서대로 참조하여 개발을 진행합니다:

| 작업 영역 (Context) | 참조 문서 (Document) | 주요 포함 내용 |
| :--- | :--- | :--- |
| **제품 기획 & 요구사항** | [`docs/planning/todo_prd.md`](docs/planning/todo_prd.md) | • UX 철학 및 4대 차별화 포인트 (Rule of 3, Guilt-free Sunset 등)<br/>• 핵심 기능 명세 및 사용자 흐름<br/>• 화면 구성 및 와이어프레임<br/>• 데이터 구조 (Todo, SunsetLog, UserSettings)<br/>• 구현 우선순위 (P0 MVP ~ P2 Delight) |
| **개발 규칙 & 컨벤션** | [`docs/rules/frontend_conventions.md`](docs/rules/frontend_conventions.md) | • React 19 + TypeScript 코딩 표준<br/>• 프로젝트 디렉토리 구조 가이드<br/>• 명명 규칙 및 컴포넌트 설계 원칙<br/>• 0ms 반응성 및 접근성(A11y) UX 구현 규칙 |
| **시스템 아키텍처 & 구조** | [`docs/rules/project_architecture.md`](docs/rules/project_architecture.md) | • 4계층 계층화 클린 아키텍처 (UI - Hook - Domain - Infra)<br/>• 저장소 추상화 (Repository 패턴)<br/>• 단방향 데이터 흐름 및 낙관적 UI 업데이트<br/>• 장애 복구성 및 LocalStorage 에러 폴백 전략 |

---

## 📋 Agent Action Guidelines (에이전트 행동 지침)
- **문서 확인 우선:** 새로운 작업 요청이 오면 먼저 위의 라우팅 테이블에서 관련 하위 문서를 확인하고 읽습니다.
- **아키텍처 준수:** UI 컴포넌트가 직접 LocalStorage I/O를 다루지 않도록 Repository 및 Custom Hook 패턴을 유지합니다.
- **문서 동기화:** 기능이나 아키텍처 상의 변경이 발생할 경우, 해당 하위 규칙 문서를 최신 상태로 함께 갱신합니다.
