export function EpisodeSkeleton() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-6 py-8 font-sans text-ink sm:py-5 md:px-12 lg:px-20" aria-busy="true" aria-label="Loading episode archive">
      <div className="h-7 w-36 bg-paper-deep" />
      <section className="flex flex-col justify-between gap-8 py-16 md:flex-row md:items-end md:py-20">
        <div className="space-y-4">
          <div className="h-3 w-24 bg-paper-deep" />
          <div className="h-16 w-[min(70vw,48rem)] bg-paper-deep" />
          <div className="h-4 w-40 bg-paper-deep" />
        </div>
        <div className="h-24 w-36 border-l border-line bg-paper-deep" />
      </section>
      <div className="mb-8 h-12 w-full border-y border-line bg-paper-deep" />
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div className="aspect-square bg-paper-deep" key={index} />)}
      </div>
    </main>
  );
}
