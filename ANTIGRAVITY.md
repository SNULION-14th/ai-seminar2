# ANTIGRAVITY ROUTER : FocusFlow Project

You are the best software engineer and world-class product manager in the world.  
**Think in English, but always answer the user in Korean.**

이 파일(`ANTIGRAVITY.md`)은 프로젝트의 **중앙 라우터(Router) 및 색인(Index)** 역할을 합니다.  
본 파일에는 핵심 행동 원칙과 라우팅 테이블만 유지하며, 상세 기획 및 아키텍처 규칙은 아래 분리된 하위 문서들을 참조하여 작업합니다.

---

## 🧭 문서 라우터 (Documentation Router)

작업을 수행하기 전, 아래 라우팅 규칙에 따라 해당 도메인의 문서를 먼저 확인하세요.

| 분야 (Domain) | 참조 문서 (Path) | 열람 조건 (When to Read) |
| :--- | :--- | :--- |
| **제품 기획 (PRD)** | [`docs/prd.md`](docs/prd.md) | • 새로운 기능 기획 또는 요구사항을 확인할 때<br/>• 화면 구성, 사용자 흐름(Flow), 핵심 차별화(Top 3, 나이트 클린업) 구현 시 |
| **디자인 & UI 프롬프트** | [`docs/design_prompt.md`](docs/design_prompt.md) | • Magic Patterns/v0 등 AI 디자인 툴 입력용 프롬프트 확인 시<br/>• UI 컬러 팔레트, 타이포그래피 및 디자인 토큰 참조 시 |
| **시스템 아키텍처** | [`docs/architecture.md`](docs/architecture.md) | • 디렉토리 구조 및 컴포넌트 계층을 설계할 때<br/>• 상태 관리(`useTodos`), 로컬스토리지 연동, 데이터 인터페이스(`todo.ts`) 정의 시 |
| **코딩 컨벤션 & 표준**| [`docs/conventions.md`](docs/conventions.md) | • TypeScript 코드 및 React 컴포넌트 작성 시<br/>• 네이밍 규칙, 스타일링 가이드, Git 커밋 메시지 작성 시 |

---

## ⚡ 프로젝트 요약 & 실행 명령어

* **기술 스택:** React 19, TypeScript, Vite, Lucide React, Modern CSS
* **주요 명령어:**
  ```bash
  npm run dev      # 로컬 개발 서버 구동 (Vite HMR)
  npm run build    # TypeScript 컴파일 및 프로덕션 빌드
  npm run lint     # ESLint 검사
  ```

---

## 📂 프로젝트 구조 요약

```text
ai-seminar2/
├── ANTIGRAVITY.md        # [현재 파일] 중앙 라우터 및 핵심 색인
├── docs/                 # 도메인별 상세 문서
│   ├── prd.md            # 제품 기획안 (PRD)
│   ├── design_prompt.md  # AI 디자인(Magic Patterns) 전용 프롬프트
│   ├── architecture.md   # 시스템 아키텍처 및 데이터 흐름
│   └── conventions.md    # 개발 표준 및 코딩 컨벤션
├── src/                  # 소스 코드
│   ├── components/       # UI 컴포넌트 (common, layout, task, modal)
│   ├── hooks/            # 비즈니스 로직 커스텀 훅 (useTodos 등)
│   ├── services/         # 스토리지 서비스 (storageService)
│   ├── types/            # TypeScript 타입 정의
│   ├── utils/            # 헬퍼 및 애니메이션 유틸
│   └── styles/           # CSS 디자인 토큰 및 스타일
└── package.json
```

---

## 🛡️ 핵심 엔지니어링 원칙 (Core Rules)
1. **Router First:** 코드 수정 및 기능 추가 전 반드시 해당 도메인 문서(`docs/`)의 규칙을 준수한다.
2. **Strict Typing:** `any` 사용을 지양하고 모든 데이터 모델과 훅 반환 타입은 엄격하게 타이핑한다.
3. **Zero Friction UX:** 모든 UI/인터랙션은 사용자의 클릭 수와 인지 부하를 최소화하는 방향으로 설계한다.
