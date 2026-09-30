## Problem Statement

The backend-for-frontend needs to resolve Rick and Morty episode characters efficiently, but the responsibilities between the vendor integration and the episodes feature must remain clear. The Rick and Morty integration should represent only the external vendor client and its payload schemas. Episode-specific behavior such as extracting character IDs, deduplicating references, batching the request, sorting characters, and coordinating the cache belongs to the episodes feature.

The vendor URL is also an environment-specific configuration value and must not be hardcoded in the client implementation.

## Solution

Keep a focused `RickAndMortyClient` responsible for communicating with the Rick and Morty service and validating its episode and character payloads with Zod. Keep the episodes module responsible for the BFF use case: reading and writing the generic cache, converting episode character URLs to IDs, deduplicating IDs, requesting the batch, sorting the resolved characters, and returning the UI-facing response.

The public HTTP endpoint remains the primary seam. The client and episode service may also have focused unit tests where the external behavior is clearer at those boundaries.

## User Stories

1. As a UI consumer, I want to request an episode's characters by episode ID, so that I can render the episode cast from one backend endpoint.
2. As a UI consumer, I want episode metadata included with the character list, so that I can render the episode context without another request.
3. As a UI consumer, I want complete character objects, so that I can display character details without calling the vendor directly.
4. As a UI consumer, I want characters sorted alphabetically by name, so that the list is predictable and easy to scan.
5. As a UI consumer, I want sorting to be case-insensitive, so that capitalization does not produce surprising order.
6. As a platform operator, I want character references deduplicated before batching, so that duplicate upstream work is avoided.
7. As a platform operator, I want all character IDs requested in one vendor call, so that the backend avoids the N+1 request pattern.
8. As a platform operator, I want the assembled episode response cached, so that repeated requests reduce vendor traffic and latency.
9. As a platform operator, I want cache failures to be fail-open, so that Redis unavailability does not take down episode responses.
10. As an API consumer, I want a missing episode to return 404, so that I can distinguish a missing resource from a dependency outage.
11. As an API consumer, I want vendor failures to return 502, so that dependency failures are represented accurately.
12. As an API consumer, I want malformed vendor payloads to return 502, so that invalid external data is never presented as a successful response.
13. As an operator, I want the vendor base URL configured through the environment, so that deployments can target different vendor environments without code changes.
14. As an operator, I want a missing vendor URL configuration to fail during client construction, so that deployment configuration errors are detected early.
15. As a maintainer, I want the vendor client to contain only vendor communication concerns, so that it can be changed independently of episode behavior.
16. As a maintainer, I want vendor schemas colocated with the vendor client, so that upstream contract changes have one clear ownership boundary.
17. As a maintainer, I want the episodes service to own character URL parsing and ID batching, so that those rules remain in the episode domain rather than the vendor client.
18. As a maintainer, I want the episodes service to depend on a concrete client with a narrow public API, so that the feature is easy to test without mocking global fetch calls.
19. As a maintainer, I want Zod schemas to provide both runtime validation and inferred TypeScript types, so that the external contract is defined once.
20. As a maintainer, I want unknown vendor character fields preserved, so that the BFF does not discard useful upstream data when the vendor adds fields.
21. As a maintainer, I want the public endpoint tests to verify module wiring, so that dependency injection regressions are caught before deployment.
22. As a maintainer, I want client tests to verify the vendor request shape, so that batching and configurable URL behavior remain stable.

## Implementation Decisions

- The backend continues to expose the episode-characters endpoint identified by episode ID.
- `RickAndMortyClient` is the only abstraction in the Rick and Morty vendor boundary.
- The vendor boundary contains the client and its Zod schemas; it does not contain an Adapter class or episode orchestration.
- The client owns vendor URL construction, HTTP calls, JSON reading, vendor status mapping, and Zod parsing.
- The client receives `RICK_AND_MORTY_API_URL` from `ConfigService` and does not hardcode the vendor base URL.
- The client exposes episode retrieval and character retrieval by numeric character IDs.
- The episodes service owns conversion of vendor episode character URLs into numeric IDs.
- The episodes service deduplicates character IDs before calling the client.
- The episodes service owns sorting, cache lookup, cache writes, and the UI-facing response composition.
- The generic cache service remains shared infrastructure and is used by the episodes service.
- Character schemas use a loose object shape so required fields are validated while unknown vendor fields are preserved.
- Episode schemas validate the required episode metadata and character URL list.
- A vendor episode 404 maps to HTTP 404.
- Other vendor transport, status, JSON, schema, or character URL failures map to HTTP 502.
- The environment template includes the port, Redis URL, and Rick and Morty API URL.
- The client is registered directly by the episodes module; no separate vendor module or Adapter provider is required.
- The existing Docker and Compose setup may inject the same vendor URL for containerized execution.

## Testing Decisions

- Tests should prioritize externally observable behavior and avoid private-method assertions.
- The primary seam is the public episode-characters HTTP endpoint, which verifies route parsing, response serialization, module wiring, and HTTP error mapping.
- Episode service unit tests use a client test double to verify cache short-circuiting, ID extraction, deduplication, sorting, and response composition without coupling to global fetch.
- Vendor client unit tests mock fetch only at the client boundary to verify endpoint construction, environment-provided base URL usage, batch IDs, single-object normalization, status handling, invalid JSON, and Zod rejection.
- Existing Vitest service tests are the prior art for deterministic cache and response behavior.
- Existing Supertest e2e tests are the prior art for Nest module and HTTP behavior.
- Test cases should include an ordinary multi-character episode, duplicate character URLs, an empty character list, a single character object response, a cache hit, an unavailable cache, invalid character URLs, a missing episode, upstream non-404 errors, network failures, invalid JSON, malformed episode data, and malformed character data.
- Tests should assert that the client receives one deduplicated batch of character IDs and that no client call occurs on a valid cache hit.
- Tests should assert that unknown character fields survive Zod parsing.
- Tests should assert that changing the configured vendor URL changes the client request target without changing feature code.

## Out of Scope

- Changing the Rick and Morty API contract.
- Adding authentication or authorization.
- Persisting episode or character data in an application database.
- Building frontend UI screens.
- Adding manual cache invalidation.
- Adding retries or circuit breaking beyond current behavior.
- Chunking character batches for arbitrary vendor URL limits.
