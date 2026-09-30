import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './../src/app.module.js';
import { EpisodesService } from './../src/modules/episodes/episodes.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let getEpisodeCharacters: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EpisodesService)
      .useValue({
        getEpisodeCharacters: (getEpisodeCharacters = vi.fn()).mockResolvedValue({
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
        expect(body.characters[0].origin).toBe('Earth');
        expect(body.characters[0].location).toBe('Earth');
        expect(body.url).toBeUndefined();
        expect(body.created).toBeUndefined();
        expect(body.characters[0].url).toBeUndefined();
        expect(body.characters[0].created).toBeUndefined();
      });
  });

  it('maps a missing episode to 404', () => {
    getEpisodeCharacters.mockRejectedValueOnce(new NotFoundException());

    return request(app.getHttpServer())
      .get('/episodes/28/characters')
      .expect(404);
  });

  it('maps an upstream failure to 502', () => {
    getEpisodeCharacters.mockRejectedValueOnce(new BadGatewayException());

    return request(app.getHttpServer())
      .get('/episodes/28/characters')
      .expect(502);
  });

  it('/episodes/not-an-id/characters (GET)', () => {
    return request(app.getHttpServer())
      .get('/episodes/not-an-id/characters')
      .expect(400);
  });

  it('documents the episode characters route and lean response', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test API').build(),
    );
    const operation = document.paths['/episodes/{id}/characters'].get;
    const responseSchema = document.components?.schemas
      ?.EpisodeCharactersResponseDto as {
      properties?: Record<string, unknown>;
    };

    expect(operation).toBeDefined();
    expect(responseSchema.properties).not.toHaveProperty('url');
    expect(responseSchema.properties).not.toHaveProperty('created');
    expect(responseSchema.properties).toHaveProperty('characters');

    const characterSchema = document.components?.schemas?.CharacterDto as {
      properties?: Record<string, { type?: string; items?: { type?: string } }>;
    };
    expect(characterSchema.properties?.origin.type).toBe('string');
    expect(characterSchema.properties?.location.type).toBe('string');
    expect(characterSchema.properties?.episodes).toMatchObject({
      type: 'array',
      items: { type: 'number' },
    });
    expect(characterSchema.properties).not.toHaveProperty('url');
    expect(characterSchema.properties).not.toHaveProperty('created');
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
