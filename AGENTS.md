# AGENTS

## Project overview

This repository is a Vite + React + TypeScript app for a student productivity workspace that connects events, action plans, and Notion context.

Core product and acceptance requirements live in:
- [docs/specs/product.md](docs/specs/product.md)
- [docs/specs/acceptance.md](docs/specs/acceptance.md)
- [docs/rules/general.md](docs/rules/general.md)
- [docs/rules/frontend.md](docs/rules/frontend.md)
- [docs/development.md](docs/development.md)

## Working conventions

- Keep changes scoped to the requested task.
- Prefer the smallest valid fix over broad refactors.
- Maintain the existing app structure: routing in [src/routes/index.tsx](src/routes/index.tsx), page-level screens in [src/pages](src/pages), reusable UI in [src/components](src/components), and shared app state in [src/context/WorkspaceContext.tsx](src/context/WorkspaceContext.tsx).
- Use React Router for navigation; do not add manual URL parsing or custom routing logic.
- Keep state behavior aligned with the mocked localStorage-backed workspace. This project is a front-end prototype, not a backend service.
- Do not add unrelated dependencies, database code, or server-side functionality.
- Preserve the product principle that AI suggestions are editable and only become real tasks after explicit user confirmation.
- Remove dead code created by your change and avoid unnecessary abstractions.

## Validation

Before considering work complete, run:

```bash
npm run lint
npm run build
```

For UI behavior changes, verify the relevant user flow in the browser or with Playwright as described in [docs/development.md](docs/development.md).

## Practical guidance

- Event, action plan, and Notion context relationships are the core of the app; keep those connections visible and intentional.
- Prefer reusing existing context over creating new context.
- When implementing features, match the existing patterns used in the current context/provider-based state model instead of introducing a different architecture.
- If the user request is ambiguous, work from the product docs and acceptance criteria before making assumptions.
