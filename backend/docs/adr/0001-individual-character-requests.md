# ADR 0001: Individual Character Requests

- Status: Accepted
- Date: 2026-09-30

## Context

The Rick and Morty API supports a batch character route such as `/character/1,2,3`. The episodes use case already deduplicates character IDs, but batch URLs couple the client to the vendor's URL and batch-size limits.

## Decision

The vendor client will request one character URL per character ID, for example `/character/1` and `/character/2`. Requests may run concurrently, and the client will return the same `Character[]` shape to the episodes service.

The vendor batch route remains available and documented as an alternative, but the application does not use it currently. The episodes service continues to deduplicate IDs before calling the client.

## Consequences

- Individual responses have a simple, stable object shape.
- Vendor URL-length and batch-size limits do not affect character resolution.
- A request for an episode with many characters creates more upstream requests.
- `Promise.all` means one failed character request fails the overall resolution.
- The batch route can be reconsidered if upstream traffic or latency becomes a concern.
