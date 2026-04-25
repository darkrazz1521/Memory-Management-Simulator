import { motion } from "framer-motion";
import { CheckCircle2, Cpu } from "lucide-react";

const surfaceClass =
  "premium-surface rounded-2xl border backdrop-blur";

function ComparisonView({ comparison }) {
  if (!comparison) {
    return null;
  }

  return (
    <section className={`${surfaceClass} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-premium-muted">Algorithm Comparison</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            Replacement Policy Face-Off
          </h2>
        </div>

        <div className="text-sm text-premium-muted">
          Best: {comparison.bestAlgorithms.join(", ")} | Avg faults:{" "}
          {comparison.averageFaults}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        {comparison.results.map((result, index) => {
          const isBest = comparison.bestAlgorithms.includes(result.algorithm);

          return (
            <motion.article
              key={result.algorithm}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`rounded-2xl border p-4 ${
                isBest
                  ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)] shadow-[0_18px_36px_rgba(120,196,179,0.12)]"
                  : "premium-subsurface premium-interactive"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="premium-subsurface-soft flex h-10 w-10 items-center justify-center rounded-xl text-premium-accent">
                    <Cpu className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-50">
                      {result.algorithm}
                    </h3>
                    <p className="text-xs text-premium-muted">
                      {result.totalReferences} references
                    </p>
                  </div>
                </div>

                {isBest && (
                  <span className="status-success inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Best
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-premium-muted">Faults</div>
                  <div className="mt-1 text-2xl font-semibold text-amber-100">
                    {result.pageFaults}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-premium-muted">Hit Rate</div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-100">
                    {(result.hitRate * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs text-premium-muted">Final Frames</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.finalFrames.map((frame, frameIndex) => (
                    <motion.div
                      key={`${result.algorithm}-${frameIndex}`}
                      layout
                      whileHover={{ y: -2 }}
                      className="premium-subsurface-soft rounded-xl px-3 py-3 text-center text-sm font-semibold text-slate-100"
                    >
                      {frame ?? "--"}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default ComparisonView;
