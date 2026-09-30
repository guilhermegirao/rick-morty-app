import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;
  private connectionPromise: Promise<void> | undefined;

  constructor(configService: ConfigService) {
    this.client = new Redis(
      configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      {
        password: configService.get<string>('REDIS_PASSWORD') || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      },
    );
    this.client.on('error', (error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      this.logger.debug(`Redis cache read failed for key ${key}`);
      return null;
    }
  }

  async getMany<T>(keys: string[]): Promise<Array<T | null>> {
    if (keys.length === 0) {
      return [];
    }

    try {
      await this.connect();
      const values = await this.client.mget(keys);

      return values.map((value) =>
        value ? (JSON.parse(value) as T) : null,
      );
    } catch {
      this.logger.debug(`Redis cache read failed for ${keys.length} keys`);
      return keys.map(() => null);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.connect();
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.logger.debug(`Redis cache write failed for key ${key}`);
      return;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'ready') {
      await this.client.quit();
    } else if (this.client.status !== 'end') {
      this.client.disconnect();
    }
  }

  private async connect(): Promise<void> {
    if (this.client.status === 'ready') {
      return;
    }

    this.connectionPromise ??= this.client
      .connect()
      .then(() => undefined)
      .catch((error: unknown) => {
        this.connectionPromise = undefined;
        throw error;
      });

    await this.connectionPromise;
  }
}