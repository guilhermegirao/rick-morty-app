import { BadGatewayException } from '@nestjs/common';
import type {
  Character,
  Episode,
} from '../../shared/third-party/rick-and-morty/rick-and-morty.schemas.js';

export type CharacterResponse = Omit<
  Character,
  'origin' | 'location' | 'episode' | 'url' | 'created'
> & {
  origin: string;
  location: string;
  episodes: number[];
};

export type EpisodeCharactersResponse = Omit<
  Episode,
  'characters' | 'url' | 'created'
> & {
  characters: CharacterResponse[];
};

export function toEpisodeCharactersResponse(
  episode: Episode,
  characters: Character[],
): EpisodeCharactersResponse {
  return {
    id: episode.id,
    name: episode.name,
    air_date: episode.air_date,
    episode: episode.episode,
    characters: characters.map(toCharacterResponse),
  };
}

function toCharacterResponse(character: Character): CharacterResponse {
  return {
    id: character.id,
    name: character.name,
    status: character.status,
    species: character.species,
    type: character.type,
    gender: character.gender,
    origin: character.origin.name,
    location: character.location.name,
    image: character.image,
    episodes: character.episode.map(getEpisodeId),
  };
}

function getEpisodeId(episodeUrl: string): number {
  let episodeId: number;

  try {
    episodeId = Number(new URL(episodeUrl).pathname.split('/').pop());
  } catch {
    throw new BadGatewayException(
      'Rick and Morty API returned an invalid episode URL',
    );
  }

  if (!Number.isInteger(episodeId) || episodeId < 1) {
    throw new BadGatewayException(
      'Rick and Morty API returned an invalid episode URL',
    );
  }

  return episodeId;
}
