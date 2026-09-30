import {
  BadGatewayException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EpisodesService } from './episodes.service.js';
import { EpisodeCharactersResponseDto } from './episodes.dto.js';

@Controller('episodes')
@ApiTags('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get(':id/characters')
  @ApiOperation({ summary: 'Get an episode with its characters' })
  @ApiParam({ name: 'id', type: Number, example: 28 })
  @ApiOkResponse({ type: EpisodeCharactersResponseDto })
  @ApiNotFoundResponse({
    description: 'The episode does not exist',
    type: NotFoundException,
  })
  @ApiBadGatewayResponse({
    description: 'The Rick and Morty API returned an error',
    type: BadGatewayException,
  })
  getEpisodeCharacters(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.getEpisodeCharacters(id);
  }
}