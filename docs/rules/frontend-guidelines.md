# 📐 Frontend Development Guidelines & Rules

> **목적**: FocusFlow 프로젝트의 코드 품질, UI/UX 일관성, 생산성을 보장하기 위한 프론트엔드 개발 가이드라인입니다.

---

## 1. 기술 스택 & 환경
- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite
- **Icons**: `lucide-react`
- **Linting**: ESLint (TypeScript ESLint)

---

## 2. 코드 스타일 & 컴포넌트 원칙

### 2.1 컴포넌트 설계
- **단일 책임 원칙 (SRP)**: 각 컴포넌트는 하나의 명확한 UI 및 역할을 담당합니다.
- **파일명 컨벤션**: PascalCase (`TodoItem.tsx`, `FocusCard.tsx`, `ProgressBar.tsx`)
- **타입 정의**: 인터페이스 및 타입은 `src/types/`에 집중하거나 해당 컴포넌트 파일 상단에 명시합니다.

### 2.2 상태 관리 (State Management)
- **Local First**: 간단한 상태는 `useState`, 파생 상태는 `useMemo` 활용.
- **영속성**: 사용자 데이터는 기본적으로 `localStorage`를 통해 영속화하며, 커스텀 훅(`useLocalStorage` 등)으로 캡슐화합니다.

### 2.3 UI/UX 및 인터랙션 규칙
- **Zero-Friction**: 입력 후 즉시 포커스 유지, 로딩/딜레이 없는 즉각적인 UI 반영.
- **반응형(Responsive)**: 모바일(360px~)부터 데스크톱까지 자연스럽게 늘어나는 유연한 레이아웃.
- **접근성(a11y)**: 체크박스 및 버튼에 명확한 `aria-label` 및 키보드 네비게이션(`tabindex`, `onKeyDown`) 지원.
