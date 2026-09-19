# 개발 규칙 및 코딩 표준 (Coding Standards)

> 본 문서는 프로젝트의 코드 일관성, 유지보수성, 그리고 확장성을 유지하기 위한 기술 규칙입니다.

---

## 1. 기술 스택 원칙
* **Framework**: React 19 + TypeScript (Strict mode)
* **Build Tool**: Vite
* **Icons**: `lucide-react`
* **Styling**: 모던 CSS (CSS Variables, Flexbox/Grid, Glassmorphism, 모던 반응형 레이아웃)

---

## 2. 컴포넌트 & 코드 컨벤션
1. **함수형 컴포넌트**: 모든 컴포넌트는 TypeScript 함수형 컴포넌트로 작성합니다.
2. **타입 안전성**:
   * `any` 타입 사용을 금지하며, 인터페이스/타입 별칭은 명확히 분리합니다 (예: `TodoItem`, `TodoFilter`).
3. **상태 관리**:
   * 컴포넌트 내부 상태와 비즈니스 로직(로컬스토리지 저장, 필터링 등)은 가급적 Custom Hook(`useTodos` 등)으로 분리합니다.
4. **접근성 및 키보드 내비게이션**:
   * 버튼 및 인풋 요소에 적절한 `aria-label` 및 키보드 인터랙션(`Enter`, `Escape`)을 지원합니다.
5. **네이밍 규칙**:
   * 컴포넌트 파일: PascalCase (예: `TodoInput.tsx`, `TodoList.tsx`)
   * 훅 파일: camelCase (예: `useTodos.ts`)
   * 상수: UPPER_SNAKE_CASE
