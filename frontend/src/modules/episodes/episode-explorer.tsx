"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CharacterGrid } from "@/modules/episodes/components/character-grid";
import { EpisodeControls } from "@/modules/episodes/components/episode-controls";
import { EpisodeHeader } from "@/modules/episodes/components/episode-header";
import { getEpisode, type Episode } from "@/modules/episodes/lib/episodes";

type EpisodeExplorerProps = {
  initialEpisode: Episode;
  initialQuery: string;
};

const metaLabel = "text-xs tracking-wide text-muted-ink";

function syncUrl(episodeId: number, query: string) {
  const params = new URLSearchParams({ episode: String(episodeId) });

  if (query) {
    params.set("q", query);
  }

  window.history.replaceState(null, "", `?${params.toString()}`);
}

export function EpisodeExplorer({ initialEpisode, initialQuery }: EpisodeExplorerProps) {
  const [episodeId, setEpisodeId] = useState(String(initialEpisode.id));
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(initialEpisode.id);
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState("");
  const { data: episode = initialEpisode, error: queryError, isFetching } = useQuery({
    queryKey: ["episode", selectedEpisodeId],
    queryFn: () => getEpisode(selectedEpisodeId),
    initialData: selectedEpisodeId === initialEpisode.id ? initialEpisode : undefined,
    placeholderData: (previousEpisode) => previousEpisode,
  });

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return episode.characters;
    }

    return episode.characters.filter((character) =>
      [character.name, character.species, character.origin, character.location, character.gender]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [episode.characters, query]);

  function loadEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedId = Number(episodeId);

    if (!Number.isInteger(requestedId) || requestedId < 1) {
      setError("Enter a positive episode number.");
      return;
    }

    setError("");
    setSelectedEpisodeId(requestedId);
    setQuery("");
    syncUrl(requestedId, "");
  }

  function updateQuery(value: string) {
    setQuery(value);
    syncUrl(selectedEpisodeId, value);
  }

  const requestError = queryError instanceof Error ? queryError.message : "";
  const visibleError = error || requestError;

  return (
    <main aria-busy={isFetching} className="mx-auto max-w-7xl px-6 py-8 font-sans text-ink sm:py-5 md:px-12 lg:px-20">
      <header className="flex items-center justify-between border-b border-ink pb-4">
        <Link className="flex items-center gap-2 text-sm font-semibold text-inherit no-underline" href="/" aria-label="Rick and Morty home">
          <span className="inline-flex size-7 w-9 items-center justify-center bg-ink font-mono text-xs text-acid" aria-hidden="true">RM</span>
          <span>Rick and Morty</span>
        </Link>
      </header>

      <EpisodeHeader episode={episode} />
      <EpisodeControls
        episodeId={episodeId}
        error={visibleError}
        isFetching={isFetching}
        onEpisodeIdChange={setEpisodeId}
        onQueryChange={updateQuery}
        onSubmit={loadEpisode}
        query={query}
      />

      <p className="sr-only" aria-live="polite">{isFetching ? "Loading episode..." : `${filteredCharacters.length} characters shown`}</p>
      <CharacterGrid characters={filteredCharacters} onClearQuery={() => updateQuery("")} query={query} />

      <footer className="mt-16 flex flex-col gap-2 border-t border-line pt-4 text-xs leading-relaxed tracking-wide text-muted-ink sm:flex-row sm:items-center sm:justify-between">
        <span>Data supplied by the Rick and Morty API</span>
        <span className={metaLabel}>Cached for faster jumps between dimensions</span>
      </footer>
    </main>
  );
}
