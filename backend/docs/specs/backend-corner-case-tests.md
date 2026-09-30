## Problem Statement

The backend has coverage for the main episode-character flow, caching, sorting, retries, and HTTP routing, but several edge cases described by the BFF contract are not yet verified. Without these tests, regressions could silently affect empty episodes, duplicate references, malformed upstream data, cache degradation, response shaping, and generated API documentation.

The missing coverage should strengthen the existing domain seams without testing private implementation details or creating a second orchestration path.

## Solution

Extend the existing episode service, vendor client, and HTTP-level test suites with focused corner-case coverage.

Use the public `GET /episodes/:id/characters` endpoint as the highest seam for route behavior, response shaping, error mapping, cache behavior, and module wiring. Use the episodes service seam for deterministic cache and character-resolution cases that are difficult to observe reliably through HTTP. Use the Rick and Morty client seam for vendor transport, payload, retry, and schema behavior. Verify the generated OpenAPI document at the application boundary.

## User Stories

1. As a UI consumer, I want an episode with no character references to return an empty `characters` array, so that I can render an empty state without special error handling.
2. As a platform operator, I want duplicate character references removed before vendor requests, so that repeated upstream work is avoided.
3. As an API consumer, I want malformed episode character URLs to return HTTP 502, so that invalid upstream references never become unhandled server errors.
4. As an API consumer, I want malformed character episode URLs to return HTTP 502, so that invalid related-resource data is rejected consistently.
5. As an API consumer, I want invalid JSON from the vendor to return HTTP 502, so that transport payload failures are represented accurately.
6. As an API consumer, I want malformed episode payloads to return HTTP 502, so that incomplete upstream data is never returned as a valid episode.
7. As an API consumer, I want malformed character payloads to return HTTP 502, so that incomplete upstream character data is never returned as a valid character.
8. As a maintainer, I want unknown vendor character fields preserved at the vendor boundary, so that upstream additions are not discarded before the BFF mapper receives them.
9. As a platform operator, I want cache read failures to fall back to upstream data, so that Redis degradation does not take down the endpoint.
10. As a platform operator, I want cache write failures not to fail an otherwise valid response, so that Redis degradation remains fail-open.
11. As a platform operator, I want episode and character cache entries to use the documented 24-hour TTL, so that cache freshness behavior remains intentional.
12. As an API consumer, I want transient `408`, `429`, and `5xx` vendor failures retried, so that temporary upstream instability can recover.
13. As an API consumer, I want retry attempts bounded, so that a persistently failing vendor does not create unbounded latency.
14. As an API consumer, I want a valid `Retry-After` value respected within the configured cap, so that rate-limit responses are handled responsibly.
15. As an API consumer, I want a permanent vendor `404` not retried, so that missing resources remain distinguishable from transient failures.
16. As a UI consumer, I want the BFF response to omit upstream URLs and timestamps, so that the public contract remains vendor-independent.
17. As a UI consumer, I want origin and location returned as strings, so that the frontend does not traverse nested vendor resource objects.
18. As a UI consumer, I want character episode references returned as numeric `episodes` IDs, so that the frontend can use them directly.
19. As an API consumer, I want the OpenAPI document to describe the lean response shape, so that generated clients and interactive documentation match runtime behavior.
20. As a maintainer, I want the existing endpoint and vendor seams reused, so that the test suite remains aligned with the system's domain boundaries.

## Implementation Decisions

- The primary test seam is the public episode-characters HTTP endpoint.
- The episodes service seam is used for cache hit/miss behavior, deduplication, sorting, response mapping, malformed character references, and fail-open cache behavior.
- The Rick and Morty client seam is used for request URL construction, response status handling, retries, retry exhaustion, `Retry-After`, invalid JSON, malformed schemas, and unknown-field preservation.
- The OpenAPI document is checked through the application bootstrap boundary rather than by testing Swagger internals.
- Tests assert observable outcomes, returned data, thrown Nest exceptions, upstream call arguments, and cache contract interactions where those interactions are part of the service boundary.
- Tests do not call private methods, inspect internal maps, assert incidental call ordering for concurrent requests, or duplicate tests already covered at a higher seam.
- Cache TTL assertions use the cache contract's `set` arguments and verify the documented 24-hour value for episode and character records.
- Retry timing tests use controlled time where necessary; they do not wait on nondeterministic production delays.
- The test fixtures retain complete upstream records so the mapper can be verified independently from vendor schema validation.

## Testing Decisions

- Episode service tests extend the existing Vitest suite and use client/cache doubles, following the current cache-hit, cache-miss, sorting, and dependency-error patterns.
- Vendor client tests extend the existing fetch-mocking suite and verify the external HTTP boundary without reaching into private request helpers.
- E2E tests extend the existing Supertest suite and verify route parsing, public response shaping, HTTP error mapping, and OpenAPI route/schema exposure.
- A good test should fail when externally observable behavior regresses, while remaining stable if private orchestration is refactored.
- The suite should prefer one representative test per behavior and avoid asserting implementation details such as exact internal helper counts or concurrent completion order.

