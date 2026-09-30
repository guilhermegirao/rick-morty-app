import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EpisodesService } from './episodes.service.js';

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get(':id/characters')
  getEpisodeCharacters(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.getEpisodeCharacters(id);
  }
}