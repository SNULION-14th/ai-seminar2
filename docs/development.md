# Development

## Setup

```bash
npm install
npm run dev
```

## Validation

Before completing a task, run the available project checks:

```bash
npm run lint
npm run build
```

Run relevant automated tests when available.

## Browser Verification

Use Playwright MCP for affected user flows.

Verify:

- navigation
- interactions
- expected UI states
- relevant viewport behavior
- browser console errors

Do not treat implementation alone as completion.

## Test Strategy

Use the smallest appropriate test level:

Unit tests for isolated logic.
Integration tests for component behavior.
Playwright for critical user flows and browser behavior.

Tests should verify behavior, not implementation details.
