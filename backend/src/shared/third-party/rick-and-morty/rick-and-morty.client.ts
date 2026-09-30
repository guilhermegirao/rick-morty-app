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

    const response = await this.request(
      `/character/${characterIds.join(',')}`,
    );

    if (!response.ok) {
      throw new BadGatewayException('Rick and Morty API returned an error');
    }

    const payload = await this.readJson(response);
    const characters = Array.isArray(payload) ? payload : [payload];
    const parsedCharacters = CharacterSchema.array().safeParse(characters);

    if (!parsedCharacters.success) {
      throw new BadGatewayException(
        'Rick and Morty API returned invalid character data',
      );
    }

    return parsedCharacters.data;
  }

  private async request(path: string): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`);
    } catch {
      throw new BadGatewayException('Rick and Morty API is unavailable');
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new BadGatewayException('Rick and Morty API returned invalid data');
    }
  }
}
