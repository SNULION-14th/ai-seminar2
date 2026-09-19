# 🏛️ 시스템 아키텍처 및 설계 규칙 (Architecture & System Design)

> 본 문서는 FlowDo 애플리케이션의 계층 분리, 데이터 흐름, 상태 관리 및 지속성(Persistence) 아키텍처를 정의합니다.

---

## 1. 계층형 아키텍처 (Layered Architecture)

애플리케이션은 관심사에 따라 4개의 계층으로 엄격히 분리되며, 상위 계층은 하위 계층에만 의존합니다.

```mermaid
flowchart TD
    subgraph PresentationLayer [1. Presentation Layer - UI]
        TodoInput[TodoInput.tsx]
        TodoList / Top3Section
        CommonUI[Common UI Components]
    end

    subgraph ApplicationLayer [2. Application Layer - Business Logic]
        useTodos[useTodos Hook]
        useFilter[useFilter Hook]
    end

    subgraph DomainLayer [3. Domain Layer - Core Entities]
        TodoModel[Todo Entity & Types]
        TodoRules[Core Rules: Max 3 Top3, etc.]
    end

    subgraph DataLayer [4. Data / Infrastructure Layer]
        StorageAdapter[storageAdapter.ts]
        LocalStorage[(Browser LocalStorage)]
    end

    PresentationLayer --> ApplicationLayer
    ApplicationLayer --> DomainLayer
    ApplicationLayer --> DataLayer
    DataLayer --> LocalStorage
```

### 1.1 계층별 책임
1. **Presentation Layer (`src/components/`)**:
   - 순수한 시각적 렌더링 및 이벤트 캡처 담당.
   - 비즈니스 로직(예: Top 3 초과 검사, 날짜 연산, 스토리지 저장)을 포함하지 않고 Application Layer의 훅이 제공하는 함수를 호출.
2. **Application Layer (`src/hooks/`)**:
   - 유스케이스 구현 (할 일 추가, 완료 토글, 순서 변경, 삭제).
   - 상태(State) 관리 및 비즈니스 유효성 검사 조정.
3. **Domain Layer (`src/types/`, `src/utils/todo.ts`)**:
   - 데이터 모델 인터페이스 및 순수 도메인 함수 (예: `canAddToTop3(todos: Todo[])`).
   - 외부 라이브러리나 React 훅에 의존하지 않는 순수 TypeScript 로직.
4. **Data Layer (`src/utils/storage.ts`)**:
   - `localStorage` 또는 향후 IndexedDB 연동을 위한 어댑터.
   - 직렬화/역직렬화(Serialization), 에러 핸들링, 스토리지 마이그레이션 담당.

---

## 2. 데이터 모델 및 스키마 (Data Model)

### 2.1 Todo 엔티티 인터페이스
```typescript
export interface Todo {
  id: string;             // 고유 식별자 (crypto.randomUUID())
  title: string;          // 할 일 내용 (공백 제거 후 1자 이상)
  isCompleted: boolean;   // 완료 여부
  isTop3: boolean;        // '오늘의 Top 3' 고정 여부
  createdAt: string;      // 생성 일시 (ISO 8601 문자열)
  completedAt?: string;   // 완료 일시 (ISO 8601 문자열)
}

export interface TodoStorageState {
  version: number;        // 스키마 버전 (마이그레이션 대비)
  lastUpdated: string;    // 최종 동기화 일시
  todos: Todo[];
}
```

---

## 3. 상태 관리 및 Local-First 전략

### 3.1 단일 진실 공급원 (Single Source of Truth)
- React State가 런타임의 진실 공급원(SSOT) 역할을 수행합니다.
- 사용자의 모든 액션은 UI에 지연 없이(Zero-latency) 즉각 반영된 후 비동기/동기적으로 로컬 스토리지에 영속화됩니다.

### 3.2 스토리지 동기화 및 복원력 (Resilience)
- **JSON 안전 파싱**: 스토리지 데이터가 손상되었거나 유효하지 않은 포맷인 경우 앱이 충돌하지 않고 안전한 기본값(`[]`)으로 폴백 복구합니다.
- **Quota Exceeded 대응**: 브라우저 스토리지 용량 초과 예외 발생 시 사용자에게 안내하고 세션 상태는 유지합니다.
- **다중 탭 동기화**: `window.addEventListener('storage', ...)`를 통해 다른 탭에서 변경된 할 일 목록을 실시간 반영합니다.

---

## 4. 비즈니스 핵심 불변식 (Core Invariants)

1. **Top 3 제한 규칙**:
   - `isTop3 === true`인 미완료 항목은 **최대 3개**까지만 허용됩니다.
   - 3개가 채워진 상태에서 새로 추가되는 작업은 자동으로 `isTop3 = false` (Inbox 구역)로 분류됩니다.
2. **입력 유효성 검사**:
   - 공백만으로 이루어진 문자열(`title.trim() === ''`)은 등록되지 않습니다.
   - 최대 글자 수(예: 100자)를 초과할 수 없습니다.
3. **불변성(Immutability) 보장**:
   - 모든 상태 변경은 `todos.map(...)`, `todos.filter(...)` 등 기존 배열을 직접 변경(`mutation`)하지 않고 새로운 객체를 생성하여 수행합니다.

---

## 5. 성능 및 렌더링 최적화 규칙

- **안정적인 Key 속성**: 목록 렌더링 시 배열 인덱스가 아닌 고유 `todo.id`를 반드시 `key`로 사용합니다.
- **컴포넌트 메모이제이션**: 빈번히 렌더링되는 개별 `TodoItem`은 `React.memo`를 고려하여 다른 아이템의 상태 변화로 인한 불필요한 리렌더링을 방지합니다.
- **콜백 캐싱**: 자식 컴포넌트에 전달되는 핸들러 함수는 `useCallback`을 통해 참조 일관성을 유지합니다.
