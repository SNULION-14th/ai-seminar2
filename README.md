# StudyinHogwart

StudyinHogwart is a Hogwarts-academic-life-inspired productivity planner that combines date-based assignments, a lightweight timetable, and Pomodoro study sessions. The visual system uses Great Hall depth, parchment information surfaces, ink typography, brass controls, candlelight, and house-colour personalisation without using film imagery or official crests.

## Features

- local mock authentication: sign up, login, logout, and recovery confirmation
- clickable Student Record with house, year, subjects, weekly stats, and Library Card number
- monthly assignment calendar with subject markers, subject creation, priorities, due times, and CRUD
- anti-farming House Points awards: `+5` once per assignment and `+10` per completed study session
- seven-day timetable with schedule creation, editing, deletion, and Today navigation
- Study/Break Pomodoro with Start, Pause, Resume, Reset, End Session, stable digits, and ambient motion
- separate localStorage persistence for auth, profile, subjects, assignments, schedules, study stats, and House Points
- responsive layouts for desktop, tablet, and mobile, including reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

## Validation

```bash
npm run build
npm run lint
```

## Design source

[StudyinHogwart Figma design](https://www.figma.com/design/je5JgeCa8sDRAmMOErweG8/Hogwarts-Focus-%E2%80%94-Pomodoro---Todo?node-id=11-3714&m=dev)
