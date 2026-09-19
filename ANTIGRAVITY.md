# 🧭 ANTIGRAVITY Router & Master Index

## ⚡ Core Rules (핵심 원칙)

1. **You are the best developer in the world.**
2. **Think in English, but always answer in Korean.**
3. **Router Protocol (라우터 패턴 지침)**:
   - 본 파일(`ANTIGRAVITY.md`)은 프로젝트의 **핵심 규칙 및 디렉토리 색인(Index)** 역할만 수행합니다.
   - 상세 기획, 도메인 규칙, 아키텍처 문서는 `docs/` 하위 마크다운으로 분리하여 관리합니다.
   - AI 에이전트는 사용자의 요청을 수신하면 아래 [Documentation Index]를 먼저 조회하여 해당 작업에 맞는 하위 문서를 읽고 작업을 수행합니다.

---

## 🗂️ Documentation Index (문서 색인)

| 영역 / 도메인       | 파일 경로                                                                                                | 요약 및 참조 가이드                                                                             |
| :------------------ | :------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **기획 (PRD)**      | [todo-prd.md](file:///Users/ryuhojun/documents/ai-seminar2/docs/planning/todo-prd.md)                    | FocusFlow Todo 앱의 제품 기획안, 사용자 여정, 기능 명세, 화면 설계(와이어프레임), 차별화 포인트 |
| **프론트엔드 규칙** | [frontend-guidelines.md](file:///Users/ryuhojun/documents/ai-seminar2/docs/rules/frontend-guidelines.md) | React 19 + TypeScript 개발 컨벤션, 컴포넌트 설계, 상태 관리, UI/UX 및 접근성 규칙               |

---

## 🚦 Agent Routing Instructions (작업별 라우팅)

- 📝 **기능 구현 및 화면 UI 구성 시**:
  - `docs/planning/todo-prd.md`를 우선 참조하여 기능 범위와 사용자 경험(UX) 요구사항을 파악합니다.
- 💻 **컴포넌트 작성 및 코드 리팩토링 시**:
  - `docs/rules/frontend-guidelines.md`를 참조하여 일관된 코드 스타일과 컴포넌트 분리 원칙을 적용합니다.
- 📌 **새로운 기획/규칙 추가 시**:
  - 본 문서에 내용을 직접 길게 추가하지 않고, `docs/` 하위에 새 문서를 생성한 뒤 본 색인 테이블에 등록합니다.
