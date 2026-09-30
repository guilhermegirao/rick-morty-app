import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { EpisodesService } from './episodes.service.js';

const episode = {
  id: 28,
  name: 'The Ricklantis Mixup',
  air_date: 'September 10, 2017',
  episode: 'S03E07',
  characters: [
    'https://rickandmortyapi.com/api/character/2',
    'https://rickandmortyapi.com/api/character/1',
  ],
  url: 'https://rickandmortyapi.com/api/episode/28',
  created: '2017-11-10T12:56:36.618Z',
};

const characters = [
  {
    id: 2,
    name: 'Morty Smith',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: { name: 'Earth', url: '' },
    location: { name: 'Earth', url: '' },
    image: 'https://example.com/2.png',
    episode: [
      'https://rickandmortyapi.com/api/episode/2',
      'https://rickandmortyapi.com/api/episode/1',
    ],
    url: 'https://example.com/character/2',
    created: '2017-11-04T18:50:21.651Z',
  },
  {
    id: 1,
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: { name: 'Earth', url: '' },
    location: { name: 'Earth', url: '' },
    image: 'https://example.com/1.png',
    episode: ['https://rickandmortyapi.com/api/episode/1'],
    url: 'https://example.com/character/1',
    created: '2017-11-04T18:48:46.250Z',
  },
];

describe('EpisodesService', () => {
  it('sorts characters and caches fresh character records', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      getMany: vi.fn().mockResolvedValue([null, null]),
      set: vi.fn().mockResolvedValue(undefined),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn().mockResolvedValue(episode),
      getCharacters: vi.fn().mockResolvedValue(characters),
    };

    const result = await new EpisodesService(
      cache,
      thirdPartyClient,
    ).getEpisodeCharacters(28);

    expect(result.characters.map((character) => character.name)).toEqual([
      'Morty Smith',
      'Rick Sanchez',
    ]);
    expect(thirdPartyClient.getCharacters).toHaveBeenCalledWith(
      [2, 1],
    );
    expect(cache.set).toHaveBeenCalledTimes(3);
    expect(cache.set).toHaveBeenCalledWith(
      'episode:28',
      episode,
      86_400,
    );
    expect(cache.set).toHaveBeenCalledWith(
      'character:2',
      characters[0],
      86_400,
    );
    expect(cache.set).toHaveBeenCalledWith(
      'character:1',
      characters[1],
      86_400,
    );
  });

  it('returns an empty character list without fetching characters', async () => {
    const emptyEpisode = { ...episode, characters: [] };
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      getMany: vi.fn().mockResolvedValue([]),
      set: vi.fn().mockResolvedValue(undefined),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn().mockResolvedValue(emptyEpisode),
      getCharacters: vi.fn(),
    };

    const result = await new EpisodesService(
      cache,
      thirdPartyClient,
    ).getEpisodeCharacters(28);

    expect(result.characters).toEqual([]);
    expect(thirdPartyClient.getCharacters).not.toHaveBeenCalled();
  });

  it('deduplicates duplicate character references before fetching', async () => {
    const duplicateEpisode = {
      ...episode,
      characters: [episode.characters[0], episode.characters[0], episode.characters[1]],
    };
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      getMany: vi.fn().mockResolvedValue([null, null]),
      set: vi.fn().mockResolvedValue(undefined),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn().mockResolvedValue(duplicateEpisode),
      getCharacters: vi.fn().mockResolvedValue(characters),
    };

    await new EpisodesService(cache, thirdPartyClient).getEpisodeCharacters(28);

    expect(thirdPartyClient.getCharacters).toHaveBeenCalledWith([2, 1]);
  });

  it('rejects malformed episode character URLs', async () => {
    const malformedEpisode = { ...episode, characters: ['not-a-url'] };
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      getMany: vi.fn(),
      set: vi.fn(),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn().mockResolvedValue(malformedEpisode),
      getCharacters: vi.fn(),
    };

    await expect(
      new EpisodesService(cache, thirdPartyClient).getEpisodeCharacters(28),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(cache.getMany).not.toHaveBeenCalled();
  });

  it('uses cached characters without calling the vendor for them', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(episode),
      getMany: vi.fn().mockResolvedValue(characters),
      set: vi.fn(),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn(),
      getCharacters: vi.fn(),
    };

    const result = await new EpisodesService(
      cache,
      thirdPartyClient,
    ).getEpisodeCharacters(28);

    expect(result).toEqual({
      id: 28,
      name: 'The Ricklantis Mixup',
      air_date: 'September 10, 2017',
      episode: 'S03E07',
      characters: [
        {
          id: 2,
          name: 'Morty Smith',
          status: 'Alive',
          species: 'Human',
          type: '',
          gender: 'Male',
          origin: 'Earth',
          location: 'Earth',
          image: 'https://example.com/2.png',
          episodes: [2, 1],
        },
        {
          id: 1,
          name: 'Rick Sanchez',
          status: 'Alive',
          species: 'Human',
          type: '',
          gender: 'Male',
          origin: 'Earth',
          location: 'Earth',
          image: 'https://example.com/1.png',
          episodes: [1],
        },
      ],
    });
    expect(thirdPartyClient.getEpisode).not.toHaveBeenCalled();
    expect(thirdPartyClient.getCharacters).not.toHaveBeenCalled();
  });

  it('fetches and caches only missing characters', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(episode),
      getMany: vi.fn().mockResolvedValue([characters[0], null]),
      set: vi.fn().mockResolvedValue(undefined),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn().mockResolvedValue(episode),
      getCharacters: vi.fn().mockResolvedValue([characters[1]]),
    };

    const result = await new EpisodesService(
      cache,
      thirdPartyClient,
    ).getEpisodeCharacters(28);

    expect(result.characters.map((character) => character.name)).toEqual([
      'Morty Smith',
      'Rick Sanchez',
    ]);
    expect(thirdPartyClient.getCharacters).toHaveBeenCalledWith([1]);
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it('rejects malformed character episode URLs', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(episode),
      getMany: vi.fn().mockResolvedValue([
        { ...characters[0], episode: ['not-a-url'] },
        characters[1],
      ]),
      set: vi.fn(),
    };
    const thirdPartyClient = {
      getEpisode: vi.fn(),
      getCharacters: vi.fn(),
    };

    await expect(
      new EpisodesService(cache, thirdPartyClient).getEpisodeCharacters(28),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('propagates upstream not found and gateway errors', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      getMany: vi.fn().mockResolvedValue([]),
      set: vi.fn(),
    };
    const notFoundClient = {
      getEpisode: vi.fn().mockRejectedValue(new NotFoundException()),
      getCharacters: vi.fn(),
    };
    const unavailableClient = {
      getEpisode: vi.fn().mockRejectedValue(new BadGatewayException()),
      getCharacters: vi.fn(),
    };

    await expect(
      new EpisodesService(cache, notFoundClient).getEpisodeCharacters(28),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      new EpisodesService(cache, unavailableClient).getEpisodeCharacters(28),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
