import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { RickAndMortyClient } from './rick-and-morty.client.js';

describe('RickAndMortyClient', () => {
  const configService = {
    getOrThrow: vi.fn().mockReturnValue('https://rickandmortyapi.com/api'),
  };

  it('fetches each character ID from the vendor separately', async () => {
    const character = {
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
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(character)))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...character, id: 2 })),
      );

    await new RickAndMortyClient(configService).getCharacters([1, 2]);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://rickandmortyapi.com/api/character/1',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://rickandmortyapi.com/api/character/2',
    );
    fetchMock.mockRestore();
  });

  it('retries transient vendor failures before succeeding', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            name: 'Pilot',
            air_date: 'December 2, 2013',
            episode: 'S01E01',
            characters: [],
            url: 'https://example.com/episode/1',
            created: '2017-11-10T12:56:33.798Z',
          }),
        ),
      );

    const result = await new RickAndMortyClient(configService).getEpisode(1);

    expect(result.id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('does not retry a missing vendor episode', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      new RickAndMortyClient(configService).getEpisode(1),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });

  it('retries network failures before succeeding', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            name: 'Pilot',
            air_date: 'December 2, 2013',
            episode: 'S01E01',
            characters: [],
            url: 'https://example.com/episode/1',
            created: '2017-11-10T12:56:33.798Z',
          }),
        ),
      );

    const result = await new RickAndMortyClient(configService).getEpisode(1);

    expect(result.id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('stops after the maximum number of attempts', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      new RickAndMortyClient(configService).getEpisode(1),
    ).rejects.toBeInstanceOf(BadGatewayException);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mockRestore();
  });

  it('rejects malformed vendor character payloads', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ name: 'Rick' })),
    );

    await expect(
      new RickAndMortyClient(configService).getCharacters([1]),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
