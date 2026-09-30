## Problem Statement

The frontend needs to display every character that appears in a specific Rick and Morty episode, ordered alphabetically by character name. The upstream episode resource exposes characters as individual URLs, so resolving them one at a time creates an N+1 request pattern, increases latency, and couples the UI to upstream API composition details.

The backend also needs to remain available when the optional cache is unavailable and must distinguish a missing episode from an upstream service failure.

## Solution

Provide a backend-for-frontend endpoint that accepts an episode ID, resolves the episode's character references through one batched Rick and Morty API request, sorts the complete character resources alphabetically by name, and returns the episode metadata with the resolved characters.

Cache the assembled response for a short time through the shared cache service. Redis is the current cache implementation, but episode logic depends on the generic cache contract rather than Redis-specific naming or behavior.

The endpoint is the highest testing seam: HTTP behavior, response shape, sorting, batching effects, cache behavior, validation, and error status mapping should be observable through the public endpoint wherever practical.

## User Stories

1. As a UI consumer, I want to request the characters for an episode by episode ID, so that I can render the episode's cast from one backend endpoint.
2. As a UI consumer, I want the response to include the episode's identifying metadata, so that I can render the episode context alongside its characters.
3. As a UI consumer, I want complete character resources, so that the UI can display names, images, status, species, origin, location, and other character details without additional upstream calls.
4. As a UI consumer, I want characters sorted alphabetically by name, so that the list is predictable and easy to scan.
5. As a UI consumer, I want sorting to be case-insensitive, so that capitalization does not produce surprising ordering.
6. As a UI consumer, I want an episode with no characters to return an empty character list, so that the UI can render an empty state without special error handling.
7. As a UI consumer, I want a single-character episode to return the same array response shape as a multi-character episode, so that the UI has one consistent rendering path.
8. As a platform operator, I want character references to be resolved with one batched upstream request, so that the backend avoids the N+1 request pattern.
9. As a platform operator, I want repeated requests for the same episode to use the shared cache, so that upstream traffic and response latency are reduced.
10. As a platform operator, I want cache entries to expire, so that episode and character data can refresh without manual invalidation.
11. As a platform operator, I want the endpoint to continue serving fresh upstream data when the cache is unavailable, so that Redis downtime does not become application downtime.
12. As an API consumer, I want a missing episode to return HTTP 404, so that I can distinguish an invalid resource from a temporary dependency failure.
13. As an API consumer, I want Rick and Morty API failures to return HTTP 502, so that I can distinguish upstream failure from a client request error.
14. As an API consumer, I want malformed upstream episode or character data to return HTTP 502, so that invalid dependency data is not presented as a successful response.
15. As an API consumer, I want a non-numeric episode ID to return HTTP 400, so that invalid input is reported clearly.
16. As a platform operator, I want Redis connection and cache errors to be observable in logs, so that cache degradation can be diagnosed without breaking requests.
17. As a platform operator, I want the cache connection to close during application shutdown, so that the service exits cleanly and does not leak connections.
18. As a maintainer, I want episode behavior isolated in an episodes module, so that feature changes have a clear ownership boundary.
19. As a maintainer, I want infrastructure services isolated in a shared module, so that future features can reuse caching without depending on a Redis-specific class name.
20. As a maintainer, I want the cache contract to be independently replaceable, so that the backing store can change without changing episode orchestration.
21. As a maintainer, I want public endpoint tests to exercise module wiring, so that dependency-injection regressions are detected before deployment.
22. As a maintainer, I want upstream URL parsing to reject malformed character references, so that invalid dependency data cannot trigger an unhandled server error.

## Implementation Decisions

- The backend exposes an episode-characters HTTP endpoint identified by episode ID.
- The endpoint returns episode metadata and a `characters` array containing complete character resources.
- Character references are converted to IDs and sent in one upstream batch request rather than one request per reference.
- The response is sorted by character name using case-insensitive comparison.
- The assembled response is cached for a bounded TTL through a generic cache contract.
- Redis is the current cache adapter and is configured through application configuration. Redis failures are fail-open for request handling and are logged for operations.
- The episodes module owns episode routing and orchestration.
- The shared module owns reusable infrastructure, including the generic cache service.
- A cache hit returns without contacting the upstream API.
- A cache miss fetches the episode, resolves characters, sorts the result, stores it, and returns it.
- An upstream episode 404 maps to HTTP 404. Other upstream transport, status, parsing, shape, or URL errors map to HTTP 502.
- Invalid route IDs are rejected at the HTTP boundary with HTTP 400.
- Complete character validation requires the fields needed to preserve the upstream character resource contract, including identity, classification, related resources, image, episode references, URL, and creation timestamp.
- Application shutdown hooks are enabled so shared resources can close during graceful shutdown.
- Duplicate character reference handling should deduplicate IDs before batching to avoid redundant IDs in the upstream request.
- Large character lists should be chunked if an upstream URL or API limit makes one batch unsafe.

## Testing Decisions

- Tests verify externally observable behavior at the HTTP endpoint whenever possible; they do not test private helper methods or implementation details.
- The primary seam is the episode characters HTTP endpoint.
- Unit-level service tests remain useful for deterministic upstream batching, sorting, cache-hit short-circuiting, and dependency error mapping where constructing the HTTP boundary would obscure the behavior.
- The existing Vitest unit tests are prior art for service behavior and mocked `fetch` responses.
- The existing Nest and Supertest e2e tests are prior art for module wiring, route parsing, response serialization, and HTTP status behavior.
- Tests should cover a normal multi-character episode, a cache hit, an empty character list, a single-character response object, duplicate references, invalid route IDs, missing episodes, upstream non-404 errors, network failures, invalid JSON, malformed episode data, malformed character data, malformed character URLs, and cache read/write failures.
- Tests should assert that the batched upstream request is made once and that no upstream request is made on a valid cache hit.
- Tests should assert that cache failures do not prevent a successful upstream response.
- Tests should assert that invalid upstream data never produces a successful partial response.

## Out of Scope

- Changing the Rick and Morty API.
- Adding authentication or authorization to the endpoint.
- Persisting episode or character data in an application database.
- Building frontend screens or UI sorting logic.
- Real-time episode or character updates.
- Manual cache invalidation APIs.
- Replacing Redis with another production cache provider.
- Retrying failed upstream requests beyond the configured HTTP client behavior.
- Supporting arbitrary upstream APIs with different episode or character schemas.
