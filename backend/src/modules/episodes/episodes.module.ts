import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module.js';
import { EpisodesController } from './episodes.controller.js';
import { EpisodesService } from './episodes.service.js';

@Module({
  imports: [SharedModule],
  controllers: [EpisodesController],
  providers: [EpisodesService],
})
export class EpisodesModule {}