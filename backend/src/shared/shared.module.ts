import { Module } from '@nestjs/common';
import { CacheService } from './cache/cache.service.js';

@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class SharedModule {}