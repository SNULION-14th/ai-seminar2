# [Architecture] 시스템 설계 및 아키텍처 규칙

이 문서는 **FocusFlow** 투두리스트 프로젝트의 기술 스택, 디렉토리 구조, 데이터 모델 및 상태 관리 아키텍처 규칙을 정의합니다.

---

## 1. 기술 스택 (Tech Stack)

| 영역 | 기술 / 라이브러리 | 선정 사유 |
| :--- | :--- | :--- |
| **Framework** | **React 19** | 최신 React 훅 및 컴포넌트 렌더링 최적화 |
| **Language** | **TypeScript 6.x** | 엄격한 타입 안정성(Strict Type-Safety) 및 런타임 오류 방지 |
| **Build Tool** | **Vite 8.x** | 빠른 HMR 개발 경험 및 최적화된 번들링 |
| **Icons** | **Lucide React** | 미니멀하고 일관된 벡터 아이콘 셋 제공 |
| **Styling** | **Modern CSS / CSS Modules** | 번들 오버헤드 없는 네이티브 CSS 변수 기반 테마 시스템 |
| **Persistence** | **Web LocalStorage API** | 오프라인 동작 및 MVP 무설정 즉시 사용 보장 |

---

## 2. 디렉토리 구조 (Directory Structure)

관심사 분리(Separation of Concerns)를 기반으로 비즈니스 로직과 UI 컴포넌트를 명확히 분리합니다.

```text
src/
├── components/          # 재사용 및 도메인 UI 컴포넌트
│   ├── common/          # 버튼, 입력창, 체크박스 등 공통 UI
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Checkbox.tsx
│   ├── layout/          # 헤더, 프로그레스 바, 메인 컨테이너
│   │   ├── Header.tsx
│   │   └── ProgressBar.tsx
│   ├── task/            # 태스크 관련 컴포넌트
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   └── TaskQuickInput.tsx
│   └── modal/           # 축하 모달, 정리(Clean-up) 모달
│       ├── CelebrationModal.tsx
│       └── CleanupModal.tsx
├── hooks/               # 커스텀 훅 (비즈니스 로직 분리)
│   ├── useTodos.ts      # 투두 CRUD 및 정렬/필터 로직
│   ├── useLocalStorage.ts # 로컬스토리지 동기화 훅
│   └── useHaptics.ts    # 진동/인터랙션 피드백 훅
├── services/            # 외부 스토리지 및 API 통신 추상화
│   └── storageService.ts # LocalStorage CRUD 추상화 계층
├── types/               # TypeScript 타입 및 인터페이스
│   └── todo.ts          # Todo, Filter, Bucket 등 핵심 타입
├── utils/               # 순수 유틸리티 함수
│   ├── date.ts          # 날짜 포맷팅 및 오늘 여부 판별
│   └── confetti.ts      # 올클리어 파티클/애니메이션
├── styles/              # 전역 스타일 및 디자인 토큰
│   ├── variables.css    # 색상, 여백, 애니메이션 토큰
│   └── reset.css        # 브라우저 리셋 스타일
├── App.tsx              # 최상위 뷰 및 상태 바인딩
└── main.tsx             # 진입점
```

---

## 3. 데이터 모델 (Data Models)

`src/types/todo.ts`에 정의할 핵심 데이터 스키마입니다.

```typescript
export type BucketType = 'today' | 'someday';

export interface TodoItem {
  id: string;               // UUID 또는 고유 타임스탬프 기반 ID
  title: string;            // 할 일 내용
  completed: boolean;       // 완료 여부
  isFocus: boolean;         // Top 3 집중 항목 여부 (최대 3개)
  bucket: BucketType;       // 'today' (오늘) 또는 'someday' (나중에)
  createdAt: string;        // ISO 8601 생성 일시
  completedAt?: string;     // ISO 8601 완료 일시
  order: number;            // 수동 드래그 정렬 순서
}

export interface TodoStats {
  total: number;
  completed: number;
  progressPercent: number;  // 0 ~ 100
  isAllCleared: boolean;
}
```

---

## 4. 상태 관리 및 데이터 흐름 아키텍처

```text
[ User Action: Task 추가 / 완료 ]
            │
            ▼
     [ useTodos Hook ] ─── (비즈니스 로직 & 메모리 State 갱신)
            │
            ├─► [ storageService ] ──► [ LocalStorage 영구 저장 ]
            │
            └─► [ React Components ] ──► UI 리렌더링 + 마이크로 인터랙션 실행
```

### 4.1 아키텍처 핵심 원칙
1. **단일 진실 공급원 (Single Source of Truth):**
   * UI 컴포넌트는 상태를 직접 조작하지 않고, 오직 `useTodos` 훅이 제공하는 액션 핸들러(`addTodo`, `toggleTodo`, `deleteTodo`, `setFocusTodo`)만을 호출합니다.
2. **저장소 추상화 (Storage Decoupling):**
   * 컴포넌트나 훅에서 `localStorage.getItem`을 직접 부르지 않고, `storageService`를 경유합니다. 이를 통해 추후 IndexedDB나 클라우드 API(Supabase/Firebase)로 손쉽게 마이그레이션할 수 있습니다.
3. **낙관적 UI 및 빠른 반응성:**
   * 데이터 저장 대기 없이 즉각적으로 UI 상태가 업데이트되며, 완료 체크 시 햅틱/애니메이션이 지연 없이 발동합니다.
4. **불변성(Immutability) 보장:**
   * 모든 상태 업데이트는 순수 함수 형태로 불변 객체를 생성하여 사이드 이펙트를 방지합니다.
