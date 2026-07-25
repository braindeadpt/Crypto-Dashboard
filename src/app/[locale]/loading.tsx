/** Shape-matched board skeleton — reserves ritual + tape + pulso space (CLS). */
export default function BoardLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3"
      aria-busy="true"
      aria-label="A carregar"
    >
      {/* Ritual */}
      <div className="skeleton h-[11rem] sm:h-[9rem]" />
      {/* Tape */}
      <div className="skeleton mt-3 h-12" />
      {/* Pulso */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="skeleton mx-auto aspect-square w-full max-w-[320px]" />
        <div className="skeleton min-h-[10rem]" />
      </div>
      {/* Price strip */}
      <div className="skeleton mt-3 h-16" />
      {/* Chart + side */}
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="skeleton h-[280px] sm:h-[380px]" />
        <div className="grid gap-3">
          <div className="skeleton h-[160px]" />
          <div className="skeleton h-[160px]" />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-44" />
        <div className="skeleton h-44" />
        <div className="skeleton h-44 sm:col-span-2 lg:col-span-1" />
      </div>
    </div>
  );
}
