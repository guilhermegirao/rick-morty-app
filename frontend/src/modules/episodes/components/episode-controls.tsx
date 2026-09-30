import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EpisodeControlsProps = {
  episodeId: string;
  error: string;
  isFetching: boolean;
  onEpisodeIdChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onQueryChange: (value: string) => void;
  query: string;
};

const metaLabel = "text-xs tracking-wide text-muted-ink";

export function EpisodeControls({
  episodeId,
  error,
  isFetching,
  onEpisodeIdChange,
  onSubmit,
  onQueryChange,
  query,
}: EpisodeControlsProps) {
  return (
    <>
      <section className="flex flex-col items-stretch justify-between gap-8 border-y border-ink py-4 md:flex-row md:items-end" aria-label="Episode controls">
        <form className="w-full md:w-80 md:flex-none" onSubmit={onSubmit}>
          <label className={`${metaLabel} mb-2 block`} htmlFor="episode-number">Jump to episode</label>
          <div className="flex h-12 items-center bg-ink pl-4 text-acid">
            <span className="font-mono" aria-hidden="true">#</span>
            <Input
              className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 text-acid shadow-none outline-none focus-visible:border-signal focus-visible:ring-2 focus-visible:ring-signal"
              id="episode-number"
              inputMode="numeric"
              name="episode"
              aria-describedby={error ? "episode-error" : undefined}
              aria-invalid={Boolean(error)}
              min="1"
              onChange={(event) => onEpisodeIdChange(event.target.value)}
              type="number"
              value={episodeId}
            />
            <Button className="mr-2 h-8 rounded-none px-3 text-xs font-bold" disabled={isFetching} type="submit" variant="default">
              {isFetching ? "Loading..." : "Open episode"}
            </Button>
          </div>
        </form>
        <label className="w-full md:max-w-xs md:flex-1">
          <span className={`${metaLabel} mb-2 block`}>Search the cast</span>
          <Input
            className="h-auto rounded-none border-0 border-b border-ink px-0 pb-3 text-ink shadow-none outline-none focus-visible:border-signal focus-visible:ring-2 focus-visible:ring-signal"
            onChange={(event) => onQueryChange(event.target.value)}
            name="cast-search"
            placeholder="Name, species, or origin..."
            type="search"
            value={query}
          />
        </label>
      </section>
      {error ? <p className="mt-4 bg-error-surface px-4 py-3 text-sm text-error-foreground" id="episode-error" role="alert">{error}</p> : null}
    </>
  );
}
