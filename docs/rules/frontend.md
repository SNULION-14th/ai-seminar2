# Frontend Rules

## Stack

- React
- TypeScript
- Vite
- React Router
- npm

## Routing

Use React Router for application navigation.

- Define pages as route-level components.
- Use nested routes and layouts when UI is shared.
- Use `<Link>` / `<NavLink>` for internal navigation.
- Use `useNavigate` only for programmatic navigation.
- Keep route paths centralized and predictable.
- Do not implement manual routing with URL or pathname checks.

Prefer:

src/
components/
layouts/
pages/
routes/

Allow the structure to evolve when required by the implementation.

## Components

- Keep page-specific logic in pages or their feature components.
- Extract reusable UI only when reuse is real.
- Prefer composition over large monolithic components.
- Keep TypeScript types explicit where they improve safety.
