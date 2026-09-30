import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { EpisodesService } from './episodes.service.js';

describe('EpisodesService', () => {
  it('resolves character URLs with one batch request and sorts by name', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith('/episode/28')) {
          return new Response(
            JSON.stringify({
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
            }),
          );
        }

        expect(url).toBe(
          'https://rickandmortyapi.com/api/character/2,1',
        );
        return new Response(
          JSON.stringify([
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
              episode: [],
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
              episode: [],
              url: 'https://example.com/character/1',
              created: '2017-11-04T18:48:46.250Z',
            },
          ]),
        );
      },
    );

    const service = new EpisodesService(cache);
    const result = await service.getEpisodeCharacters(28);

    expect(result.characters.map((character) => character.name)).toEqual([
      'Morty Smith',
      'Rick Sanchez',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cache.set).toHaveBeenCalledOnce();

    fetchMock.mockRestore();
  });

  it('returns cached data without calling the upstream API', async () => {
    const cachedResponse = {
      id: 28,
      name: 'The Ricklantis Mixup',
      air_date: 'September 10, 2017',
      episode: 'S03E07',
      characters: [
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
          episode: [],
          url: 'https://example.com/character/1',
          created: '2017-11-04T18:48:46.250Z',
        },
      ],
      url: 'https://rickandmortyapi.com/api/episode/28',
      created: '2017-11-10T12:56:36.618Z',
    };
    const cache = {
      get: vi.fn().mockResolvedValue(cachedResponse),
      set: vi.fn(),
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const result = await new EpisodesService(cache).getEpisodeCharacters(28);

    expect(result).toEqual(cachedResponse);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it('maps an upstream error to a bad gateway error', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 503 }),
    );

    await expect(
      new EpisodesService(cache).getEpisodeCharacters(28),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps a missing episode to a not found error', async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 404 }),
    );

    await expect(
      new EpisodesService(cache).getEpisodeCharacters(28),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});