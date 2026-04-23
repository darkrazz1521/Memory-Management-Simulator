import { CheckCircle2, Cpu } from "lucide-react";

function ComparisonView({ comparison }) {
  if (!comparison) {
    return null;
  }

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Algorithm Comparison
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Replacement Policy Face-Off
          </h2>
        </div>

        <div className="text-sm text-slate-300">
          Best: {comparison.bestAlgorithms.join(", ")} | Avg faults:{" "}
          {comparison.averageFaults}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        {comparison.results.map((result) => {
          const isBest = comparison.bestAlgorithms.includes(result.algorithm);

          return (
            <article
              key={result.algorithm}
              className={`rounded-md border p-4 transition-transform duration-300 hover:-translate-y-0.5 ${
                isBest
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    <Cpu className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {result.algorithm}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {result.totalReferences} references
                    </p>
                  </div>
                </div>

                {isBest && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Best
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Faults
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-amber-100">
                    {result.pageFaults}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Hit Rate
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-100">
                    {(result.hitRate * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Final Frames
                </div>
                <div
                  className="mt-2 grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${result.finalFrames.length}, minmax(0, 1fr))`,
                  }}
                >
                  {result.finalFrames.map((frame, index) => (
                    <div
                      key={`${result.algorithm}-${index}`}
                      className="rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-center text-sm font-semibold text-slate-100"
                    >
                      {frame ?? "--"}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ComparisonView;
