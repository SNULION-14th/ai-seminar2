# 🧭 ANTIGRAVITY Master Router & Index

> **Core Persona & Language Directives:**
> * You are the best developer and software architect in the world.
> * Always **think in English**, but communicate and **answer in Korean**.
> * Follow the **Router Pattern**: This file serves as the single source of truth for routing, high-level directives, and documentation indexing. Detailed specifications and rules are partitioned into sub-markdown files.

---

## 📌 1. Project Overview & Tech Stack

* **Project:** PureChat — 피로도 제로, 본질에 집중한 초간단 미니멀 메신저 웹/모바일 앱
* **Frontend:** React 19 + TypeScript + Vite 8
* **Icons:** Lucide React
* **Architecture:** Feature-Driven Modular Architecture (`src/features/*`)
* **State & Realtime:** Custom Hooks + Context / Event-driven Realtime Flow

---

## 🗂️ 2. Documentation Router & Index (문서 색인)

작업 유형에 따라 아래 해당 하위 문서를 즉시 참조(`view_file`)하여 요구사항과 규칙을 준수하세요.

| 분야 | 대상 문서 경로 | 주요 내용 및 읽어야 하는 시점 |
| :--- | :--- | :--- |
| **기획 & UX** | [docs/product/messenger_proposal.md](file:///home/gunho/26-1/likelion/2026-2/week03/ai-seminar2/docs/product/messenger_proposal.md) | **[기획안]** PureChat 제품 비전, 4대 UX 원칙, MoSCoW 기능 정의, 화면 구성 와이어프레임, 차별화 포인트(포커스 핑, 클린챗), KPI. <br>👉 *새로운 기능 기획, 화면 플로우 및 UI 레이아웃 구현 시 필독* |
| **시스템 아키텍처** | [docs/architecture/system_architecture.md](file:///home/gunho/26-1/likelion/2026-2/week03/ai-seminar2/docs/architecture/system_architecture.md) | **[아키텍처]** Feature 기반 디렉토리 구조, 핵심 데이터 모델(User, Message, ChatRoom), 낙관적 업데이트(Optimistic UI) 및 데이터 흐름, 캐시 전략. <br>👉 *상태 관리, 데이터 모델링, 디렉토리 생성 및 통신 계층 개발 시 필독* |
| **개발 & 코딩 표준** | [docs/rules/coding_standards.md](file:///home/gunho/26-1/likelion/2026-2/week03/ai-seminar2/docs/rules/coding_standards.md) | **[코딩 규칙]** TypeScript Strict 규칙 (`any` 금지), React 19 컴포넌트/커스텀 훅 패턴, 모바일 퍼스트 반응형 및 터치 타깃 가이드, Conventional Commits. <br>👉 *코드 작성, 컴포넌트 구현 및 리팩터링 시 필수 준수* |

---

## ⚡ 3. Global Golden Directives (절대 준수 핵심 규칙)

1. **3-Tap Rule (UX 극단적 간결성):** 사용자가 앱 진입부터 대화 전송까지 3번 이상의 터치를 거치지 않도록 불필요한 단계를 제거합니다.
2. **Feature-Driven Separation:** 모든 비즈니스 로직은 `src/features/{feature-name}` 내부에 `components`, `hooks`, `types`로 캡슐화합니다.
3. **Zero-Any TypeScript:** 코드베이스 내 `any` 사용을 금지하며, Discriminated Union과 Type Guard를 통해 런타임 안정성을 확보합니다.
4. **Optimistic & Resilient UI:** 메시징 작업 시 즉각적인 반응성(Optimistic Update)을 보장하고, 에러 시 재시도 경로를 제공합니다.
5. **Progressive Disclosure:** 상세 작업 시 반드시 위 색인 테이블의 라우팅 문서를 확인하고 일관된 컨벤션 하에 개발합니다.