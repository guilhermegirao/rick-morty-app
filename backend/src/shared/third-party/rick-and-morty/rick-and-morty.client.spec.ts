import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { RickAndMortyClient } from './rick-and-morty.client.js';

describe('RickAndMortyClient', () => {
  const configService = {
    getOrThrow: vi.fn().mockReturnValue('https://rickandmortyapi.com/api'),
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

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
      dimension: 'Dimension C-137',
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(character)))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...character, id: 2 })),
      );

    const result = await new RickAndMortyClient(configService).getCharacters([
      1,
      2,
    ]);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://rickandmortyapi.com/api/character/1',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://rickandmortyapi.com/api/character/2',
    );
    expect(result[0]).toHaveProperty('dimension', 'Dimension C-137');
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
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://rickandmortyapi.com/api/episode/1',
    );
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

  it.each([408, 429])(
    'retries transient HTTP status %s before succeeding',
    async (status) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(null, { status }))
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

      await expect(
        new RickAndMortyClient(configService).getEpisode(1),
      ).resolves.toMatchObject({ id: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      fetchMock.mockRestore();
    },
  );

  it('respects Retry-After before retrying a rate-limited request', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { 'Retry-After': '1' },
        }),
      )
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

    try {
      const request = new RickAndMortyClient(configService).getEpisode(1);
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(999);
      expect(fetchMock).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(1);
      await expect(request).resolves.toMatchObject({ id: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      fetchMock.mockRestore();
      vi.useRealTimers();
    }
  });

  it('caps an excessive Retry-After delay', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { 'Retry-After': '60' },
        }),
      )
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

    const request = new RickAndMortyClient(configService).getEpisode(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(4_999);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toMatchObject({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps an exhausted network failure to BadGatewayException', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network failure'));

    await expect(
      new RickAndMortyClient(configService).getEpisode(1),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mockRestore();
  });

  it('rejects invalid JSON from the vendor', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{invalid-json'));

    await expect(
      new RickAndMortyClient(configService).getEpisode(1),
    ).rejects.toBeInstanceOf(BadGatewayException);
    fetchMock.mockRestore();
  });

  it('rejects malformed vendor episode payloads', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 1 })));

    await expect(
      new RickAndMortyClient(configService).getEpisode(1),
    ).rejects.toBeInstanceOf(BadGatewayException);
    fetchMock.mockRestore();
  });

  it('rejects malformed vendor character payloads', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ name: 'Rick' })),
    );

    await expect(
      new RickAndMortyClient(configService).getCharacters([1]),
    ).rejects.toBeInstanceOf(BadGatewayException);
    fetchMock.mockRestore();
  });
});
