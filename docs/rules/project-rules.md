# 프로젝트 개발 규칙 및 코드 컨벤션 (Project Rules & Guidelines)

> 본 문서는 프로젝트의 코드 품질, 디렉토리 구조, 네이밍 규칙 및 개발 표준을 정의합니다.

---

## 1. 디렉토리 구조 규칙 (Directory Structure)
`src/` 하위 디렉토리는 관심사 분리(Separation of Concerns) 원칙에 따라 다음과 같이 구성합니다.

```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── common/          # 공통 UI 컴포넌트 (Button, Input 등)
│   └── todo/            # Todo 도메인 관련 컴포넌트 (TodoList, TodoItem, TodoInput 등)
├── hooks/               # 비즈니스 로직 및 상태 제어 커스텀 훅 (useTodos.ts 등)
├── types/               # TypeScript 인터페이스 및 타입 정의 (todo.ts 등)
├── services/            # 로컬 스토리지, 외부 API 연동 등 인프라 로직 (storage.ts)
├── utils/               # 순수 유틸리티 함수 (date.ts, format.ts 등)
├── App.tsx              # 최상위 뷰 및 레이아웃 조립
└── main.tsx             # 진입점
```

---

## 2. 네이밍 컨벤션 (Naming Conventions)

| 대상 | 표기법 (Case) | 예시 |
| :--- | :--- | :--- |
| **컴포넌트 파일** | `PascalCase.tsx` | `TodoItem.tsx`, `Header.tsx` |
| **커스텀 훅** | `camelCase.ts` (`use` 접두사) | `useTodos.ts`, `useLocalStorage.ts` |
| **유틸/서비스 파일** | `camelCase.ts` | `storage.ts`, `dateUtils.ts` |
| **타입/인터페이스 파일**| `kebab-case.ts` 또는 `name.types.ts` | `todo.types.ts` |
| **컴포넌트 함수명** | `PascalCase` | `function TodoList() { ... }` |
| **인터페이스 / 타입명**| `PascalCase` | `interface TodoItemProps { ... }` |
| **상수 (Constants)** | `UPPER_SNAKE_CASE` | `STORAGE_KEY_TODOS`, `MAX_FOCUS_COUNT` |

---

## 3. TypeScript 및 React 작성 규칙

### 3.1. TypeScript 준수 사항
* `any` 타입 사용은 엄격히 금지하며, 불분명한 경우 `unknown`을 사용하고 타입 가드(Type Guard)를 작성합니다.
* 모든 Props와 상태(State)는 명시적인 인터페이스/타입으로 선언합니다.
* 데이터 모델과 컴포넌트 Props는 분리하여 관리합니다.

### 3.2. React 컴포넌트 및 로직 분리
* **View와 Logic의 분리**: 컴포넌트 내부에서 복잡한 상태 계산이나 비즈니스 로직을 직접 수행하지 않고, 커스텀 훅(`src/hooks/`)으로 캡슐화합니다.
* **불변성 유지**: 상태 변경 시 순수 함수와 스프레드 연산자 등을 활용하여 항상 불변성을 지킵니다.
* **조기 반환(Early Return)**: 조건부 렌더링 시 중첩 삼항 연산자를 지양하고 Early Return 패턴을 적극 활용합니다.

---

## 4. Git 및 커밋 규칙 (Commit Conventions)
커밋 메시지는 다음과 같은 접두사 형식을 따릅니다.
* `feat`: 새로운 기능 추가
* `fix`: 버그 수정
* `refactor`: 동작 변경 없는 코드 리팩토링
* `style`: 스타일링(CSS) 또는 포맷팅 변경
* `docs`: 문서 작성 및 수정
* `chore`: 빌드 설정 및 패키지 매니저 관련 변경
