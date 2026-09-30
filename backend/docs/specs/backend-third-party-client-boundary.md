## Problem Statement

> Status: Current vendor boundary contract

The backend-for-frontend needs to resolve Rick and Morty episode characters efficiently, but the responsibilities between the vendor integration and the episodes feature must remain clear. The Rick and Morty integration should represent only the external vendor client and its payload schemas. Episode-specific behavior such as extracting character IDs, deduplicating references, resolving characters, sorting characters, and coordinating the cache belongs to the episodes feature.

The vendor URL is also an environment-specific configuration value and must not be hardcoded in the client implementation.

## Solution

Keep a focused `RickAndMortyClient` responsible for communicating with the Rick and Morty service and validating its episode and character payloads with Zod. Keep the episodes module responsible for the BFF use case: reading and writing the generic cache, converting episode character URLs to IDs, deduplicating IDs, requesting characters, sorting the resolved characters, and returning the UI-facing response.

The public HTTP endpoint remains the primary seam. The client and episode service may also have focused unit tests where the external behavior is clearer at those boundaries.

## Boundary Responsibilities

- The vendor client owns environment-based URL construction, HTTP calls, retries, response status mapping, JSON parsing, and Zod validation.
- The episodes feature owns URL extraction, ID deduplication, cache coordination, response shaping, sorting, and HTTP composition.
- The vendor client exposes episode retrieval and character retrieval by numeric IDs.
- The vendor client uses one character URL per ID; the vendor batch route is documented in the ADR but is not part of the current application flow.
- Vendor schemas preserve unknown upstream character fields for the episodes mapper and cache.
- Vendor `404` episode responses map to `NotFoundException`; other vendor failures map to `BadGatewayException`.
- The vendor base URL is required from configuration and is never hardcoded.

## Implementation Decisions

- `RickAndMortyClient` is the only abstraction in the Rick and Morty vendor boundary.
- The vendor boundary contains the client and its Zod schemas; it does not contain an Adapter class or episode orchestration.
- The client retries transient transport and vendor failures with bounded backoff before mapping the final failure.
- The client is registered directly by the episodes module; no separate vendor module or Adapter provider is required.

## Testing Decisions

- Tests should prioritize externally observable behavior and avoid private-method assertions.
- The primary seam is the public episode-characters HTTP endpoint.
- Episode service unit tests use a client test double to verify cache short-circuiting, ID extraction, deduplication, sorting, and response composition.
- Vendor client unit tests mock fetch only at the client boundary to verify endpoint construction, environment-provided base URL usage, individual character IDs, single-object normalization, status handling, invalid JSON, and Zod rejection.
- Tests should assert that the client receives one request per deduplicated character ID and that no client call occurs when episode and character data are cached.
- Tests should assert that unknown character fields survive Zod parsing.

## Out of Scope

- BFF response shaping and frontend-specific DTO decisions.
- Episode and character cache policy.
- Manual cache invalidation APIs.
- Circuit breaking or distributed request coalescing.

