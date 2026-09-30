import Image from "next/image";
import type { Character } from "@/modules/episodes/lib/episodes";
import { StatusBadge } from "./status-badge";

type CharacterCardProps = {
  character: Character;
  priority?: boolean;
};

export function CharacterCard({ character, priority = false }: CharacterCardProps) {
  return (
    <article className="group min-w-0 border border-line bg-surface">
      <div className="relative aspect-square overflow-hidden bg-paper-deep">
        <Image
          className="object-cover saturate-75 motion-safe:transition motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-hover:saturate-100"
          src={character.image}
          alt={`${character.name} portrait`}
          fill
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="p-4 pb-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold tracking-tight sm:text-lg">{character.name}</h3>
          <span className="font-mono text-xs text-muted-ink">#{String(character.id).padStart(2, "0")}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-muted-ink">{character.species}{character.type ? ` / ${character.type}` : ""}</p>
          <StatusBadge status={character.status} />
        </div>
        <dl className="mt-5 border-t border-line pt-3">
          <div className="mt-1 flex items-baseline justify-between gap-2"><dt className="text-xs text-muted-ink">Gender</dt><dd className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-xs">{character.gender}</dd></div>
          <div className="mt-1 flex items-baseline justify-between gap-2"><dt className="text-xs text-muted-ink">Origin</dt><dd className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-xs">{character.origin}</dd></div>
          <div className="mt-1 flex items-baseline justify-between gap-2"><dt className="text-xs text-muted-ink">Last seen</dt><dd className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-xs">{character.location}</dd></div>
          <div className="mt-1 flex items-baseline justify-between gap-2"><dt className="text-xs text-muted-ink">Episodes</dt><dd className="text-xs">{character.episodes.length}</dd></div>
        </dl>
      </div>
    </article>
  );
}
