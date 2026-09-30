import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module.js';
import { RickAndMortyClient } from '../../shared/third-party/rick-and-morty/rick-and-morty.client.js';
import { EpisodesController } from './episodes.controller.js';
import { EpisodesService } from './episodes.service.js';

@Module({
  imports: [SharedModule],
  controllers: [EpisodesController],
  providers: [EpisodesService, RickAndMortyClient],
})
export class EpisodesModule {}