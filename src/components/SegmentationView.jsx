import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Layers } from "lucide-react";

const surfaceClass =
  "premium-surface rounded-2xl border backdrop-blur";

function SegmentBadge({ segment, active }) {
  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      className={`rounded-2xl border p-4 ${
        active
          ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)]"
          : "premium-subsurface premium-interactive"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-stone-50">{segment.name}</h3>
        <span className="premium-subsurface-soft rounded-full px-2 py-1 text-xs text-premium-muted">
          limit {segment.limit}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(8, segment.limit / 1.6))}%` }}
          transition={{ duration: 0.28 }}
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--gold))]"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-premium-muted">Base</div>
          <div className="mt-1 font-semibold text-stone-100">{segment.base}</div>
        </div>
        <div>
          <div className="text-xs text-premium-muted">Range</div>
          <div className="mt-1 font-semibold text-stone-100">
            {segment.base}-{segment.base + segment.limit - 1}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function TranslationPanel({ translation }) {
  const valid = translation.ok;
  const Icon = valid ? CheckCircle2 : AlertTriangle;

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-5 ${
        valid
          ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)]"
          : "border-rose-300/18 bg-[rgba(213,138,154,0.14)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-md border ${
            valid
              ? "border-emerald-300/14 bg-emerald-300/8 text-emerald-100"
              : "border-rose-300/14 bg-rose-300/8 text-rose-100"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs text-premium-muted">Translation Status</div>
          <div className="mt-1 text-lg font-semibold text-slate-50">
            {valid ? "Address Valid" : "Segmentation Fault"}
          </div>
        </div>
      </div>

      {valid ? (
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="premium-subsurface-soft rounded-xl p-3">
            Segment: <span className="font-semibold">{translation.segment}</span>
          </div>
          <div className="premium-subsurface-soft rounded-xl p-3">
            Offset: <span className="font-semibold">{translation.offset}</span>
          </div>
          <div className="premium-subsurface-soft rounded-xl p-3">
            Base: <span className="font-semibold">{translation.base}</span>
          </div>
          <div className="premium-subsurface-soft rounded-xl p-3">
            Physical:{" "}
            <span className="font-semibold text-emerald-100">
              {translation.physicalAddress}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3 text-sm text-rose-100">
          <div className="premium-subsurface-soft rounded-xl p-3">
            {translation.error}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="premium-subsurface-soft rounded-xl p-3">
              Segment: <span className="font-semibold">{translation.segment}</span>
            </div>
            {"limit" in translation && (
              <div className="premium-subsurface-soft rounded-xl p-3">
                Limit: <span className="font-semibold">{translation.limit}</span>
              </div>
            )}
            {"offset" in translation && (
              <div className="premium-subsurface-soft rounded-xl p-3">
                Offset: <span className="font-semibold">{translation.offset}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SegmentationView({ segments, translation }) {
  return (
    <section className={`${surfaceClass} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-premium-muted">Segmentation Lab</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            Logical Address Translation
          </h2>
        </div>

        <div className="premium-subsurface inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-200">
          <Layers className="h-4 w-4 text-premium-accent" />
          {segments.length} segments
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            Segment Table
            <ArrowRight className="h-4 w-4 text-premium-muted" />
            Physical Ranges
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {segments.map((segment, index) => (
              <motion.div
                key={segment.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
              >
                <SegmentBadge
                  segment={segment}
                  active={translation.segment === segment.name}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <TranslationPanel translation={translation} />
      </div>
    </section>
  );
}

export default SegmentationView;
