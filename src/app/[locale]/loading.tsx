export default function BoardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3">
      <div className="h-14 animate-pulse border border-line bg-bg-elevated" />
      <div className="mt-3 h-40 animate-pulse border border-line bg-surface" />
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="h-[380px] animate-pulse border border-line bg-surface" />
        <div className="grid gap-3">
          <div className="h-[180px] animate-pulse border border-line bg-surface" />
          <div className="h-[180px] animate-pulse border border-line bg-surface" />
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="h-48 animate-pulse border border-line bg-surface" />
        <div className="h-48 animate-pulse border border-line bg-surface" />
        <div className="h-48 animate-pulse border border-line bg-surface" />
      </div>
    </div>
  );
}
