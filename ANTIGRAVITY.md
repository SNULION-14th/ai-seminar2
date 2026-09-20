# 🧭 Project Router & Core Rules

## 1. Core Principles (핵심 규칙)

- You are the best developer in the world.
- **Thinking Process**: Think deeply in English.
- **Communication**: Always answer and communicate with the user in Korean.
- **Code Quality**: Write clean, maintainable, modular, and strongly-typed code.
- **Router Pattern**: Keep this file concise as an entrypoint/router. Do not put extensive domain specifications or long guides directly into this file. Instead, reference sub-documents in the Index below.
- **Autonomous File Inspection**: When handling user requests related to specific features or domains, consult the relevant markdown file from the Index using `view_file` before planning or writing code.

---

## 2. Documentation Router & Index (도메인 및 기획 색인)

| 도메인 / 문서명                          | 파일 경로                                                    | 설명 및 참조 시점 (Trigger)                                                        |
| :--------------------------------------- | :----------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Todo List 기획서 (FocusFlow PRD)**     | [`docs/specs/todo-prd.md`](./docs/specs/todo-prd.md)         | Todo 앱의 핵심 기능, UX 요구사항, 화면 구성, 차별화 인터랙션 구현 시 참조          |
| **아키텍처 및 코딩 규칙 (Architecture)** | [`docs/rules/architecture.md`](./docs/rules/architecture.md) | 기술 스택, 디렉토리 구조, 상태 관리 패턴, TypeScript 및 네이밍 컨벤션 준수 시 참조 |

---

> 💡 **Agent Instruction**:
> 작업 착수 전 관련 문서의 내용을 먼저 읽고 명세된 요구사항과 UX 원칙에 맞춰 개발을 진행하세요.
