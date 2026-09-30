import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from '../../shared/cache/cache.service.js';

const API_BASE_URL = 'https://rickandmortyapi.com/api';
const CACHE_TTL_SECONDS = 300;

type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: { name: string; url: string };
  location: { name: string; url: string };
  image: string;
  episode: string[];
  url: string;
  created: string;
  [key: string]: unknown;
};

type Episode = {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: string[];
  url: string;
  created: string;
};

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
  ) {}

  async getEpisodeCharacters(
    episodeId: number,
  ): Promise<EpisodeCharactersResponse> {
    const cacheKey = `episode:${episodeId}:characters`;
    const cached = await this.cache.get<EpisodeCharactersResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const episode = await this.fetchEpisode(episodeId);
    const characterIds = episode.characters.map((characterUrl) =>
      this.getCharacterId(characterUrl),
    );
    const characters = await this.fetchCharacters(characterIds);
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

  private async fetchEpisode(episodeId: number): Promise<Episode> {
    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}/episode/${episodeId}`);
    } catch {
      throw new BadGatewayException('Rick and Morty API is unavailable');
    }

    if (response.status === 404) {
      throw new NotFoundException(`Episode ${episodeId} was not found`);
    }

    if (!response.ok) {
      throw new BadGatewayException('Rick and Morty API returned an error');
    }

    const episode = await this.readJson<unknown>(response);

    if (!this.isEpisode(episode)) {
      throw new BadGatewayException('Rick and Morty API returned invalid data');
    }

    return episode;
  }

  private async fetchCharacters(characterIds: number[]): Promise<Character[]> {
    if (characterIds.length === 0) {
      return [];
    }

    let response: Response;

    try {
      response = await fetch(
        `${API_BASE_URL}/character/${characterIds.join(',')}`,
      );
    } catch {
      throw new BadGatewayException('Rick and Morty API is unavailable');
    }

    if (!response.ok) {
      throw new BadGatewayException('Rick and Morty API returned an error');
    }

    const payload = await this.readJson<unknown>(response);
    const characters = Array.isArray(payload) ? payload : [payload];

    if (!characters.every((character) => this.isCharacter(character))) {
      throw new BadGatewayException('Rick and Morty API returned invalid data');
    }

    return characters;
  }

  private async readJson<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException('Rick and Morty API returned invalid data');
    }
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

  private isEpisode(value: unknown): value is Episode {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const episode = value as Partial<Episode>;
    return (
      typeof episode.id === 'number' &&
      typeof episode.name === 'string' &&
      typeof episode.air_date === 'string' &&
      typeof episode.episode === 'string' &&
      Array.isArray(episode.characters) &&
      episode.characters.every((character) => typeof character === 'string') &&
      typeof episode.url === 'string' &&
      typeof episode.created === 'string'
    );
  }

  private isCharacter(value: unknown): value is Character {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const character = value as Partial<Character>;
    return (
      typeof character.id === 'number' &&
      typeof character.name === 'string' &&
      typeof character.status === 'string' &&
      typeof character.species === 'string' &&
      typeof character.type === 'string' &&
      typeof character.gender === 'string' &&
      this.isNamedResource(character.origin) &&
      this.isNamedResource(character.location) &&
      typeof character.image === 'string' &&
      Array.isArray(character.episode) &&
      character.episode.every((episode) => typeof episode === 'string') &&
      typeof character.url === 'string' &&
      typeof character.created === 'string'
    );
  }

  private isNamedResource(
    value: unknown,
  ): value is { name: string; url: string } {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const resource = value as { name?: unknown; url?: unknown };
    return typeof resource.name === 'string' && typeof resource.url === 'string';
  }
}