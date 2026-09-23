# 📐 [규칙] 프론트엔드 아키텍처 및 코딩 컨벤션

이 문서는 FlowDo 프로젝트의 프론트엔드 개발 표준 및 구현 원칙을 정의합니다.

---

## 1. 기술 스택 원칙
- **Framework:** React 19 + TypeScript (Strict Mode)
- **Bundler:** Vite
- **Icons:** `lucide-react`
- **State & Storage:** React Hooks (`useState`, `useReducer`, `useCallback`) + `localStorage` 기반 영속화

---

## 2. 프로젝트 디렉토리 구조
```
src/
├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── common/       # 버튼, 입력창, 모달 등 범용 컴포넌트
│   └── todo/         # TodoItem, TodoList, InputBar, SunsetModal 등
├── hooks/            # 커스텀 훅 (예: useTodos, useLocalStorage, useSound)
├── storage/          # 스토리지 어댑터 및 레포지토리 구현체
├── types/            # TypeScript 타입 및 인터페이스 정의 (todo.ts 등)
├── utils/            # 헬퍼 함수 (날짜 포맷, 자연어 파서 등)
├── App.tsx           # 메인 애플리케이션 엔트리
└── main.tsx          # 렌더링 엔트리
```

---

## 3. 핵심 코딩 컨벤션

### 3.1 명명 규칙 (Naming Conventions)
- **컴포넌트 & 인터페이스:** PascalCase (예: `TodoItem.tsx`, `interface Todo`)
- **함수, 변수, 훅:** camelCase (예: `const useTodos = () => ...`, `handleToggleTodo`)
- **상수:** UPPER_SNAKE_CASE (예: `MAX_FOCUS_COUNT = 3`)

### 3.2 컴포넌트 작성 원칙
- 함수형 컴포넌트(`FC` 또는 일반 함수 선언) 사용.
- 비즈니스 로직은 Custom Hook으로 분리하여 UI 컴포넌트의 단일 책임 원칙(SRP) 준수.
- `any` 타입 사용 엄격 금지 (`unknown` 또는 명시적 타입 지정).
- Props는 TypeScript `interface`로 선언하고 구조 분해 할당으로 수신.

### 3.3 UX 및 인터랙션 구현 규칙
- 사용자의 모든 액션(등록, 완료, 삭제)에 대해 100ms 이내의 즉각적인 시각적 피드백 제공.
- 불필요한 전체 리렌더링 방지 (`useCallback`, `useMemo` 적절한 활용).
- 접근성(Accessibility, A11y): 버튼 키보드 내비게이션(`Tab`, `Enter`, `Escape`) 보장.
