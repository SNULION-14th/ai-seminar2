# Acceptance Criteria

## Workspace

- [ ] Upcoming Google Calendar events are visible.
- [ ] Google Tasks are visible.
- [ ] Event-Action relationships are understandable from the UI.
- [ ] Linked Notion context is accessible from relevant Actions.
- [ ] The workspace does not require users to manage duplicate project structures.

## Calendar

- [ ] Users can view events.
- [ ] Users can create an event.
- [ ] Users can edit an event.
- [ ] Users can delete an event.
- [ ] Calendar changes are reflected in the workspace.

## Tasks

- [ ] Users can view tasks.
- [ ] Users can create a task.
- [ ] Users can edit a task.
- [ ] Users can complete a task.
- [ ] Users can delete a task.
- [ ] Generated Actions retain their relationship to the source Event.

## Action Plan

- [ ] A user can select an Event and start preparation.
- [ ] The system can generate an Action Plan from the Event.
- [ ] Generated Actions are presented for review before creation.
- [ ] Users can edit generated Actions.
- [ ] Users can add Actions.
- [ ] Users can remove Actions.
- [ ] Users can regenerate the plan.
- [ ] Invalid generated output is not committed as Tasks.
- [ ] No Google Tasks are created before explicit user confirmation.
- [ ] The system can represent that an Event requires no preparation.

## Notion Context

- [ ] The system can search for relevant existing Notion pages.
- [ ] Existing useful context can be linked with `LINK`.
- [ ] Existing context can be extended with `APPEND`.
- [ ] New context can be created with `CREATE`.
- [ ] Existing relevant pages are preferred over unnecessary page creation.
- [ ] Users can review context-related changes before consequential external writes.
- [ ] Actions can expose their linked Notion context.

## Core Flow

The following flow must be completable:

```text
View Event
→ Prepare
→ Generate Action Plan
→ Review Actions
→ Resolve Notion Context
→ Confirm
→ Create Tasks / Context
→ View Event-Action-Context relationship
```

## Safety and Control

- [ ] AI suggestions remain editable.
- [ ] External write operations require user confirmation.
- [ ] The system does not perform unrelated bulk operations.
- [ ] Failure in an external integration is surfaced clearly rather than silently ignored.

## Visual

- [ ] Key screens follow the approved Figma design.
- [ ] Event, Action, and Context have clear visual relationships.
- [ ] Primary actions are distinguishable from secondary actions.
- [ ] Required layouts remain usable at supported viewport sizes.

## Technical

- [ ] Navigation uses React Router.
- [ ] The application loads without blocking runtime errors.
- [ ] Critical user flows can be verified through Playwright.
- [ ] No blocking browser console errors occur during critical flows.
- [ ] Lint checks pass.
- [ ] Production build succeeds.
