# ANTIGRAVITY

## Goal

Build the product defined in `docs/specs/` as a frontend-only React application.

## Project Map

```text
.
├── docs/
│   ├── rules/          # Development constraints
│   ├── specs/          # Product requirements and acceptance criteria
│   └── development.md  # Development and verification workflow
├── public/             # Static public assets
├── src/
│   ├── assets/         # Imported assets
│   ├── components/     # Shared UI components
│   ├── layouts/        # Shared route layouts
│   ├── pages/          # Route-level page components
│   ├── routes/         # React Router configuration
│   ├── App.tsx
│   └── main.tsx
└── tests/              # Automated tests
```

`src/` may evolve as needed. Do not create directories or abstractions until they are useful.

## Routing Pattern

Use React Router.

- `pages/` contains route-level screens.
- `layouts/` contains shared route layouts.
- `routes/` contains route definitions and routing configuration.
- `components/` contains reusable UI, not route definitions.
- Prefer nested routes for shared layouts.
- Keep page-specific components close to their owning page when practical.

## Read First

Before implementation, read:

1. `docs/rules/general.md`
2. `docs/rules/frontend.md`
3. `docs/rules/design.md`
4. Relevant files in `docs/specs/`
5. `docs/development.md`

## Workflow

1. Read the relevant specs and acceptance criteria.
2. Inspect the existing code before modifying it.
3. Implement the smallest complete solution.
4. Run lint, build, and relevant tests.
5. Verify affected user flows with Playwright MCP.
6. Fix failures and regressions before completion.

## MCP

- **Notion**: product and planning context
- **Figma**: design source of truth
- **GitHub**: repository context and history
- **Playwright**: browser verification

Use MCPs only when relevant.

## Priority

When instructions conflict:

1. `docs/rules/`
2. `docs/specs/`
3. `docs/development.md`
4. Existing implementation
