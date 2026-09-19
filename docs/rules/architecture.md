# 🏗️ 프로젝트 및 아키텍처 규칙 (Architecture Rules)

본 문서는 `ai-seminar2` (OneFocus Todo 앱) 프로젝트의 기술 스택, 디렉토리 구조, 설계 원칙 및 코딩 컨벤션을 정의합니다.

---

## 1. 기술 스택 (Tech Stack)
* **Framework**: React 19 (Functional Components, Hooks)
* **Language**: TypeScript (Strict mode 준수)
* **Bundler & Build Tool**: Vite
* **Icons**: `lucide-react`
* **Styling**: Modern CSS (CSS Variables, Flexbox/Grid, Dark/Light Mode 지원)
* **Storage**: Browser LocalStorage (Local-First 원칙)

---

## 2. 디렉토리 구조 (Directory Structure)

`src/` 하위 디렉토리는 역할과 관심사에 따라 다음과 같이 구성합니다:

```text
src/
├── assets/          # 정적 에셋 (이미지, 아이콘, svg 등)
├── components/      # UI 컴포넌트
│   ├── common/      # 범용 UI 컴포넌트 (Button, Input, Modal, Badge 등)
│   └── todo/        # Todo 도메인 컴포넌트 (TodoList, TodoItem, FocusMode, ProgressBar 등)
├── hooks/           # 비즈니스 로직 및 상태 관리 커스텀 훅 (useTodos, useLocalStorage, useTimer 등)
├── types/           # TypeScript 타입 및 인터페이스 정의 (todo.ts 등)
├── utils/           # 순수 함수 및 유틸리티 (date, storage, validation 등)
├── constants/       # 상수 정의 (STORAGE_KEYS, FILTER_TYPES 등)
├── App.tsx          # 루트 컴포넌트 (레이아웃 및 프로바이더 연결)
├── main.tsx         # 엔트리 포인트
└── index.css        # 글로벌 스타일 및 테마 토큰(CSS Variables)
```

---

## 3. 핵심 아키텍처 원칙 (Core Principles)

### ① 관심사의 분리 (Separation of Concerns)
* **UI와 비즈니스 로직의 분리**: 컴포넌트 내부에서 LocalStorage를 직접 제어하거나 복잡한 상태 변환 로직을 두지 않고, 반드시 `hooks/useTodos.ts`와 같은 커스텀 훅으로 위임합니다.
* **단일 책임 원칙 (SRP)**: 각 컴포넌트는 하나의 명확한 역할만 수행해야 합니다. (예: `TodoItem`은 개별 항목의 렌더링과 이벤트 전달만 담당)

### ② 엄격한 타입 안정성 (Strict Type Safety)
* `any` 타입 사용은 엄격히 금지하며, 인터페이스와 유니온 타입을 명확히 정의합니다.
* 예시 모델:
  ```typescript
  export type TodoStatus = 'today' | 'someday';

  export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    status: TodoStatus;
    isFocused?: boolean;
    createdAt: number;
    completedAt?: number;
  }
  ```

### ③ 데이터 무결성 & 로컬 퍼스트 (Local-First State)
* 상태 변경 시 항상 불변성(Immutability)을 유지합니다.
* 모든 상태 업데이트는 LocalStorage와 안정적으로 동기화되어 새로고침 및 재접속 시에도 상태가 유실되지 않아야 합니다.

---

## 4. 코딩 및 스타일 컨벤션 (Conventions)

### 명명 규칙 (Naming Conventions)
* **컴포넌트 파일 & 함수**: `PascalCase` (예: `TodoItem.tsx`, `FocusModal.tsx`)
* **커스텀 훅**: `camelCase` + `use` 접두사 (예: `useTodos.ts`, `useTimer.ts`)
* **타입 및 인터페이스**: `PascalCase` (예: `Todo`, `TodoFilterType`)
* **유틸리티 및 상수**: 파일은 `camelCase` / 상수는 `UPPER_SNAKE_CASE` (예: `STORAGE_KEY_TODOS`)

### 컴포넌트 설계 가이드
* Props 인터페이스는 컴포넌트 상단에 명시적으로 선언합니다.
* 이벤트 핸들러 prop은 `onAction` 패턴을 따릅니다 (예: `onToggle`, `onDelete`, `onSelectFocus`).
