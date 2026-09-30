# Backend BFF Completed Work

> Status: Implemented closeout summary; the current endpoint contract lives in the BFF spec, vendor responsibilities live in the boundary spec, and architectural alternatives live in the ADR.

## Problem Statement

The backend-for-frontend needs to expose episode character data without leaking the Rick and Morty API's transport-oriented response shape to the frontend. The upstream integration also needs predictable failure handling, caching, API documentation, and tests around the public contract.

The completed work establishes a clear boundary: the vendor client owns upstream communication and validation, while the episodes feature owns caching, orchestration, response shaping, and UI-facing semantics.

## Solution

Expose the episode-characters endpoint through a documented NestJS API. Resolve episode character references through individual vendor character requests, deduplicate IDs before requesting them, cache episode and character records for 24 hours, and map upstream records into a lean BFF response.

The public response removes upstream URLs and timestamps, flattens origin and location to names, and converts character episode URLs into numeric episode IDs. Swagger exposes the resulting contract through an interactive OpenAPI document.

The vendor client retries transient network and HTTP failures with bounded backoff, preserves the distinction between missing episodes and dependency failures, and validates upstream payloads with Zod.

## User Stories

1. As a UI consumer, I want to request an episode's characters by episode ID, so that I can render the episode cast through one backend endpoint.
2. As a UI consumer, I want episode metadata included with the character list, so that I can render episode context without another request.
3. As a UI consumer, I want only UI-relevant character fields returned, so that the frontend does not depend on vendor-specific response details.
4. As a UI consumer, I want episode and character upstream URLs excluded from the response, so that vendor URL structure is not exposed to the UI.
5. As a UI consumer, I want creation timestamps excluded from the response, so that the contract remains focused on display data.
6. As a UI consumer, I want origin and location represented as names, so that I can render them without traversing nested resource objects.
7. As a UI consumer, I want character episode references represented as numeric IDs, so that I can use them directly in links and lookups.
8. As a UI consumer, I want characters sorted alphabetically by name, so that the result is predictable.
9. As a UI consumer, I want sorting to be case-insensitive, so that capitalization does not change expected ordering.
10. As a platform operator, I want repeated episode requests to use cached episode metadata, so that upstream traffic and latency are reduced.
11. As a platform operator, I want shared character records cached independently, so that characters appearing in multiple episodes are reused.
12. As a platform operator, I want cache entries to expire after 24 hours, so that mostly static data can refresh without manual intervention.
13. As a platform operator, I want cache failures to fail open, so that Redis unavailability does not take down episode responses.
14. As a platform operator, I want duplicate character references deduplicated before vendor requests, so that redundant upstream work is avoided.
15. As a platform operator, I want one vendor URL requested per character ID, so that vendor batch URL limits do not constrain the integration.
16. As a platform operator, I want transient vendor failures retried, so that temporary upstream instability does not immediately fail requests.
17. As a platform operator, I want retries bounded with exponential backoff and jitter, so that failures do not create unbounded latency or retry storms.
18. As an API consumer, I want a missing episode to return HTTP 404, so that I can distinguish it from a dependency outage.
19. As an API consumer, I want vendor failures to return HTTP 502, so that dependency failures are represented accurately.
20. As an API consumer, I want malformed upstream data to return HTTP 502, so that invalid dependency data is never presented as a successful response.
21. As an operator, I want the vendor base URL configured through the environment, so that deployments can target different vendor environments without code changes.
22. As an operator, I want a missing vendor URL configuration to fail during client construction, so that deployment errors are detected early.
23. As an API consumer, I want interactive OpenAPI documentation, so that I can discover and try the endpoint without reading source code.
24. As a maintainer, I want vendor schemas validated with Zod, so that runtime validation and inferred types share one contract.
25. As a maintainer, I want the BFF response transformation isolated from vendor communication, so that frontend contract changes do not leak into the vendor client.
26. As a maintainer, I want the batch vendor route documented as an available alternative, so that the request strategy can be reconsidered if traffic or latency changes.
27. As a maintainer, I want unit tests around cache and transformation behavior, so that feature changes do not regress orchestration.
28. As a maintainer, I want HTTP-level tests around routing and response serialization, so that module wiring and public contract regressions are detected.

## Implementation Decisions

- The episodes feature remains the owner of episode orchestration, cache coordination, ID deduplication, sorting, and BFF response shaping.
- The vendor client remains responsible for environment-based URL construction, HTTP communication, retry behavior, status mapping, JSON parsing, and Zod validation.
- The BFF uses a mapper as an anti-corruption boundary between vendor models and the public response DTO.
- Vendor records remain complete in the cache; field removal and flattening occur when composing the public response.
- The public episode response excludes episode `url` and `created` fields.
- The public character response excludes character `url` and `created` fields, excludes nested `origin.url` and `location.url`, exposes `origin` and `location` as strings, and exposes `episodes` as numeric IDs.
- Character requests use one vendor URL per ID and may run concurrently. The vendor batch route remains available but is not used by the application.
- The cache uses separate episode and character keys with a 24-hour TTL.
- Redis cache reads and writes are fail-open and logged when they fail.
- The client retries network failures and HTTP `408`, `429`, and `5xx` responses up to three total attempts.
- Retry delays use exponential backoff with jitter, honor a bounded `Retry-After` value, and cancel discarded retry response bodies.
- Episode `404` responses map to `NotFoundException`; other upstream transport, status, JSON, schema, and URL failures map to `BadGatewayException`.
- Swagger is generated during Nest bootstrap and exposes the public endpoint at `/docs`, with the raw document at `/docs-json`.
- Swagger DTO classes describe the lean BFF contract and are separate from vendor Zod schemas.
- The vendor base URL is supplied through `RICK_AND_MORTY_API_URL`.

## Testing Decisions

- Tests verify externally observable behavior at the highest practical seam and avoid private helper assertions.
- Episode service tests use focused client and cache doubles to verify cache hits, cache misses, deduplication, sorting, response mapping, missing data, and malformed episode URLs.
- Vendor client tests mock `fetch` at the vendor boundary to verify individual character URLs, configurable base URLs, retry recovery, retry exhaustion, non-retryable `404` behavior, malformed payloads, and upstream error mapping.
- E2E tests verify Nest module wiring, route parsing, HTTP response serialization, and invalid route handling.
- Build validation verifies DTO and decorator type correctness.
- Lint validation runs with type-aware Oxlint.
- The OpenAPI document is verified to contain the documented episode-character route.
- Tests assert that response shaping removes URLs and timestamps, flattens origin and location, and converts episode references to numeric IDs.

## Out of Scope

- Authentication or authorization for the endpoint.
- Manual cache invalidation APIs.
- A circuit breaker or distributed request lock.
- Replacing Redis with another production cache provider.
- Persisting episode or character data in an application database.
- Frontend interface implementation.
- Using the vendor batch character route in the current request flow.
- Supporting arbitrary upstream APIs with different schemas.

## Further Notes

The accepted individual-character-request decision is recorded in the ADR for this feature. The repository does not currently contain the issue-tracker configuration required to publish this spec with the `ready-for-agent` label. Run `/setup-matt-pocock-skills` to configure publication, then publish this document as an issue.
