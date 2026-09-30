import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EpisodeExplorer } from "./episode-explorer";
import type { Episode } from "./lib/episodes";

vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    void fill;
    void priority;
    return createElement("img", { ...props, alt: props.alt ?? "" });
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));

vi.mock("./lib/episodes", async () => {
  const actual = await vi.importActual<typeof import("./lib/episodes")>("./lib/episodes");
  return { ...actual, getEpisode: vi.fn() };
});

const { getEpisode } = await import("./lib/episodes");

const initialEpisode: Episode = {
  id: 28,
  name: "The Ricklantis Mixup",
  air_date: "September 10, 2017",
  episode: "S03E07",
  characters: [
    {
      id: 1,
      name: "Rick Sanchez",
      status: "Alive",
      species: "Human",
      type: "",
      gender: "Male",
      origin: "Earth",
      location: "Earth",
      image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
      episodes: [1, 2, 3],
    },
    {
      id: 2,
      name: "Morty Smith",
      status: "Alive",
      species: "Human",
      type: "",
      gender: "Male",
      origin: "Earth",
      location: "Citadel of Ricks",
      image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg",
      episodes: [1, 2],
    },
  ],
};

const nextEpisode: Episode = {
  ...initialEpisode,
  id: 99,
  name: "A Future Episode",
  episode: "S99E01",
  characters: [initialEpisode.characters[0]],
};

function renderExplorer(query = "") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <EpisodeExplorer initialEpisode={initialEpisode} initialQuery={query} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.mocked(getEpisode).mockReset();
});

describe("EpisodeExplorer", () => {
  it("renders episode metadata, character fields, and status badges", () => {
    renderExplorer();

    expect(screen.getByRole("heading", { name: initialEpisode.name })).toBeTruthy();
    expect(screen.getByText(initialEpisode.air_date)).toBeTruthy();
    expect(screen.getAllByText("Alive", { selector: "span" })).toHaveLength(2);
    expect(screen.getByText("Citadel of Ricks")).toBeTruthy();
    expect(screen.getAllByText("Episodes")).toHaveLength(2);
  });

  it("filters the cast and synchronizes the search query in the URL", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.type(screen.getByRole("searchbox"), "citadel");

    expect(screen.queryByRole("heading", { name: "Rick Sanchez" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Morty Smith" })).toBeTruthy();
    expect(window.location.search).toBe("?episode=28&q=citadel");
  });

  it("initializes the search filter from the URL state passed to the explorer", () => {
    renderExplorer("sanchez");

    expect(screen.getByRole("heading", { name: "Rick Sanchez" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Morty Smith" })).toBeNull();
  });

  it("shows validation for non-positive episode IDs", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const input = screen.getByRole("spinbutton");

    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: "Open episode" }));

    expect(screen.getByRole("alert").textContent).toContain("positive episode number");
    expect(getEpisode).not.toHaveBeenCalled();
  });

  it("keeps the previous episode visible while requesting another positive ID", async () => {
    const user = userEvent.setup();
    let resolveEpisode: (episode: Episode) => void = () => undefined;
    vi.mocked(getEpisode).mockImplementation(
      () => new Promise((resolve) => { resolveEpisode = resolve; }),
    );
    renderExplorer();

    await user.clear(screen.getByRole("spinbutton"));
    await user.type(screen.getByRole("spinbutton"), "99");
    await user.click(screen.getByRole("button", { name: "Open episode" }));

    expect(screen.getByRole("heading", { name: initialEpisode.name })).toBeTruthy();
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    expect(window.location.search).toBe("?episode=99");

    resolveEpisode(nextEpisode);
    await waitFor(() => expect(screen.getByRole("heading", { name: nextEpisode.name })).toBeTruthy());
  });

  it("shows an upstream not-found error to the user", async () => {
    const user = userEvent.setup();
    vi.mocked(getEpisode).mockRejectedValue(new Error("Episode 999 was not found."));
    renderExplorer();

    await user.clear(screen.getByRole("spinbutton"));
    await user.type(screen.getByRole("spinbutton"), "999");
    await user.click(screen.getByRole("button", { name: "Open episode" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Episode 999 was not found.");
  });
});
