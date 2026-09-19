# 시스템 아키텍처 및 데이터 흐름 설계 (System Architecture & Data Flow)

> 본 문서는 FocusFlow 앱의 소프트웨어 구조, 계층 분리 원칙 및 데이터 흐름을 정의합니다.

---

## 1. 아키텍처 설계 원칙 (Design Principles)

1. **단방향 데이터 흐름 (Unidirectional Data Flow)**: 상태 변경은 항상 정의된 액션(Handler)을 통해 흐르며, 하위 컴포넌트는 상위로부터 주입받은 데이터를 렌더링합니다.
2. **계층화된 관심사 분리 (Layered Architecture)**:
   * **UI Presentation Layer**: 상태 표시 및 사용자 인터랙션 수집.
   * **Domain & Application Logic Layer**: 커스텀 훅을 통한 비즈니스 로직(필터링, 우선순위 계산, 유효성 검증).
   * **Persistence / Infrastructure Layer**: LocalStorage 직렬화/역직렬화 및 예외 처리.
3. **오프라인 우선 (Offline-First & Local Persistence)**: 네트워크 연결 없이도 모든 상태가 브라우저 스토리지에 안전하게 영속화됩니다.

---

## 2. 계층 구조도 (Architecture Diagram)

```mermaid
graph TD
    subgraph UI_Layer [1. UI Presentation Layer]
        App[App.tsx]
        Header[Header / Progress]
        FocusZone[FocusList (Top 3)]
        TaskZone[GeneralTaskList]
        InputBar[TodoInputBar]
    end

    subgraph Logic_Layer [2. Domain & Application Logic Layer]
        useTodos[useTodos Hook]
        useFilter[useFilter / Computed State]
    end

    subgraph Infra_Layer [3. Storage & Infrastructure Layer]
        storageService[Storage Service (localStorage Adapter)]
        BrowserStorage[(Browser LocalStorage)]
    end

    App --> Header
    App --> FocusZone
    App --> TaskZone
    App --> InputBar

    FocusZone -->|Actions: toggle, reorder| useTodos
    TaskZone -->|Actions: toggle, delete| useTodos
    InputBar -->|Action: addTodo| useTodos

    useTodos --> useFilter
    useTodos <-->|Sync State| storageService
    storageService <-->|JSON Parse/Stringify| BrowserStorage
```

---

## 3. 핵심 데이터 모델 (Core Data Models)

```typescript
// types/todo.ts

export type PriorityLevel = 'high' | 'normal';

export interface Todo {
  id: string;              // 고유 식별자 (crypto.randomUUID())
  title: string;           // 할 일 내용
  completed: boolean;      // 완료 여부
  isFocus: boolean;        // 오늘의 Top 3 집중 대상 여부
  createdAt: number;       // 생성 타임스탬프 (Epoch ms)
  completedAt?: number;    // 완료 타임스탬프 (Epoch ms)
}

export type TodoFilterType = 'all' | 'focus' | 'completed';
```

---

## 4. 스토리지 어댑터 및 예외 처리 전략 (Storage Strategy)

* **방어적 JSON 파싱 (Defensive Parsing)**:
  `localStorage`의 데이터가 손상되었거나 스키마가 변경되었을 때 앱이 크래시되지 않도록 `try-catch` 및 유효성 검증(Validation Fallback)을 내장합니다.
* **Storage Key 네임스페이스**:
  충돌을 방지하기 위해 명시적인 키 네임스페이스를 사용합니다 (`focusflow:todos:v1`).
* **동기화 시점**:
  상태가 업데이트될 때마다 부수효과(`useEffect` 또는 훅 내부 디스패치)를 통해 스토리지에 즉시 동기화합니다.
