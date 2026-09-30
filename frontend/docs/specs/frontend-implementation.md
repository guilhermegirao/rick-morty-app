# Frontend Episode Explorer

## Problem Statement

The Rick and Morty BFF exposes a lean episode-characters contract, but the frontend needs a focused interface for identifying an episode, inspecting its cast, searching character information, and understanding loading, empty, and failure states. The frontend must present the BFF response as a usable episode explorer rather than a starter page or generic marketing hero.

The interface also needs to remain responsive while episode requests are in flight, preserve useful content during client navigation, expose state through shareable URLs, and keep the visual and code structure maintainable as the feature grows.

## Solution

Build a responsive Next.js episode explorer around `GET /episodes/:id/characters`. Render the selected episode name as the page title, show episode metadata and a detailed character grid, allow users to request any positive episode ID, and display the BFF's not-found or dependency error message when the requested episode cannot be loaded.

Use a server-rendered initial episode request and a client-side TanStack Query cache for subsequent requests. Preserve the previous episode as optimistic placeholder content during navigation. Show a full skeleton during initial route loading, validate the environment and BFF payload with Zod, and use eager loading for the first above-the-fold character portrait to support LCP.

Organize the feature under a `src` layout with shared UI primitives and feature-owned episode components, API types, and data access. Use shadcn-generated primitives and semantic Tailwind design tokens for the visual system.

## User Stories

1. As an episode explorer user, I want the selected episode name to be the page title, so that I immediately know which episode I am viewing.
2. As an episode explorer user, I want to see the episode code and air date, so that I understand the episode context without another request.
3. As an episode explorer user, I want to see the cast count, so that I know how much character data is available.
4. As an episode explorer user, I want to enter any positive episode number, so that the frontend does not impose a catalogue limit that the BFF does not require.
5. As an episode explorer user, I want non-positive and non-integer episode IDs rejected immediately, so that I receive useful local validation.
6. As an episode explorer user, I want an unknown episode ID to show the BFF's not-found message, so that I understand that the requested episode does not exist.
7. As an episode explorer user, I want dependency failures shown as an actionable error, so that I know the archive could not be reached.
8. As an episode explorer user, I want a skeleton page while the initial episode loads, so that the layout is stable and I can see that content is arriving.
9. As an episode explorer user, I want the previous episode content preserved while another episode loads, so that the page does not flash unrelated fallback data.
10. As an episode explorer user, I want loading controls and announcements while a request is in flight, so that I understand the interface is working.
11. As an episode explorer user, I want episode requests cached in the browser, so that revisiting an episode avoids unnecessary network work.
12. As an episode explorer user, I want the selected episode encoded in the URL, so that I can reload or share the current episode.
13. As an episode explorer user, I want the cast search query encoded in the URL, so that a filtered view can be reloaded or shared.
14. As an episode explorer user, I want to search by character name, so that I can find a character quickly.
15. As an episode explorer user, I want to search by species, origin, location, or gender, so that I can discover characters without knowing their name.
16. As an episode explorer user, I want an empty search result to explain what happened and offer a clear-search action, so that I can recover without reloading the page.
17. As an episode explorer user, I want an episode with no character records to have a distinct empty state, so that it is not confused with a failed search.
18. As an episode explorer user, I want each character card to show a portrait and name, so that the cast is scannable.
19. As an episode explorer user, I want character status shown as a visible badge, so that Alive, Dead, and unknown states are immediately recognizable.
20. As an assistive-technology user, I want character status represented with accessible text, so that color is not the only status signal.
21. As an episode explorer user, I want species and type shown together, so that I can distinguish broad species from a more specific type.
22. As an episode explorer user, I want gender, origin, last known location, and episode count shown, so that I can inspect the returned character fields without another request.
23. As a keyboard user, I want visible focus states on inputs and buttons, so that I can understand where I am in the interface.
24. As a screen-reader user, I want loading, result-count, and error announcements, so that asynchronous changes are understandable without visual context.
25. As a mobile user, I want episode controls and the character grid to adapt to a narrow viewport, so that the explorer remains usable on a phone.
26. As a desktop user, I want the cast arranged in a dense responsive grid, so that I can compare characters efficiently.
27. As a user sensitive to motion, I want decorative transitions reduced when my system requests reduced motion, so that the interface remains comfortable.
28. As a user on a slow connection, I want the first visible portrait loaded eagerly and later portraits loaded lazily, so that the primary content appears quickly without loading every image immediately.
29. As a deployment operator, I want the BFF URL configured through the frontend environment, so that deployments can target different backend hosts without code changes.
30. As a maintainer, I want API payloads validated at runtime, so that malformed BFF responses fail clearly instead of corrupting the UI.
31. As a maintainer, I want episode presentation split into focused modules, so that changes to controls, cards, headers, skeletons, and data access remain local.
32. As a maintainer, I want shared UI primitives separated from feature modules, so that shadcn components can be reused by future features.
33. As a maintainer, I want the initial page request to remain compatible with Next.js server rendering, so that the first view is useful without waiting for client JavaScript.
34. As a maintainer, I want frontend lint and production build checks to pass, so that the interface remains deployable after visual or interaction changes.

## Implementation Decisions

- The frontend source uses a `src`-rooted layout with separate app routes, shared components, shared libraries, and feature modules.
- The episodes feature owns its explorer, controls, header, character card, character grid, status badge, skeleton, response types, and BFF data access.
- Shared shadcn UI primitives remain outside the episode feature and are imported by feature components.
- The existing BFF endpoint remains the only backend contract used by the frontend: `GET /episodes/:id/characters`.
- The initial episode is selected from the `episode` URL search parameter when it is a positive integer; otherwise the default episode is used.
- The cast search is initialized from the `q` URL search parameter.
- Client-side episode and search changes update URL state with browser history replacement without requiring a full navigation for each keystroke.
- The frontend accepts any positive integer episode ID. It rejects only non-integer or non-positive values locally and delegates existence checks to the BFF.
- BFF `404` messages are shown in the episode controls alert and route error boundary rather than replaced with a generic “not found” message.
- TanStack Query owns subsequent episode requests, query keys, stale-time behavior, loading state, error state, cached episode data, and previous-data placeholder behavior.
- The initial route loading boundary renders a skeleton matching the episode header, controls, and character grid structure.
- The first visible character image is marked eager and prioritized for LCP; remaining character images are lazy-loaded.
- Character status is represented by a visible semantic badge with accessible text.
- Search matches character name, species, type, origin, location, and gender case-insensitively.
- Zod validates `NEXT_PUBLIC_API_URL` and the complete public episode-character response before presentation.
- The component system uses official shadcn-generated Button and Input primitives, `class-variance-authority`, `tailwind-merge`, and semantic Tailwind tokens.
- Visual values are centralized as design-system tokens; feature markup uses canonical Tailwind utilities instead of arbitrary hardcoded colors or pixel values.
- The visual direction is a cool field-archive interface with a restrained cobalt and amber signal palette, episode title as the main visual anchor, and compact character records.
- The interface avoids a generic marketing hero, decorative gradient blobs, excessive card nesting, and all-caps template chrome.
- Motion is limited to character image interaction and respects reduced-motion preferences.
- The backend must allow the frontend origin through its configurable CORS policy.

## Testing Decisions

- The primary seam is the episode explorer user interaction boundary with the BFF data client mocked. Tests should observe rendered episode data, URL state, episode selection, validation, filtering, loading, optimistic placeholder behavior, error, empty, status badge, and accessibility behavior through the public UI.
- Tests verify external behavior rather than component implementation details, private state, query internals, or CSS class composition.
- Frontend fixtures should contain independent known episode and character values so search expectations do not duplicate the filtering implementation.
- The modular child components may receive focused unit tests only when their public rendering behavior is not adequately covered through the explorer seam.
- The backend episode service and BFF contract already have unit and e2e coverage; frontend tests treat that API response as the integration boundary rather than duplicate backend orchestration tests.
- Existing project validation remains part of the change workflow: frontend lint and production build, plus backend lint/build when CORS or the public contract changes.
- A browser-level smoke test may be added later if the repository adopts a browser test runner; it is not required to introduce a second seam for this feature.
