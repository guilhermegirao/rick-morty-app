"use client";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-start justify-center gap-4 px-6 py-8 text-ink md:px-12 lg:px-20">
      <p className="text-sm text-signal">Archive unavailable</p>
      <h1 className="text-4xl font-medium tracking-tight">The episode could not be loaded.</h1>
      <p className="max-w-md text-muted-ink">Check the archive connection and try the request again.</p>
      <Button onClick={reset} type="button">Try again</Button>
    </main>
  );
}
