import { EpisodeExplorer } from "@/modules/episodes/episode-explorer";
import { getEpisode } from "@/modules/episodes/lib/episodes";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{
    episode?: string;
    q?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requestedEpisode = Number(params.episode);
  const episodeId = Number.isInteger(requestedEpisode) && requestedEpisode >= 1
    ? requestedEpisode
    : 28;
  const initialEpisode = await getEpisode(episodeId);

  return <EpisodeExplorer initialEpisode={initialEpisode} initialQuery={params.q ?? ""} />;
}
