/** Shape-matched board skeleton — reserves ritual + pulso space (CLS). */
export default function BoardLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3"
      aria-busy="true"
      aria-label="A carregar"
    >
      <div className="skeleton h-[11rem] sm:h-[9rem]" />
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="skeleton mx-auto aspect-square w-full max-w-[320px]" />
        <div className="skeleton min-h-[10rem]" />
      </div>
      <div className="skeleton mt-3 h-16" />
      <div className="skeleton mt-3 h-14" />
      <div className="skeleton mt-3 h-44" />
    </div>
  );
}
