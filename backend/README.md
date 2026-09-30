# Rick and Morty BFF

The backend is a NestJS backend-for-frontend (BFF) for episode character data. It hides the upstream Rick and Morty API response shape, resolves character references, caches vendor records in Redis, validates external payloads, and exposes a small frontend-oriented contract.

## Stack

- NestJS 12 with TypeScript 6 and the Express adapter
- Zod for runtime validation of vendor payloads
- Redis 8 through `ioredis` for episode and character caching
- Swagger/OpenAPI through `@nestjs/swagger`
- Vitest and Supertest for unit and HTTP-level tests
- Oxlint for type-aware linting
- Docker Compose for local Redis

## Requirements

- Node.js compatible with the repository toolchain
- npm
- Docker Desktop if using the Redis Compose service
- Access to the Rick and Morty API, unless a compatible test double is used

## Setup

```bash
cd backend
npm install
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead of `Copy-Item`.

The default environment expects Redis at `redis://localhost:6379` and the vendor API at `https://rickandmortyapi.com/api`.

Start Redis:

```bash
docker compose up -d redis
```

Start the API in watch mode:

```bash
npm run start:dev
```

The API is available at `http://localhost:3000`.

## Environment

The supported variables are:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
RICK_AND_MORTY_API_URL=https://rickandmortyapi.com/api
CORS_ORIGIN=http://localhost:3001
```

- `PORT` controls the HTTP port.
- `REDIS_URL` selects the Redis connection. The cache service falls back to its local default when it is not configured.
- `REDIS_PASSWORD` supplies an optional Redis password.
- `RICK_AND_MORTY_API_URL` configures the upstream vendor base URL and is required by the vendor client.
- `CORS_ORIGIN` is a comma-separated allowlist of browser origins. Localhost ports `3000` and `3001`, plus their `127.0.0.1` equivalents, are allowed by the bootstrap defaults.

## Commands

```bash
npm run start        # start once
npm run start:dev    # watch mode
npm run start:prod   # run compiled dist/main.js
npm run build        # compile the Nest application
npm run lint         # type-aware Oxlint
npm run format       # format source and test files
npm run test         # unit tests
npm run test:e2e     # HTTP-level tests
npm run test:cov     # coverage report
```

## Docker

The Compose file currently provisions Redis with persistent storage and a health check. The application service definition is intentionally commented so the API can run directly from the host during development:

```bash
docker compose up -d redis
npm run start:dev
```

The Redis data volume is named `redis_data`. To run the full application in Docker, enable the app service in `docker-compose.yml`, build the image, and provide the required environment values.

## Public API

### `GET /episodes/:id/characters`

Returns one episode and its normalized character collection.

Example:

```bash
curl http://localhost:3000/episodes/28/characters
```

The response contains:

```json
{
  "id": 28,
  "name": "The Ricklantis Mixup",
  "air_date": "September 10, 2017",
  "episode": "S03E07",
  "characters": [
    {
      "id": 1,
      "name": "Rick Sanchez",
      "status": "Alive",
      "species": "Human",
      "type": "",
      "gender": "Male",
      "origin": "Earth",
      "location": "Earth",
      "image": "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
      "episodes": [1, 2, 3]
    }
  ]
}
```

The BFF removes vendor URLs and timestamps, flattens `origin` and `location` to names, converts character episode references to numeric IDs, and sorts characters case-insensitively by name.

Responses use these error semantics:

- `404`: the requested episode does not exist
- `400`: the route parameter is not a valid integer
- `502`: the upstream vendor fails, returns invalid data, or returns an invalid reference

Interactive Swagger documentation is available at `http://localhost:3000/docs`. The raw OpenAPI document is available at `/docs-json`.

## Architecture

The backend is organized into two boundaries:

```text
HTTP request
  -> EpisodesController
  -> EpisodesService
  -> CacheService
  -> RickAndMortyClient
  -> Rick and Morty API
  -> EpisodesMapper / DTO response
```

### App and shared infrastructure

`AppModule` loads global configuration and composes the shared and episodes modules. The bootstrap configures CORS, Swagger, graceful shutdown hooks, and the HTTP port.

`SharedModule` owns infrastructure that is not specific to episodes, including Redis cache access and the upstream vendor client.

### Episodes module

The episodes module owns the frontend-facing use case:

- The controller parses the episode ID and exposes the route.
- The service reads and writes episode and character cache entries, extracts and deduplicates character IDs, resolves missing characters, sorts the result, and invokes the mapper.
- DTOs describe the serialized public contract for Swagger.
- The mapper is an anti-corruption boundary between vendor models and the BFF response.

### Vendor client

The Rick and Morty client owns upstream communication and validation:

- Builds URLs from `RICK_AND_MORTY_API_URL`.
- Validates episodes and characters with Zod.
- Maps an upstream episode 404 to `NotFoundException`.
- Maps dependency failures and malformed data to `BadGatewayException`.
- Retries network failures and HTTP `408`, `429`, and `5xx` responses up to three total attempts.
- Uses bounded exponential backoff, jitter, and a bounded `Retry-After` value.

## Caching Strategy

The episodes service caches complete vendor records under separate keys:

- `episode:<id>` for episode metadata and character URLs
- `character:<id>` for vendor character records

Entries use a 24-hour TTL. Character IDs are deduplicated before fetching, so repeated references in an episode do not create redundant vendor requests. Missing characters may be fetched concurrently.

Cache failures fail open: a Redis outage can increase vendor traffic and latency, but should not turn a readable upstream response into a cache-only failure.

## Architectural Tradeoffs

### Individual character requests instead of vendor batch requests

The client requests one character resource per ID, potentially concurrently. This avoids coupling the application to batch URL limits and keeps each request shape simple. The tradeoff is more upstream requests for episodes with large casts. The decision is recorded in `docs/adr/0001-individual-character-requests.md`.

### Redis cache instead of a database

Redis is appropriate for mostly static vendor data and keeps the implementation small. Separate episode and character keys maximize reuse across episodes. The tradeoff is that the cache is not the system of record and requires an operational Redis dependency.

### Fail-open cache behavior

The API prioritizes availability when Redis is unavailable. The tradeoff is increased upstream load during cache failures and less predictable latency.

## Testing Strategy

Tests target public behavior at the highest useful boundary:

- Episode service tests use cache and vendor doubles to verify cache hits/misses, deduplication, sorting, mapping, missing data, and invalid references.
- Vendor client tests mock `fetch` to verify URL construction, retries, 404 behavior, malformed payload handling, and upstream failures.
- E2E tests verify Nest wiring, route parsing, HTTP serialization, and invalid route handling.
- Build validation checks TypeScript and decorators.
- Lint runs with type-aware Oxlint.

The frontend currently validates with `npm run lint` and `npm run build`. Its planned test seam is the public episode explorer interaction boundary with the BFF adapter mocked.

## Operational Notes

- Start Redis before the API when running locally.
- Start the backend before the frontend so the initial server-rendered episode can load.
- Allow the frontend origin through `CORS_ORIGIN` in non-local environments.
- Keep `RICK_AND_MORTY_API_URL` configured in every deployment.
- Inspect `/docs` and `/docs-json` when changing the public contract.

See the detailed backend specs under `docs/specs/` and the accepted request-strategy ADR under `docs/adr/`.
