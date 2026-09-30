import { ApiProperty } from '@nestjs/swagger';

export class CharacterDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Rick Sanchez' })
  name!: string;

  @ApiProperty({ example: 'Alive' })
  status!: string;

  @ApiProperty({ example: 'Human' })
  species!: string;

  @ApiProperty({ example: '' })
  type!: string;

  @ApiProperty({ example: 'Male' })
  gender!: string;

  @ApiProperty({ example: 'Earth' })
  origin!: string;

  @ApiProperty({ example: 'Earth' })
  location!: string;

  @ApiProperty({ example: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg' })
  image!: string;

  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
  })
  episodes!: number[];
}

export class EpisodeCharactersResponseDto {
  @ApiProperty({ example: 28 })
  id!: number;

  @ApiProperty({ example: 'The Ricklantis Mixup' })
  name!: string;

  @ApiProperty({ example: 'September 10, 2017' })
  air_date!: string;

  @ApiProperty({ example: 'S03E07' })
  episode!: string;

  @ApiProperty({ type: [CharacterDto] })
  characters!: CharacterDto[];
}
