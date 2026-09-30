import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CharacterSchema,
  EpisodeSchema,
  type Character,
  type Episode,
} from './rick-and-morty.schemas.js';

const MAX_REQUEST_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;
const MAX_RETRY_DELAY_MS = 5_000;

@Injectable()
export class RickAndMortyClient {
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.getOrThrow<string>('RICK_AND_MORTY_API_URL');
  }

  async getEpisode(episodeId: number): Promise<Episode> {
    const response = await this.request(`/episode/${episodeId}`);

    if (response.status === 404) {
      throw new NotFoundException(`Episode ${episodeId} was not found`);
    }

    if (!response.ok) {
      throw new BadGatewayException('Rick and Morty API returned an error');
    }

    const payload = await this.readJson(response);
    const parsedEpisode = EpisodeSchema.safeParse(payload);

    if (!parsedEpisode.success) {
      throw new BadGatewayException(
        'Rick and Morty API returned invalid episode data',
      );
    }

    return parsedEpisode.data;
  }

  async getCharacters(characterIds: number[]): Promise<Character[]> {
    if (characterIds.length === 0) {
      return [];
    }

    const responses = await Promise.all(
      characterIds.map((characterId) =>
        this.request(`/character/${characterId}`),
      ),
    );

    const characters = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) {
          throw new BadGatewayException('Rick and Morty API returned an error');
        }

        const payload = await this.readJson(response);
        const parsedCharacter = CharacterSchema.safeParse(payload);

        if (!parsedCharacter.success) {
          throw new BadGatewayException(
            'Rick and Morty API returned invalid character data',
          );
        }

        return parsedCharacter.data;
      }),
    );

    return characters;
  }

  private async request(path: string): Promise<Response> {
    for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt += 1) {
      let retryAfter: string | null = null;

      try {
        const response = await fetch(`${this.baseUrl}${path}`);
        retryAfter = response.headers.get('retry-after');

        if (
          !this.shouldRetry(response.status) ||
          attempt === MAX_REQUEST_ATTEMPTS - 1
        ) {
          return response;
        }

        await response.body?.cancel().catch(() => undefined);
      } catch {
        if (attempt === MAX_REQUEST_ATTEMPTS - 1) {
          throw new BadGatewayException('Rick and Morty API is unavailable');
        }
      }

      await this.waitBeforeRetry(attempt, retryAfter);
    }

    throw new BadGatewayException('Rick and Morty API is unavailable');
  }

  private shouldRetry(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
  }

  private async waitBeforeRetry(
    attempt: number,
    retryAfter: string | null,
  ): Promise<void> {
    const exponentialDelay = RETRY_BASE_DELAY_MS * 2 ** attempt;
    const jitter = Math.random() * RETRY_BASE_DELAY_MS;
    const retryAfterDelay = this.getRetryAfterDelay(retryAfter);
    const delay = Math.min(
      retryAfterDelay ?? exponentialDelay + jitter,
      MAX_RETRY_DELAY_MS,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, delay),
    );
  }

  private getRetryAfterDelay(retryAfter: string | null): number | undefined {
    if (!retryAfter) {
      return undefined;
    }

    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1_000;
    }

    const retryAt = Date.parse(retryAfter);
    if (!Number.isNaN(retryAt)) {
      return Math.max(0, retryAt - Date.now());
    }

    return undefined;
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new BadGatewayException('Rick and Morty API returned invalid data');
    }
  }
}
