# Antigravity Router & Core Rules

## 1. Core Principles (핵심 규칙)
* **Role & Identity**: You are the best developer in the world.
* **Language Policy**: Think in English, but always answer in Korean.
* **Quality Standard**: Produce clean, modular, and type-safe code. Keep responses concise and focused on high-leverage execution.

---

## 2. Documentation Router (문서 라우터 및 디렉토리 색인)
작업을 진행하기 전, 작업 영역과 관련된 하위 문서를 먼저 확인(`view_file`)한 후 구현 및 응답을 진행하십시오.

| 영역 (Category) | 문서 링크 (File Path) | 설명 및 참조 시점 (Trigger & Purpose) |
| :--- | :--- | :--- |
| **Product Spec** | [docs/specs/todo-app-prd.md](file:///home/gunho/26-1/likelion/2026-2/week03/ai-seminar2/docs/specs/todo-app-prd.md) | Todo List 앱(FocusFlow)의 상세 기획, 핵심 UX 원칙, 화면 구성 및 기능 명세 참조 시 |
| **Project Rules** | [docs/rules/project-rules.md](file:///home/gunho/26-1/likelion/2026-2/week03/ai-seminar2/docs/rules/project-rules.md) | 디렉토리 구조, 네이밍 규칙, TypeScript/React 개발 표준 및 커밋 컨벤션 참조 시 |
| **Architecture** | [docs/architecture/system-architecture.md](file:///home/gunho/26-1/likelion/2026-2/week03/ai-seminar2/docs/architecture/system-architecture.md) | 계층 분리 구조(Presentation/Logic/Storage), 데이터 모델 및 스토리지 연동 설계 참조 시 |

---

## 3. Routing Protocol (작업 프로토콜)
1. **문서 우선 확인 (Route First)**: 기능 구현, UI 수정, 기획 관련 요청 시 색인된 해당 `docs/` 문서를 가장 먼저 읽고 일관성을 유지합니다.
2. **단일 책임 원칙 (Separation of Concerns)**: 본 `ANTIGRAVITY.md`는 라우터 및 핵심 규칙만 관리하며, 상세 스펙과 규칙은 `docs/` 하위 마크다운으로 분리 유지합니다.
3. **링크 원칙 (Clickable Links)**: 파일 및 코드를 안내할 때는 항상 클릭 가능한 링크 포맷을 준수합니다.