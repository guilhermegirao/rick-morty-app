import type { Character } from "@/modules/episodes/lib/episodes";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "./character-card";

type CharacterGridProps = {
  characters: Character[];
  query: string;
  onClearQuery: () => void;
};

export function CharacterGrid({ characters, query, onClearQuery }: CharacterGridProps) {
  if (!characters.length) {
    return (
      <div className="border border-dashed border-line p-12 text-center">
        <p className="text-muted-ink">{query ? `No characters match "${query}".` : "This episode has no character records."}</p>
        {query ? <Button onClick={onClearQuery} type="button" variant="outline">Clear search</Button> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4">
      {characters.map((character, index) => (
        <CharacterCard character={character} key={character.id} priority={index === 0} />
      ))}
    </div>
  );
}
