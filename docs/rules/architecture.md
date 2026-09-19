# 🏗️ 프로젝트 및 아키텍처 규칙 (Architecture Guidelines)

본 문서는 프로젝트의 기술 스택, 폴더 구조, 컴포넌트 설계 원칙, 상태 관리 및 코드 품질 규칙을 정의합니다.

---

## 1. 기술 스택 (Tech Stack)

* **Core**: React 19, TypeScript (Strict Mode), Vite
* **Icons**: `lucide-react`
* **Styling**: Modern CSS / CSS Variables (테마 및 반응형 지원)
* **Storage**: Browser LocalStorage (Persistence)

---

## 2. 디렉토리 구조 (Directory Architecture)

관심사 분리(Separation of Concerns)를 원칙으로 하여, UI와 비즈니스 로직을 명확히 분리합니다.

```text
src/
├── assets/          # 정적 에셋 (이미지, 폰트, 오디오 등)
├── components/      # UI 컴포넌트
│   ├── common/      # 재사용 가능한 공용 UI 요소 (Button, Input, Modal 등)
│   └── todo/        # Todo 도메인 특화 컴포넌트
│       ├── TodoHeader.tsx      # 헤더 및 진행률 프로그레스 바
│       ├── TodoInput.tsx       # 할 일 입력창
│       ├── TodoList.tsx        # 할 일 리스트 컨테이너
│       ├── TodoItem.tsx        # 개별 할 일 카드/행
│       └── TodoFilter.tsx      # 필터 탭 및 액션 바
├── hooks/           # 비즈니스 로직 및 커스텀 훅
│   ├── useTodos.ts             # Todo 상태 CRUD 및 필터링 비즈니스 로직
│   └── useLocalStorage.ts      # LocalStorage 동기화 훅
├── types/           # 전역 및 도메인 TypeScript 타입 정의
│   └── todo.ts                 # Todo, FilterType, Priority 등 인터페이스
├── utils/           # 순수 유틸리티 함수 (부수효과 없음)
│   ├── date.ts                 # 날짜 포맷팅 유틸
│   └── storage.ts              # 안전한 스토리지 접근/파싱 유틸
├── constants/       # 프로젝트 전역 상수
│   └── storage.ts              # LocalStorage 키 등
├── App.tsx          # 최상위 레이아웃 및 훅 조합
├── main.tsx         # 앱 진입점
└── index.css        # 전역 스타일 및 디자인 시스템 변수
```

---

## 3. 설계 및 상태 관리 원칙 (Design Principles)

### 3.1 UI 컴포넌트와 로직의 분리 (Container-Presenter Pattern)
* **프레젠테이션 컴포넌트 (`components/`)**:
  * 화면 렌더링과 사용자 이벤트 전달만 담당합니다.
  * 자체적으로 복잡한 비즈니스 로직이나 로컬 스토리지에 직접 접근하지 않습니다.
* **커스텀 훅 (`hooks/useTodos.ts`)**:
  * 할 일의 추가, 삭제, 수정, 토글, 필터링, 정렬 등 **모든 핵심 상태 로직을 캡슐화**합니다.
  * 컴포넌트는 이 훅이 반환하는 상태와 핸들러 함수만 주입받아 사용합니다.

### 3.2 상태 불변성 및 방어적 코딩 (Defensive Programming)
* 모든 상태 업데이트는 **불변성(Immutability)**을 철저히 지킵니다 (`map`, `filter`, 전개 연산자 활용).
* LocalStorage 접근 시 JSON 파싱 에러 방지를 위해 반드시 `try-catch` 및 Fallback 데이터를 적용합니다.
* 사용자가 공백만 입력하거나 비정상적인 값을 넣지 못하도록 `trim()` 및 유효성 검증을 필수로 수행합니다.

---

## 4. 코딩 및 네이밍 컨벤션 (Coding Standards)

| 대상 | 컨벤션 | 예시 |
| :--- | :--- | :--- |
| **컴포넌트 파일 / 함수** | PascalCase | `TodoItem.tsx`, `function TodoItem()` |
| **타입 및 인터페이스** | PascalCase | `interface Todo`, `type FilterType` |
| **커스텀 훅** | camelCase (`use` 접두사) | `useTodos.ts`, `useLocalStorage.ts` |
| **유틸 / 일반 함수** | camelCase | `formatDate()`, `getStorageItem()` |
| **상수** | UPPER_SNAKE_CASE | `STORAGE_KEY_TODOS` |
| **이벤트 핸들러 Props** | `on` 접두사 | `onToggle`, `onDelete`, `onUpdate` |
| **내부 이벤트 핸들러** | `handle` 접두사 | `handleToggle`, `handleSubmit` |

### TypeScript 규칙
* `any` 타입은 일절 사용하지 않으며, 엄격한 타입을 선언합니다.
* 컴포넌트의 Props는 `interface [ComponentName]Props` 형태로 컴포넌트 상단에 명시합니다.
* 함수 반환 타입을 명확히 추론할 수 있도록 작성합니다.

---

## 5. 성능 및 인터랙션 품질 기준

* **키보드 접근성**: Tab, Enter, Space 등 키보드 탐색만으로 모든 핵심 기능이 동작해야 합니다.
* **레이아웃 시프트 방지**: 애니메이션이나 리스트 추가/삭제 시 갑작스러운 덜컹거림이 없도록 transition을 설계합니다.
