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

const CACHE_TTL_SECONDS = 86_400;

export type EpisodeCharactersResponse = Omit<Episode, 'characters'> & {
  characters: Character[];
};

export type CacheStore = {
  get<T>(key: string): Promise<T | null>;
  getMany<T>(keys: string[]): Promise<Array<T | null>>;
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
    const episodeCacheKey = `episode:${episodeId}`;
    const cachedEpisode = await this.cache.get<Episode>(episodeCacheKey);
    const episode =
      cachedEpisode ?? (await this.thirdPartyClient.getEpisode(episodeId));

    if (!cachedEpisode) {
      await this.cache.set(episodeCacheKey, episode, CACHE_TTL_SECONDS);
    }

    const characterIds = episode.characters.map((characterUrl) =>
      this.getCharacterId(characterUrl),
    );
    const uniqueCharacterIds = [...new Set(characterIds)];
    const characterKeys = uniqueCharacterIds.map(
      (characterId) => `character:${characterId}`,
    );
    const cachedCharacters = await this.cache.getMany<Character>(characterKeys);
    const missingCharacterIds = uniqueCharacterIds.filter(
      (_, index) => cachedCharacters[index] === null,
    );
    const fetchedCharacters = missingCharacterIds.length
      ? await this.thirdPartyClient.getCharacters(missingCharacterIds)
      : [];
    const fetchedById = new Map(
      fetchedCharacters.map((character) => [character.id, character]),
    );
    const characters = uniqueCharacterIds.map((characterId, index) => {
      const character = cachedCharacters[index] ?? fetchedById.get(characterId);

      if (!character) {
        throw new BadGatewayException(
          `Rick and Morty API did not return character ${characterId}`,
        );
      }

      return character;
    });

    await Promise.all(
      fetchedCharacters.map((character) =>
        this.cache.set(
          `character:${character.id}`,
          character,
          CACHE_TTL_SECONDS,
        ),
      ),
    );
    const response = {
      ...episode,
      characters: characters.sort((first, second) =>
        first.name.localeCompare(second.name, undefined, {
          sensitivity: 'base',
        }),
      ),
    };

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