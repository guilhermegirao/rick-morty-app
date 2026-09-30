# Frontend Episode Explorer Testing

## Problem Statement

The frontend episode explorer now has meaningful interaction behavior, but it previously had no automated frontend test runner. Episode selection, optimistic loading, URL state, cast filtering, status badges, validation, and BFF error presentation could regress without a test that observes the user-facing contract.

The test suite should add confidence at the highest useful seam without coupling tests to Tailwind classes, private React state, TanStack Query internals, or individual component implementation details.

## Solution

Add a Vitest test environment using jsdom and Testing Library. Test the public `EpisodeExplorer` interaction boundary with the BFF episode data client mocked. Use deterministic episode and character fixtures and a real TanStack Query provider configured for test isolation.

Cover the core user workflow: render an episode, inspect normalized character fields and status badges, search the cast, synchronize URL state, validate an episode ID, preserve previous content during an optimistic request, and show an upstream not-found error.

Keep browser-level testing separate from this first component suite. Add Playwright only when the repository needs to verify a running Next.js server, image loading, route-level loading boundaries, or full keyboard/mobile workflows.

## User Stories

1. As a maintainer, I want the frontend test command to run in the frontend package, so that I can validate the episode explorer without starting the backend.
2. As a maintainer, I want tests to run in jsdom, so that component interactions can be observed without requiring a browser process.
3. As an episode explorer user, I want the selected episode title and metadata rendered, so that the first test protects the primary page contract.
4. As an episode explorer user, I want character name, status, location, and episode count visible, so that normalized BFF fields remain represented.
5. As an episode explorer user, I want Alive, Dead, and unknown status values represented by accessible badges, so that status presentation does not depend on color alone.
6. As an episode explorer user, I want cast search to match character fields, so that the filtering workflow remains useful.
7. As an episode explorer user, I want the search query reflected in the URL, so that filtered views can be restored or shared.
8. As an episode explorer user, I want an initial query to filter the first render, so that a URL-loaded filtered view behaves like an interactive search.
9. As an episode explorer user, I want non-positive episode IDs rejected locally, so that invalid input does not cause a BFF request.
10. As an episode explorer user, I want positive IDs beyond the previous catalogue range accepted, so that the frontend does not impose an artificial upper bound.
11. As an episode explorer user, I want the current episode to remain visible while another episode loads, so that navigation does not flash unrelated fallback content.
12. As an episode explorer user, I want loading state exposed through the page state, so that asynchronous navigation is understandable.
13. As an episode explorer user, I want a BFF not-found message displayed, so that I know the requested episode does not exist.
14. As a maintainer, I want mocked API fixtures independent from the filter implementation, so that tests can detect incorrect filtering logic.
15. As a maintainer, I want tests to use accessible roles and names, so that the suite reinforces accessible user interaction.
16. As a maintainer, I want test cleanup between cases, so that URL state, query caches, and DOM nodes cannot leak between tests.
17. As a maintainer, I want the test setup to share the project TypeScript alias, so that tests import the same modules as production code.
18. As a maintainer, I want lint and production build to continue passing with tests present, so that test-only dependencies do not destabilize the application.
19. As a maintainer, I want future browser tests to have a clear boundary, so that component tests are not overloaded with deployment concerns.

## Implementation Decisions

- Vitest 4 is used because it is compatible with the frontend’s current Node typings and is already used by the backend repository.
- jsdom provides the DOM runtime for component tests.
- Testing Library React provides public rendering and query APIs; Testing Library User Event models real interactions such as typing and clicking.
- The primary seam is the exported `EpisodeExplorer` component wrapped in a real `QueryClientProvider`.
- The episode data client is mocked at the feature data-access boundary. Tests do not mock TanStack Query or the feature’s child components.
- Next Image and Next Link are replaced with small test doubles because the tests observe episode behavior, not Next’s image optimizer or routing implementation.
- Test QueryClient instances disable retries and use infinite stale time for deterministic initial fixture rendering. Each test receives a new client.
- The URL is reset after every test using the existing DOM cleanup setup.
- Fixtures include two characters with independent values for name, species, gender, origin, location, status, and episode count. This prevents assertions from reproducing the filtering implementation.
- Positive episode IDs are not capped in the test contract. A fixture with ID `99` verifies that an ID above the former range is requested and rendered.
- Error assertions verify user-visible message content through the alert role, not thrown implementation errors or query cache state.
- Loading assertions verify previous content remains visible, the main region is busy, and the URL reflects the requested episode.
- The test command is `vitest run`; watch mode is available through `vitest`.
- The Vitest config uses an ESM `.mts` extension, jsdom, the `@` alias mapped to `src`, a shared setup file, and `src/**/*.test.{ts,tsx}` discovery.

## Testing Decisions

- A good test describes a user-observable capability and survives a component refactor. It should query by role, accessible name, or meaningful text and avoid asserting CSS class names or private state.
- The first test layer is the `EpisodeExplorer` interaction seam because it covers the highest-value workflow with less cost and flakiness than a full browser server.
- The current suite covers initial rendering, normalized fields, status badges, cast filtering, search URL state, initial query state, positive-ID validation, optimistic loading, URL episode state, and BFF not-found errors.
- Tests should be added at the same seam for future behaviors such as retry actions, search clearing, empty episodes, and accessibility announcements.
- The route-level skeleton and error boundary should receive browser or route-render tests if those states become regressions that cannot be observed through `EpisodeExplorer`.
- Playwright is intentionally deferred. It is appropriate for verifying the production Next.js server, route-level `loading.tsx`, real image behavior, responsive layouts, keyboard navigation, and CORS integration, but it adds browser installation and server orchestration cost.
- Backend tests remain responsible for BFF orchestration, vendor retries, cache behavior, route parsing, and serialized API contracts. Frontend tests should not duplicate those tests.
- The frontend quality gate is `npm test -- --run`, `npm run lint`, and `npm run build`.

## Out of Scope

- Testing Tailwind class composition or design-token values.
- Testing React state setters, TanStack Query cache internals, or private helper functions.
- Testing the Next Image optimizer or Next Link routing internals in jsdom.
- Adding Playwright or another browser runner in this initial test slice.
- Duplicating backend unit and e2e coverage in the frontend package.
- Snapshot testing the entire page markup.
- Testing the upstream Rick and Morty API directly from the frontend suite.
- Changing the BFF contract, cache strategy, or vendor client behavior.
