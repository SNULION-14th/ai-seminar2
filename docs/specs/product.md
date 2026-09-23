# Product Specification

## Product

A personal Event-to-Action workspace for university students who already use tools such as Google Calendar, Google Tasks, and Notion.

The product connects three layers of personal productivity:

```text
Event → Action → Context
```

- **Event**: what is happening and when
- **Action**: what the user needs to do
- **Context**: the information and workspace needed to do it

The product does not replace existing productivity tools. It orchestrates them into a single workflow.

## Target User

University students who:

- already use Google Calendar to manage schedules and deadlines
- use Notion to organize coursework, projects, or personal notes
- use or are willing to use Google Tasks for actionable tasks
- manage multiple academic and personal commitments
- manually translate deadlines into task plans
- frequently switch between tools to find relevant context

The primary problem is not lack of productivity tools, but the manual work required to connect them.

## Core Problem

A calendar event tells the user **what happens and when**, but not **what needs to be done next**.

Even after tasks are created, the context required to perform them often remains elsewhere.

Example:

```text
Operating Systems Assignment 3
October 15

        ↓

Review requirements
Implement solution
Test implementation
Write report
Submit

        ↓

Notion:
Operating Systems / Assignment 3
```

Users currently perform these transformations and connections manually.

## Core Value

Transform:

> "I know something needs to be done."

into:

> "I know what to do and can start immediately."

The system achieves this by converting important events into reviewed Action Plans and connecting each Action with relevant Notion context.

## Core Features

### Event Workspace

Integrate Google Calendar events into the workspace.

Users can:

- view events
- create events
- edit events
- delete events
- select an event for preparation

### Task Workspace

Integrate Google Tasks into the workspace.

Users can:

- view tasks
- create tasks
- edit tasks
- complete tasks
- delete tasks

Tasks generated from an event should preserve their relationship to that event.

### AI Action Decomposition

For events that require preparation, AI generates an editable Action Plan.

Example:

```text
Event
Operating Systems Assignment 3

Action Plan
□ Review assignment requirements
□ Implement solution
□ Test implementation
□ Write report
□ Submit assignment
```

Before committing the plan, the user can:

- edit Actions
- add Actions
- remove Actions
- regenerate the plan

No external tasks are created until the user confirms the plan.

Not every event requires decomposition. The system may indicate that no preparation is necessary.

### Notion Context

Actions can be connected to relevant Notion context.

The system supports three strategies:

#### LINK

Use an existing relevant Notion page.

#### APPEND

Add an appropriate workspace or section to an existing relevant page.

#### CREATE

Create a new page when no suitable context exists.

Prefer reusing existing context over creating unnecessary pages.

### Event-Action-Context Relationship

The workspace should make the relationship visible:

```text
Event
  └─ Action
       └─ Notion Context
```

A user should be able to understand:

1. What is coming up?
2. What do I need to do?
3. Where is the context needed to do it?

## Integrations

- **Google Calendar**: Event source and management
- **Google Tasks**: Action execution
- **Notion**: Context and work records
- **AI**: Event decomposition and context decisions

## Design Reference

Figma:

`[FIGMA_LINK]`

The approved Figma design is the visual source of truth.

## MVP Scope

### In Scope

- Google Calendar event CRUD
- Google Tasks task CRUD and completion
- Event-to-Action Plan generation
- Action Plan editing and regeneration
- Explicit user confirmation before task creation
- Structured validation of generated Actions
- Notion page search
- LINK existing Notion context
- APPEND to existing Notion context
- CREATE new Notion context
- Event-Action-Context relationships
- Unified Event and Task workspace

### Out of Scope

- complex project management
- team collaboration
- productivity scoring or analytics
- habit tracking
- email management
- autonomous schedule management
- bulk external actions without explicit user approval
- replacing Google Calendar, Google Tasks, or Notion

## Product Principles

- Existing tools remain the systems of record.
- AI proposes; the user confirms.
- Preparation should require minimal interaction.
- Reuse existing context before creating new context.
- Keep the workspace focused on Events, Actions, and Context.
- Do not add productivity features unrelated to the core workflow.
