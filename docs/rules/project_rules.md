# 📐 프로젝트 개발 및 코딩 표준 (Project & Coding Rules)

> 본 문서는 FlowDo 프로젝트의 코드 품질, 일관성 및 생산성을 유지하기 위한 코딩 표준 및 컨벤션을 정의합니다.

---

## 1. 프로젝트 디렉토리 구조 (Directory Layout)

모든 소스 코드는 `src/` 하위에 위치하며, 관심사 분리(SoC) 원칙에 따라 디렉토리를 구성합니다.

```text
src/
├── assets/          # 정적 에셋 (이미지, SVG, 아이콘, 폰트)
├── components/      # UI 컴포넌트
│   ├── common/      # 범용 재사용 컴포넌트 (Button, Input, Modal, Badge 등)
│   └── todo/        # 투두 도메인 전용 컴포넌트 (TodoInput, TodoItem, Top3Section, InboxSection)
├── hooks/           # 도메인 및 비즈니스 로직을 캡슐화한 커스텀 훅 (useTodos, useLocalStorage 등)
├── types/           # TypeScript 타입 정의 파일 (todo.ts, common.ts)
├── utils/           # 순수 함수 유틸리티 (날짜 포맷터, 스토리지 헬퍼, 유효성 검사기)
├── constants/       # 상수 정의 (스토리지 키, 기본 설정값, 에러 메시지)
├── styles/          # 전역 스타일 및 테마 정의
├── App.tsx          # 최상위 레이아웃 컴포넌트
└── main.tsx         # 애플리케이션 진입점
```

---

## 2. 네이밍 컨벤션 (Naming Conventions)

- **디렉토리 & 일반 파일**: `kebab-case` 또는 `camelCase` (도메인 통일: 디렉토리는 `kebab-case` 권장)
- **컴포넌트 파일 및 이름**: `PascalCase` (예: `TodoItem.tsx`, `Top3Section.tsx`)
- **커스텀 훅**: `camelCase`로 작성하며 반드시 `use` 접두사 사용 (예: `useTodos.ts`, `useConfetti.ts`)\n- **타입 및 인터페이스**: `PascalCase` (예: `Todo`, `TodoFilterType`, `TodoItemProps`)
- **상수 변수**: 대문자 스네이크 케이스 `UPPER_SNAKE_CASE` (예: `STORAGE_KEY_TODOS`, `MAX_TOP3_COUNT = 3`)

---

## 3. TypeScript 코딩 표준 (TypeScript Guidelines)

1. **Strict Type Safety**:
   - `any` 타입 사용은 엄격히 금지하며, 불가피한 경우 `unknown`을 사용하고 타입 가드를 작성합니다.
   - 데이터 모델 및 컴포넌트 Props는 명시적 인터페이스로 선언합니다.
2. **Interface vs Type**:
   - 확장 가능한 객체 구조 및 엔티티는 `interface`를 우선합니다.
   - 유니온 타입, 튜플, 복합 유틸리티 타입은 `type`을 사용합니다.
3. **Props 인터페이스 네이밍**:
   - 해당 컴포넌트 이름 뒤에 `Props`를 붙입니다 (예: `interface TodoInputProps { ... }`).

---

## 4. React 컴포넌트 작성 원칙

1. **단일 책임 원칙 (Single Responsibility)**:
   - 컴포넌트는 UI 렌더링에 집중하며, 복잡한 상태 처리 및 데이터 조작은 커스텀 훅(`src/hooks/`)으로 위임합니다.
2. **함수 선언 방식**:
   - 컴포넌트는 `export function ComponentName() { ... }` 형태의 명명된 함수(Named Export)를 권장합니다.
3. **조기 반환 (Early Return)**:
   - 복잡한 조건문 중첩을 피하고 조기 반환 패턴을 사용하여 가독성을 확보합니다.
4. **Prop Drilling 방지**:
   - 3단계 이상의 Prop Drilling이 발생할 경우 상태 위치를 재검토하거나 Context API를 활용합니다.

---

## 5. 코드 품질 및 커밋 가이드라인

- **Lint & Formatter**: ESLint 규칙을 철저히 준수하며 빌드 경고 및 에러가 없어야 합니다.
- **Git Commit Convention**:
  - `feat`: 신규 기능 추가
  - `fix`: 버그 수정
  - `refactor`: 프로덕션 코드 리팩토링 (동작 변경 없음)
  - `style`: 코드 스타일, 포맷팅 수정 (동작 변경 없음)
  - `docs`: 문서 작성 및 수정
  - `chore`: 빌드 업무, 패키지 매니저 설정 등
