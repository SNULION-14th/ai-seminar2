# User Flows

## Primary Flow: Event to Action

### 1. View Workspace

The user opens the workspace and sees:

- upcoming Google Calendar events
- current Google Tasks
- existing Event-Action relationships
- linked Notion context where available

### 2. Select Event

The user selects an event that requires preparation.

Example:

```text
Operating Systems Assignment 3
Due October 15
```

The user chooses `Prepare`.

### 3. Generate Action Plan

The system analyzes the event and proposes an Action Plan.

Example:

```text
□ Review assignment requirements
□ Implement solution
□ Test implementation
□ Write report
□ Submit assignment
```

### 4. Review Action Plan

Before anything is created externally, the user can:

- edit an Action
- add an Action
- remove an Action
- regenerate the plan

### 5. Resolve Notion Context

The system searches relevant Notion content.

For each relevant context, it proposes one of:

```text
LINK    → reuse an existing page
APPEND  → extend an existing page
CREATE  → create a new page
```

Existing useful context should be preferred.

### 6. Confirm

The user reviews the final plan and confirms it.

Only after confirmation may the system perform external write operations.

### 7. Create Actions and Context

The system:

- creates approved Actions in Google Tasks
- preserves their relationship to the source Event
- links existing Notion pages when appropriate
- appends workspace content when approved
- creates new Notion pages when necessary

### 8. Execute

The user continues working through their existing tools.

The workspace continues to expose:

```text
Event
  ↓
Action
  ↓
Context
```

---

## No-Preparation Flow

Not every event needs an Action Plan.

Example:

```text
Lunch with friend
12:30 PM
```

If meaningful preparation is unnecessary, the system may indicate that no Action Plan is needed.

No Tasks or Notion pages should be created automatically.

---

## Event Management

The user can:

```text
View Event
Create Event
Edit Event
Delete Event
```

Changes are reflected in Google Calendar.

---

## Task Management

The user can:

```text
View Task
Create Task
Edit Task
Complete Task
Delete Task
```

Changes are reflected in Google Tasks.

When a Task originated from an Event, its Event relationship should remain visible.

---

## Context Access

From an Action with linked Notion context, the user can access the associated page without manually searching for it again.

---

## Navigation

Use React Router for page-level navigation.

The route structure should remain minimal and reflect actual user flows rather than reproducing the navigation structure of Google Calendar, Google Tasks, or Notion.

Exact route paths may be defined during implementation based on the approved Figma design.
