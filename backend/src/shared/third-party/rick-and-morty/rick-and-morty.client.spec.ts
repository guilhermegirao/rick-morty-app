import { BadGatewayException } from '@nestjs/common';
import { RickAndMortyClient } from './rick-and-morty.client.js';

describe('RickAndMortyClient', () => {
  const configService = {
    getOrThrow: vi.fn().mockReturnValue('https://rickandmortyapi.com/api'),
  };

  it('fetches a batch of character IDs from the vendor', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
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
      ),
    );

    await new RickAndMortyClient(configService).getCharacters([1, 2]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://rickandmortyapi.com/api/character/1,2',
    );
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
