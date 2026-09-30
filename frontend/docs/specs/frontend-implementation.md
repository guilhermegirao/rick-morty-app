# Frontend Episode Explorer

## Problem Statement

The Rick and Morty BFF exposes a lean episode-characters contract, but the frontend needs a focused interface that lets people identify an episode, inspect its cast, search character information, and understand loading, empty, and failure states. The current frontend must present the BFF data as a usable episode explorer rather than a starter page or a generic marketing hero.

## Solution

Build a responsive Next.js episode explorer around the existing `GET /episodes/:id/characters` BFF endpoint. Render the selected episode name as the page title, show episode metadata and character cards, allow users to jump to valid episode IDs, and filter the loaded cast by name, species, or origin.

Use a server-rendered initial episode request and a client-side TanStack Query cache for subsequent episode requests. Validate the public environment and BFF response with Zod. Use shadcn-generated primitives and Tailwind semantic design tokens for the visual system. Keep the visual language subject-specific: an editorial field archive for cataloguing strange characters, with restrained motion and clear information hierarchy.

## User Stories

1. As an episode explorer user, I want the selected episode name to be the page title, so that I immediately know which episode I am viewing.
2. As an episode explorer user, I want to see the episode code, air date, and cast count, so that I can understand the episode context without another request.
3. As an episode explorer user, I want to enter an episode number from 1 to 51, so that I can jump directly to a known episode.
4. As an episode explorer user, I want invalid episode numbers rejected with a clear message, so that I know how to correct the request.
5. As an episode explorer user, I want the active episode request to show a loading state, so that I understand the interface is working.
6. As an episode explorer user, I want the previous episode content preserved while another episode loads, so that the page does not flash unrelated content.
7. As an episode explorer user, I want episode requests cached in the browser, so that revisiting an episode avoids unnecessary network work.
8. As an episode explorer user, I want a clear error state when the BFF is unavailable, so that I know the request failed and can retry it.
9. As an episode explorer user, I want to search the loaded cast by name, so that I can find a character quickly.
10. As an episode explorer user, I want to search by species or origin, so that I can discover characters without knowing their name.
11. As an episode explorer user, I want an empty search result to explain what happened and offer a clear-search action, so that I can recover without reloading the page.
12. As an episode explorer user, I want an episode with no character records to have a distinct empty state, so that it is not confused with a failed search.
13. As an episode explorer user, I want each character card to show a portrait, name, status, species, origin, and last known location, so that the cast is scannable.
14. As an episode explorer user, I want character status communicated in a way that is available to assistive technology, so that color is not the only status signal.
15. As a keyboard user, I want visible focus states on inputs and buttons, so that I can understand where I am in the interface.
16. As a screen-reader user, I want loading, result-count, and error announcements, so that asynchronous changes are understandable without visual context.
17. As a mobile user, I want the episode controls and character grid to adapt to a narrow viewport, so that the explorer remains usable on a phone.
18. As a desktop user, I want the cast arranged in a dense responsive grid, so that I can compare characters efficiently.
19. As a user sensitive to motion, I want decorative transitions reduced when my system requests reduced motion, so that the interface remains comfortable.
20. As a deployment operator, I want the BFF URL configured through the frontend environment, so that the frontend can target different backend hosts without code changes.
21. As a maintainer, I want API payloads validated at runtime, so that malformed BFF responses fail clearly instead of corrupting the UI.
22. As a maintainer, I want reusable shadcn primitives and semantic Tailwind tokens, so that future frontend components share one design system.
23. As a maintainer, I want the initial page request to remain compatible with Next.js server rendering, so that the first view is useful without waiting for client JavaScript.
24. As a maintainer, I want frontend lint and production build checks to pass, so that the interface remains deployable after visual or interaction changes.

## Implementation Decisions

- The episode explorer is the primary frontend experience; the starter Next.js page is replaced by the episode workflow.
- The existing BFF endpoint remains the only backend contract used by the frontend: `GET /episodes/:id/characters`.
- The initial episode is fetched by the server-rendered route and passed into the client explorer as initial data.
- TanStack Query owns subsequent episode requests, query keys, stale-time behavior, loading state, error state, and cached episode data.
- Zod validates `NEXT_PUBLIC_API_URL` and the complete public episode-character response before presentation.
- The frontend accepts episode IDs from 1 through 51, matching the current Rick and Morty episode range used by the BFF workflow.
- Episode search filters only the currently loaded character collection and matches character name, species, and origin case-insensitively.
- Character status has both a semantic visual token and an accessible label; status color is not the sole user-facing signal.
- Loading and route error boundaries are explicit frontend states rather than generic framework failures.
- The component system uses official shadcn-generated Button and Input primitives, `class-variance-authority`, `tailwind-merge`, and semantic Tailwind tokens.
- Visual values are centralized as design-system tokens; feature markup uses canonical Tailwind utilities instead of arbitrary hardcoded colors or pixel values.
- The visual direction is a cool field-archive interface with a restrained cobalt and amber signal palette, episode title as the main visual anchor, and compact character records.
- The interface avoids a generic marketing hero, decorative gradient blobs, excessive card nesting, and all-caps template chrome.
- Motion is limited to character image interaction and respects reduced-motion preferences.
- The backend must allow the frontend origin through its configurable CORS policy.

## Testing Decisions

- The primary seam is the `EpisodeExplorer` user interaction boundary with the BFF client mocked. Tests should observe rendered episode data, episode selection, validation, filtering, loading, error, empty, and accessibility behavior through the public UI.
- Tests must verify external behavior rather than component implementation details, private state, query internals, or CSS class composition.
- The frontend test seam should use known episode and character fixtures independent of the implementation’s filtering expression.
- The backend episode service and BFF contract already have unit and e2e coverage; frontend tests should treat that API response as the integration boundary rather than duplicate backend orchestration tests.
- Existing project validation remains part of the change workflow: frontend lint and production build, plus backend lint/build when CORS or the public contract changes.
- A browser-level smoke test may be added later if the repository adopts a browser test runner; it is not required to introduce a second seam for this first frontend spec.
