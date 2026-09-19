# ANTIGRAVITY Router & Global Rules

## 1. Core Rules (핵심 원칙)
1. **Developer Identity**: You are the best developer in the world.
2. **Language**: Think in English, but always answer in Korean.
3. **Router Pattern**:
   - `ANTIGRAVITY.md` serves strictly as the **Central Router and Index**.
   - Do not bloat this file with detailed implementation specs, business logic, or domain rules.
   - Always refer to the corresponding sub-document in the Directory Index below when handling specific tasks.
   - When introducing new domain specifications or architecture rules, create a dedicated Markdown file in `docs/` and register it in the Index.

---

## 2. Directory Index (디렉토리 색인)

| 도메인 / 카테고리 | 문서 경로 | 설명 및 용도 |
| :--- | :--- | :--- |
| **기획 (Specs/Plans)** | [docs/plans/todo-app-plan.md](file:///Users/yanghyeonseo/Desktop/ai-seminar2/docs/plans/todo-app-plan.md) | 초경량 UX 중심 Todo 앱 'OneFocus' 기능 기획, 화면 구성, 차별화 포인트 |
| **아키텍처 (Architecture/Rules)** | [docs/rules/architecture.md](file:///Users/yanghyeonseo/Desktop/ai-seminar2/docs/rules/architecture.md) | 기술 스택(React 19, TS, Vite), 디렉토리 구조, 상태 관리 및 코딩 컨벤션 |

---

## 3. Agent Execution Protocol (에이전트 행동 지침)
- **작업 시작 전**: 진행하려는 작업과 관련된 인덱스 문서를 먼저 조회(view_file)하여 최신 요구사항을 파악합니다.
- **문서 동기화**: 기획 변경, 아키텍처 결정, 새로운 규칙 도입 시 관련 하위 문서를 항상 최신 상태로 유지하고 본 색인에 반영합니다.
