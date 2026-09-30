import type { Episode } from "@/modules/episodes/lib/episodes";

type EpisodeHeaderProps = {
  episode: Episode;
};

export function EpisodeHeader({ episode }: EpisodeHeaderProps) {
  return (
    <section className="flex min-h-0 flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-end md:py-20" aria-labelledby="page-title">
      <div>
        <p className="mb-4 text-xs tracking-wide text-signal">Now viewing</p>
        <h1 id="page-title" className="max-w-4xl text-5xl font-medium leading-none tracking-tight sm:text-6xl lg:text-7xl">{episode.name}</h1>
      </div>
      <div className="mb-2 flex w-36 flex-col border-l border-ink py-1 pl-5" aria-label="Current episode coordinate">
        <span className="text-xs text-muted-ink">Coordinate</span>
        <strong className="my-3 font-mono text-4xl font-normal">{episode.episode}</strong>
        <small className="text-xs text-muted-ink">{episode.air_date}</small>
      </div>
    </section>
  );
}
