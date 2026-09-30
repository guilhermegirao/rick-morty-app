import { EpisodeExplorer } from "./episode-explorer";
import { getEpisode } from "@/lib/episodes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialEpisode = await getEpisode(28);

  return <EpisodeExplorer initialEpisode={initialEpisode} />;
}
