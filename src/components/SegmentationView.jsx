import { AlertTriangle, ArrowRight, CheckCircle2, Layers } from "lucide-react";

function SegmentBadge({ segment, active }) {
  return (
    <article
      className={`rounded-md border p-4 transition ${
        active
          ? "border-cyan-400/50 bg-cyan-400/12 shadow-[0_0_28px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{segment.name}</h3>
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-slate-300">
          limit {segment.limit}
        </span>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
          style={{ width: `${Math.min(100, Math.max(8, segment.limit / 1.6))}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Base
          </div>
          <div className="mt-1 font-semibold text-slate-100">{segment.base}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Range
          </div>
          <div className="mt-1 font-semibold text-slate-100">
            {segment.base}-{segment.base + segment.limit - 1}
          </div>
        </div>
      </div>
    </article>
  );
}

function TranslationPanel({ translation }) {
  const valid = translation.ok;
  const Icon = valid ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={`rounded-md border p-5 ${
        valid
          ? "border-emerald-400/30 bg-emerald-500/10"
          : "border-rose-400/30 bg-rose-500/10"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-md border ${
              valid
                ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                : "border-rose-300/30 bg-rose-300/10 text-rose-100"
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Translation Status
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {valid ? "Address Valid" : "Segmentation Fault"}
            </div>
          </div>
        </div>
      </div>

      {valid ? (
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
            Segment: <span className="font-semibold">{translation.segment}</span>
          </div>
          <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
            Offset: <span className="font-semibold">{translation.offset}</span>
          </div>
          <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
            Base: <span className="font-semibold">{translation.base}</span>
          </div>
          <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
            Physical:{" "}
            <span className="font-semibold text-emerald-100">
              {translation.physicalAddress}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3 text-sm text-rose-50">
          <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
            {translation.error}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
              Segment: <span className="font-semibold">{translation.segment}</span>
            </div>
            {"limit" in translation && (
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
                Limit: <span className="font-semibold">{translation.limit}</span>
              </div>
            )}
            {"offset" in translation && (
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-3">
                Offset: <span className="font-semibold">{translation.offset}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentationView({ segments, translation }) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Segmentation Lab
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Logical Address Translation
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
          <Layers className="h-4 w-4 text-cyan-300" />
          {segments.length} segments
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            Segment Table
            <ArrowRight className="h-4 w-4 text-slate-500" />
            Physical Ranges
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {segments.map((segment) => (
              <SegmentBadge
                key={segment.name}
                segment={segment}
                active={translation.segment === segment.name}
              />
            ))}
          </div>
        </div>

        <TranslationPanel translation={translation} />
      </div>
    </section>
  );
}

export default SegmentationView;
