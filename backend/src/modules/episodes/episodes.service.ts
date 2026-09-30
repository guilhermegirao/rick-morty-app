import {
  BadGatewayException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CacheService } from '../../shared/cache/cache.service.js';
import { RickAndMortyClient } from '../../shared/third-party/rick-and-morty/rick-and-morty.client.js';
import type {
  Character,
  Episode,
} from '../../shared/third-party/rick-and-morty/rick-and-morty.schemas.js';

const CACHE_TTL_SECONDS = 300;

export type EpisodeCharactersResponse = Omit<Episode, 'characters'> & {
  characters: Character[];
};

export type CacheStore = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
};

@Injectable()
export class EpisodesService {
  constructor(
    @Inject(CacheService) private readonly cache: CacheStore,
    @Inject(RickAndMortyClient)
    private readonly thirdPartyClient: RickAndMortyClient,
  ) {}

  async getEpisodeCharacters(
    episodeId: number,
  ): Promise<EpisodeCharactersResponse> {
    const cacheKey = `episode:${episodeId}:characters`;
    const cached = await this.cache.get<EpisodeCharactersResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const episode = await this.thirdPartyClient.getEpisode(episodeId);
    const characterIds = episode.characters.map((characterUrl) =>
      this.getCharacterId(characterUrl),
    );
    const characters = await this.thirdPartyClient.getCharacters([
      ...new Set(characterIds),
    ]);
    const response = {
      ...episode,
      characters: characters.sort((first, second) =>
        first.name.localeCompare(second.name, undefined, {
          sensitivity: 'base',
        }),
      ),
    };

    await this.cache.set(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  private getCharacterId(characterUrl: string): number {
    let characterId: number;

    try {
      characterId = Number(new URL(characterUrl).pathname.split('/').pop());
    } catch {
      throw new BadGatewayException(
        'Rick and Morty API returned an invalid character URL',
      );
    }

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw new BadGatewayException(
        'Rick and Morty API returned an invalid character URL',
      );
    }

    return characterId;
  }

}