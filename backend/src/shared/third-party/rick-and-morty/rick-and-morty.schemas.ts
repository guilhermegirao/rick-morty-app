import { z } from 'zod';

const ResourceSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const CharacterSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  species: z.string(),
  type: z.string(),
  gender: z.string(),
  origin: ResourceSchema,
  location: ResourceSchema,
  image: z.string(),
  episode: z.array(z.string()),
  url: z.string(),
  created: z.string(),
});

export const EpisodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  air_date: z.string(),
  episode: z.string(),
  characters: z.array(z.string()),
  url: z.string(),
  created: z.string(),
});

export type Character = z.infer<typeof CharacterSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
