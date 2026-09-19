# [Design Prompt] Magic Patterns AI 전용 UI/UX 디자인 프롬프트

이 문서는 **Magic Patterns**, **v0**, **Galileo AI** 등의 생성형 UI 툴에 바로 입력하여 고품질의 완성도 높은 프로토타입을 얻을 수 있도록 최적화된 프롬프트 사양서입니다.

---

## 📋 Magic Patterns 복사 & 붙여넣기용 마스터 프롬프트 (English Master Prompt)

> **💡 사용법:** 아래 코드 블록 전체를 복사하여 Magic Patterns 입력창에 그대로 붙여넣으세요. (AI UI 모델은 영문 지시문에서 레이아웃, 간격, 컴포넌트 계층을 가장 정확하게 인식합니다.)

```markdown
Design a modern, ultra-minimalist, mobile-first Todo List web application called "FocusFlow".
The aesthetic should be inspired by Linear, Things 3, and Apple Reminders: high clarity, subtle borders, soft shadows, rounded corners, and zero visual clutter.

### 1. Visual Style & Theme
- **Color Palette:**
  - Background: Clean off-white (`#F8FAFC` / `bg-slate-50`) with pure white component cards (`#FFFFFF`).
  - Primary Accent: Deep Indigo / Violet (`#4F46E5` / `bg-indigo-600`) for active highlights & progress bars.
  - Text: Dark Charcoal (`#0F172A` / `text-slate-900`) for headers, Muted Slate (`#64748B` / `text-slate-500`) for secondary text.
  - Success/Accent: Subtle Emerald (`#10B981`) for completed tasks.
- **Typography & Geometry:**
  - Clean sans-serif (Inter or SF Pro Display style).
  - Cards: `rounded-2xl`, borders with `border border-slate-200/70`, soft elevated shadow (`shadow-sm`).
  - Mobile Container: Centered viewport preview (max-w-md, approx 420px width), mimicking an iOS/Web mobile screen.

### 2. Screen Layout & Component Hierarchy

#### Header Section (Top)
- **Top Bar:**
  - Left: Small current date ("Saturday, Sep 19") & Friendly greeting ("One step at a time.").
  - Right: Clean minimalist icon buttons (Streak counter with fire icon "🔥 4", Settings gear icon, and Night Cleanup moon icon).
- **Daily Progress Bar Card:**
  - Sleek linear progress bar with rounded ends.
  - Progress label: "2 of 3 Focus tasks done (66%)".
  - Subtle gradient fill on the active progress track (`from-indigo-500 to-indigo-600`).

#### 🎯 Top 3 Focus Section (Hero Component)
- **Section Header:**
  - Badge with icon: "🎯 TODAY'S FOCUS" (badge style: `bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full`).
  - Small helper text: "Max 3 critical items for maximum clarity".
- **Focus Task Cards (3 Items):**
  - Slightly larger padding and prominent font than ordinary tasks.
  - Item 1 (Completed state): Custom circular checkbox checked (emerald fill with white checkmark), strikethrough text with light opacity, subtle completion timestamp ("Completed 11:20 AM").
  - Item 2 (Active state): Empty circular checkbox with hover state, crisp text: "Draft quarterly product proposal", a small drag handle icon (`:::`) on the right.
  - Item 3 (Active state): Empty circular checkbox, crisp text: "Team sprint sync at 2:00 PM".

#### 📋 Secondary Section: Other Tasks (Collapsible/Scrollable)
- **Section Header:**
  - Text: "Other Tasks" with item count badge ("2").
- **Task Items (2 Items):**
  - Item 1: "Submit expense report" (checkbox unchecked).
  - Item 2: "Reply to client emails" (checkbox unchecked).
  - Each item supports swipe indicators or quick action buttons (Pin to Focus, Move to Someday, Delete).

#### ⚡ Floating Quick-Capture Input Bar (Fixed Bottom)
- Bottom-docked floating card with backdrop blur (`bg-white/90 backdrop-blur-md shadow-lg border border-slate-200/80 rounded-2xl mx-4 mb-6 p-2`).
- Integrated input field: "+ Add a task for today... (Press Enter to add)".
- Right side quick toggles:
  - "Pin to Focus" star/target icon toggle.
  - High-contrast rounded submit arrow button (`bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl`).

### 3. Interactive State Preview (Included as a side component or modal overlay)
- **"Evening Clean-up" Bottom Sheet / Modal:**
  - A gentle card titled "Evening Wrap-up 🌙"
  - Message: "You have 1 unfinished task from today. How would you like to handle it?"
  - Two clean action buttons:
    - Primary: "Roll over to Tomorrow"
    - Secondary: "Move to Someday Backlog"
```

---

## 🎨 한국어 UI 카피라이팅 가이드 (Magic Patterns 커스텀 텍스트용)

Magic Patterns에서 생성된 UI의 텍스트를 한국어로 변경하거나, 한국어 텍스트로 생성을 유도할 때 사용할 텍스트 세트입니다.

| 영역 (Section) | 컴포넌트 | 추천 한국어 텍스트 (Microcopy) |
| :--- | :--- | :--- |
| **Header** | 날짜 및 인사말 | `9월 19일 토요일` / `오늘도 차근차근, 세 가지만 끝내봐요.` |
| **Progress** | 진행률 표시 | `오늘의 집중 목표: 3개 중 2개 완료 (66%)` |
| **Top 3 Focus** | 섹션 배지 & 안내 | `🎯 오늘의 핵심 3가지` / `가장 중요한 일에만 몰입하세요` |
| **Top 3 Focus** | 태스크 예시 1 (완료) | `[v] 2026 로드맵 초안 작성 (완료)` |
| **Top 3 Focus** | 태스크 예시 2 (진행) | `[ ] 14:00 팀 싱크 미팅 준비` |
| **Top 3 Focus** | 태스크 예시 3 (진행) | `[ ] 운동 30분 달리기` |
| **Other Tasks** | 일반 할 일 목록 | `📋 기타 할 일` / `영수증 경비 처리`, `메일 회신 3건` |
| **Bottom Input** | 인풋 플레이스홀더 | `+ 오늘 끝낼 일을 입력하세요... (Enter)` |
| **Night Cleanup** | 밤 정리 모달 | `오늘 하루도 수고 많았어요 🌙 미완료된 1개의 할 일을 내일로 미룰까요?` |

---

## 💡 Magic Patterns 프롬프트 전달 시 팁 (Best Practices)
1. **모바일 뷰 고정:** 프롬프트에 `max-w-md` 또는 `mobile viewport (iOS style)`를 명시해야 데스크톱 와이드 화면 대신 모바일 프로토타입 형태로 깔끔하게 렌더링됩니다.
2. **라이트 모드 우선 생성:** 첫 생성 시에는 `Clean White/Slate Theme`로 형태를 잡은 뒤, 추가 프롬프트로 `Create a Dark Mode variation using deep zinc (#09090b)`를 입력하면 다크모드 대응이 수월합니다.
3. **인터랙션 분리:** 메인 화면 생성 후 "Now create the Evening Clean-up popup dialog for this screen"을 별도 요청하면 모달 디자인을 완성도 높게 얻을 수 있습니다.
