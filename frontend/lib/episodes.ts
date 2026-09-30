import { z } from "zod";
import { env } from "@/lib/env";

export type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: string;
  location: string;
  image: string;
  episodes: number[];
};

export type Episode = {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: Character[];
};

const API_URL =
  env.NEXT_PUBLIC_API_URL;

const characterSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  species: z.string(),
  type: z.string(),
  gender: z.string(),
  origin: z.string(),
  location: z.string(),
  image: z.string().url(),
  episodes: z.array(z.number()),
});

const episodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  air_date: z.string(),
  episode: z.string(),
  characters: z.array(characterSchema),
});

export async function getEpisode(id: number): Promise<Episode> {
  const response = await fetch(`${API_URL}/episodes/${id}/characters`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Episode ${id} was not found.`);
    }

    throw new Error("The episode archive is unavailable right now.");
  }

  return episodeSchema.parse(await response.json());
}
