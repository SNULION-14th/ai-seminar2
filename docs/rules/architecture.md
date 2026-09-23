# 🏛️ Architecture & Coding Rules

## 1. 기술 스택 & 개발 환경
- **프레임워크**: React 19 (TypeScript)
- **번들러**: Vite
- **상태 관리**: React 내장 훅 (`useState`, `useMemo`, `useCallback`)
- **스타일링**: Pure CSS / Modern CSS Modules / Tailwind (외부 복잡한 UI 라이브러리 지양)

---

## 2. 컴포넌트 설계 및 상태 관리 원칙
1. **단일 진실 공급원 (Single Source of Truth)**:
   - 전체 시간표의 득표 상태(`votes`)와 내 선택 상태(`mySelected`)는 최상위 `App.tsx`에서 중앙 집중식으로 관리합니다.
   - 1등 시간대 계산과 같은 파생 데이터는 별도 상태로 만들지 않고 `useMemo`로 연산합니다.
2. **단방향 데이터 흐름**:
   - 하위 컴포넌트(`TimeGrid`, `TimeSlotCell`, `Header`, `BestSlotBanner`)는 Props와 Event Handler 콜백을 통해서만 상태와 상호작용합니다.
3. **엄격한 타입 정의 (Strict Typing)**:
   - `any` 타입을 절대 사용하지 않으며, 슬롯 데이터, Props 인터페이스를 명확하게 정의합니다.
