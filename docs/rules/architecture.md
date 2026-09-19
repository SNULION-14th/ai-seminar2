# 프로젝트 및 아키텍처 규칙 (Project & Architecture Rules)

> 본 문서는 애플리케이션의 지속 가능한 확장성, 관심사 분리(SoC), 일관된 디렉토리 구조를 보장하기 위한 아키텍처 설계 원칙입니다.

---

## 1. 아키텍처 원칙 (Core Architecture Principles)

### 1.1 관심사의 분리 (Separation of Concerns)
* **UI 레이어 (Presentation)**: 오직 화면 렌더링과 사용자 이벤트 수신에 집중하며, 비즈니스 로직을 포함하지 않습니다.
* **로직 레이어 (Business Logic)**: 상태 관리, 필터링, 데이터 조작 등은 React Custom Hook(`useTodos` 등)으로 캡슐화합니다.
* **데이터 접근 레이어 (Persistence Layer)**: 스토리지(`localStorage` 등) 접근은 별도 유틸리티/어댑터로 추상화하여, 추후 IndexedDB 또는 서버 API로 전환 시 UI 코드 변경을 방지합니다.

### 1.2 단방향 데이터 흐름 (Unidirectional Data Flow)
* **State Down, Events Up**: 상위 컴포넌트나 커스텀 훅에서 상태가 아래로 전달되고, 하위 컴포넌트는 이벤트 핸들러를 통해 상위로 액션을 전달합니다.
* 단일 진실 공급원(Single Source of Truth)을 유지하여 상태 동기화 불일치를 방지합니다.

---

## 2. 디렉토리 구조 표준 (Directory Structure)

`src/` 디렉토리는 도메인과 역할에 따라 다음과 같이 구성합니다:

```
src/
├── assets/             # 정적 리소스 (아이콘, 이미지 등)
├── components/         # UI 컴포넌트
│   ├── common/         # 공통 원자 UI (Button, Input, Badge, ProgressRing 등)
│   └── todo/           # Todo 도메인 컴포넌트 (TodoItem, TodoList, OneThingView 등)
├── hooks/              # 커스텀 훅 (비즈니스 로직 및 상태 제어)
│   ├── useTodos.ts     # CRUD, 필터링, 완료율 계산 로직
│   └── useLocalStorage.ts # 로컬스토리지 동기화 훅
├── types/              # TypeScript 타입/인터페이스 정의
│   └── todo.ts         # Todo, FilterType, Tag, Priority 등
├── utils/              # 순수 유틸리티 함수 (Side-effect 없음)
│   ├── storage.ts      # 스토리지 어댑터 함수
│   ├── parser.ts       # 태그(#), 우선순위(!) 인라인 파싱 함수
│   └── date.ts         # 날짜 및 요일 포맷터
├── styles/             # 전역 스타일 및 디자인 토큰 (CSS 변수)
│   └── variables.css   # 컬러, 간격, 폰트, 애니메이션 변수
├── App.tsx             # 최상위 레이아웃 및 뷰 조립
└── main.tsx            # 앱 엔트리포인트
```

---

## 3. 컴포넌트 설계 가이드라인

1. **단일 책임 원칙 (SRP)**:
   * 하나의 컴포넌트는 하나의 명확한 UI 책임만 갖습니다. (예: `TodoItem`은 개별 할 일 표시 및 상호작용만 담당)
2. **Props 인터페이스 명시**:
   * 컴포넌트 Props는 각 컴포넌트 파일 상단에 `interface [ComponentName]Props` 형태로 명시적으로 선언합니다.
3. **컴포넌트 분리 기준**:
   * 재사용 가능성이 있거나 코드가 100줄을 초과할 경우 하위 컴포넌트로 분리를 고려합니다.
4. **순수 함수 지향**:
   * `utils/`에 작성되는 헬퍼 함수는 외부 상태에 의존하지 않는 순수 함수(Pure Function)로 작성하여 단위 테스트가 용이하도록 만듭니다.

---

## 4. 상태 및 데이터 영속성 규칙 (Data Rules)

* **Todo 데이터 모델 기본 구조**:
```typescript
export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;              // 고유 ID (crypto.randomUUID() 사용)
  text: string;            // 할 일 내용
  completed: boolean;      // 완료 여부
  createdAt: number;       // 생성 타임스탬프
  priority?: Priority;     // 중요도 (! 파싱 결과)
  tags?: string[];         // 태그 (# 파싱 결과)
}
```
* **오프라인 우선 (Offline-First)**:
  * 모든 변경 사항은 상태 변경 즉시 스토리지에 동기화되며, 앱 로드 시 스토리지로부터 복원됩니다.
