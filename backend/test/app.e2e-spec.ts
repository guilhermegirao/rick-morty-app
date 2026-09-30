import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { EpisodesService } from './../src/modules/episodes/episodes.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EpisodesService)
      .useValue({
        getEpisodeCharacters: vi.fn().mockResolvedValue({
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
              origin: 'Earth',
              location: 'Earth',
              image: 'https://example.com/1.png',
              episodes: [1],
            },
          ],
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/episodes/28/characters (GET)', () => {
    return request(app.getHttpServer())
      .get('/episodes/28/characters')
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(28);
        expect(body.characters[0].name).toBe('Rick Sanchez');
        expect(body.characters[0].episodes).toEqual([1]);
        expect(body.url).toBeUndefined();
        expect(body.characters[0].url).toBeUndefined();
      });
  });

  it('/episodes/not-an-id/characters (GET)', () => {
    return request(app.getHttpServer())
      .get('/episodes/not-an-id/characters')
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
