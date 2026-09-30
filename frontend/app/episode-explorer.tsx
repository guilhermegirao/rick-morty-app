"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEpisode, type Episode } from "@/lib/episodes";

type EpisodeExplorerProps = {
  initialEpisode: Episode;
};

const statusClass: Record<string, string> = {
  Alive: "bg-status-alive",
  Dead: "bg-signal",
  unknown: "bg-status-unknown",
};

const metaLabel = "text-xs tracking-wide text-muted-ink";
export function EpisodeExplorer({ initialEpisode }: EpisodeExplorerProps) {
  const [episodeId, setEpisodeId] = useState(String(initialEpisode.id));
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(initialEpisode.id);
  const [query, setQuery] = useState("");
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
      [character.name, character.species, character.origin]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [episode.characters, query]);

  function loadEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedId = Number(episodeId);

    if (!Number.isInteger(requestedId) || requestedId < 1 || requestedId > 51) {
      setError("Enter an episode number from 1 to 51.");
      return;
    }

    setError("");
    setSelectedEpisodeId(requestedId);
    setQuery("");
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

      <section className="flex flex-col items-stretch justify-between gap-8 border-y border-ink py-4 md:flex-row md:items-end" aria-label="Episode controls">
        <form className="w-full md:w-80 md:flex-none" onSubmit={loadEpisode}>
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
              max="51"
              onChange={(event) => setEpisodeId(event.target.value)}
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
            onChange={(event) => setQuery(event.target.value)}
            name="cast-search"
            placeholder="Name, species, or origin..."
            type="search"
            value={query}
          />
        </label>
      </section>

      {visibleError ? <p className="mt-4 bg-error-surface px-4 py-3 text-sm text-error-foreground" id="episode-error" role="alert">{visibleError}</p> : null}

      <p className="sr-only" aria-live="polite">{isFetching ? "Loading episode..." : `${filteredCharacters.length} characters shown`}</p>
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4">
        {filteredCharacters.map((character, index) => (
          <article className="group min-w-0 border border-line bg-surface" key={character.id}>
            <div className="relative aspect-square overflow-hidden bg-paper-deep">
              <Image className="object-cover saturate-75 motion-safe:transition motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-hover:saturate-100" src={character.image} alt={`${character.name} portrait`} fill priority={index === 0} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              <span className={`absolute right-3 top-3 size-3 rounded-full border-2 border-surface ${statusClass[character.status] ?? statusClass.unknown}`} role="img" aria-label={`Status: ${character.status}`} />
            </div>
            <div className="p-4 pb-5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="mb-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold tracking-tight sm:text-lg">{character.name}</h3>
                <span className="font-mono text-xs text-muted-ink">#{String(character.id).padStart(2, "0")}</span>
              </div>
              <p className="mb-5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-muted-ink">{character.species}{character.type ? ` / ${character.type}` : ""}</p>
              <dl className="border-t border-line pt-3">
                <div className="mt-1 flex items-baseline justify-between gap-2"><dt className="text-xs text-muted-ink">Origin</dt><dd className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-xs">{character.origin}</dd></div>
                <div className="mt-1 flex items-baseline justify-between gap-2"><dt className="text-xs text-muted-ink">Last seen</dt><dd className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-xs">{character.location}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>

      {!filteredCharacters.length ? (
        <div className="mt-px border border-dashed border-line p-12 text-center">
          <p className="text-muted-ink">{query ? `No characters match "${query}".` : "This episode has no character records."}</p>
          {query ? <Button onClick={() => setQuery("")} type="button" variant="outline">Clear search</Button> : null}
        </div>
      ) : null}

      <footer className="mt-16 flex flex-col gap-2 border-t border-line pt-4 text-xs leading-relaxed tracking-wide text-muted-ink sm:flex-row sm:items-center sm:justify-between">
        <span>Data supplied by the Rick and Morty API</span>
        <span>Cached for faster jumps between dimensions</span>
      </footer>
    </main>
  );
}
