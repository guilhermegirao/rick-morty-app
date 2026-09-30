# Rick and Morty Frontend

The frontend is a Next.js episode explorer for the Rick and Morty BFF. It renders an episode and its normalized character collection, supports cast search, preserves the visible episode during navigation, and keeps episode/search state in the URL.

## Stack

- Next.js 16 App Router with React 19 and TypeScript
- Tailwind CSS 4 for utilities and design tokens
- shadcn-generated Button and Input primitives
- TanStack Query for client-side episode caching and request state
- Zod for environment and runtime API response validation
- Next Image for optimized remote character portraits
- ESLint with `eslint-config-next`

## Requirements

- Node.js compatible with the repository toolchain
- npm
- The backend running at `http://localhost:3000`

## Setup

```bash
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

On macOS/Linux, use `cp .env.example .env.local` instead of `Copy-Item`.

Open the URL printed by Next.js. If port `3000` is already used by the backend, Next.js normally selects another port such as `3001`.

## Environment

`.env.example` contains the local default:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` to the deployed BFF origin when the backend is not local. This value is intentionally public because it is used by browser-side episode navigation.

## Commands

```bash
npm run dev       # development server
npm run lint      # ESLint
npm run build     # production build and type checking
npm run start     # serve the production build
```

## Architecture

The frontend uses a server/client split:

1. `src/app/page.tsx` reads `?episode=` and `?q=` from the request URL and fetches the initial episode on the server.
2. `src/modules/episodes/episode-explorer.tsx` owns client interaction state and composes the episode feature.
3. TanStack Query fetches later episode IDs, caches responses, and keeps previous data visible as optimistic placeholder content while a new request is pending.
4. `src/modules/episodes/lib/episodes.ts` is the BFF adapter. It builds the endpoint URL, maps HTTP failures to user-facing errors, and validates the response with Zod.
5. Episode presentation is split into focused components for the header, controls, character grid, character card, status badge, and loading skeleton.
6. `src/components/ui` contains shared shadcn primitives. `src/lib` contains shared environment and class-name utilities.

## URL State

The explorer uses these query parameters:

- `episode`: a positive integer requested from the BFF
- `q`: an optional cast search query

Examples:

```text
/?episode=28
/?episode=28&q=rick
```

The browser URL is updated with `history.replaceState` during client interaction, avoiding a full navigation for each search keystroke. Direct requests still receive server-rendered initial data.

## Loading, Errors, and Accessibility

- The route-level skeleton mirrors the final page structure while the initial BFF request is pending.
- Later episode requests keep the previous episode visible and expose loading state through the controls and an `aria-live` announcement.
- BFF 404 messages are shown to the user instead of being hidden behind a generic error.
- Empty search results and episodes with no character records have separate messages.
- Character statuses are visible badges with text, not color alone.
- The first visible portrait uses eager loading and priority for LCP; later portraits are lazy-loaded.
- Focus states and reduced-motion variants are included in the Tailwind/shadcn primitives.

## Design System

The visual language is a compact field archive rather than a generic marketing page. Semantic tokens are defined in `src/app/globals.css` and exposed to Tailwind as names such as `bg-paper`, `text-ink`, `border-line`, `text-signal`, and `bg-surface`.

Feature markup uses canonical Tailwind utilities. Components should not introduce arbitrary literal colors or pixel measurements. Add new colors to the token layer first, then consume the semantic utility in the feature.

`components.json` configures the official shadcn CLI:

```bash
npx shadcn@latest add <component>
```

## Testing and Validation

There is currently no frontend test runner in the package. Every frontend change should run:

```bash
npm run lint
npm run build
```

The highest-value future test seam is the public `EpisodeExplorer` interaction boundary with the BFF adapter mocked. Tests should cover episode selection, URL state, search, loading, errors, empty states, status badges, and accessibility announcements without asserting implementation details or CSS class strings.

## Deployment Notes

The frontend can be deployed as a Next.js application. Set `NEXT_PUBLIC_API_URL` to the public BFF URL at build/runtime configuration time, allow the frontend origin in the backend CORS configuration, and ensure the BFF response image host remains allowed by `next.config.ts`.

See the frontend implementation spec at `docs/specs/frontend-implementation.md` for the full user stories, decisions, testing seam, and out-of-scope boundaries.
