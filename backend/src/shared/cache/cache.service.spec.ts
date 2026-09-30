import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service.js';

const redis = vi.hoisted(() => ({
  status: 'ready',
  on: vi.fn(),
  connect: vi.fn(),
  get: vi.fn(),
  mget: vi.fn(),
  set: vi.fn(),
  quit: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('ioredis', () => ({
  Redis: vi.fn(function RedisMock() {
    return redis;
  }),
}));

describe('CacheService', () => {
  const configService = {
    get: vi.fn().mockReturnValue('redis://localhost:6379'),
  } as unknown as ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails open when a single-key read fails', async () => {
    redis.get.mockRejectedValue(new Error('Redis unavailable'));
    const cache = new CacheService(configService);

    await expect(cache.get('episode:28')).resolves.toBeNull();
  });

  it('fails open when a batch read fails', async () => {
    redis.mget.mockRejectedValue(new Error('Redis unavailable'));
    const cache = new CacheService(configService);

    await expect(cache.getMany(['character:1', 'character:2'])).resolves.toEqual([
      null,
      null,
    ]);
  });

  it('fails open when a write fails', async () => {
    redis.set.mockRejectedValue(new Error('Redis unavailable'));
    const cache = new CacheService(configService);

    await expect(cache.set('episode:28', { id: 28 }, 86_400)).resolves.toBeUndefined();
  });
});
