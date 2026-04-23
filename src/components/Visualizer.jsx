import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";

const SPEED_OPTIONS = [
  { label: "Slow", value: 1400 },
  { label: "Normal", value: 850 },
  { label: "Fast", value: 420 },
];

function PlaybackButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function Metric({ label, value, accent = "text-slate-100" }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function ReferenceTrace({ referenceString, stepIndex }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Activity className="h-4 w-4 text-cyan-300" />
        Reference Trace
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          {referenceString.map((page, index) => {
            const active = index === stepIndex;
            const visited = index < stepIndex;
            return (
              <div
                key={`${page}-${index}`}
                className={`flex h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-all duration-300 ${
                  active
                    ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.16)]"
                    : visited
                      ? "border-white/10 bg-white/5 text-slate-300"
                      : "border-white/10 bg-slate-900 text-slate-500"
                }`}
              >
                {page}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FrameGrid({ currentStep }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Cpu className="h-4 w-4 text-cyan-300" />
        RAM Frames
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))" }}
      >
        {currentStep.frames.map((page, index) => {
          const inserted = currentStep.insertedFrameIndex === index;
          const replaced = currentStep.replacedFrameIndex === index;

          return (
            <div
              key={`${index}-${page ?? "empty"}`}
              className={`relative aspect-square min-h-[96px] rounded-md border px-3 py-2 transition-all duration-300 ${
                page === null
                  ? "border-white/10 bg-slate-900 text-slate-500"
                  : inserted && currentStep.pageFault
                    ? "border-rose-400/60 bg-rose-500/15 text-rose-50 shadow-[0_0_28px_rgba(244,63,94,0.18)]"
                    : "border-cyan-400/25 bg-cyan-400/10 text-cyan-50"
              }`}
            >
              {replaced && (
                <span className="absolute right-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-950">
                  swap
                </span>
              )}

              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                Frame {index}
              </div>
              <div className="mt-3 text-3xl font-semibold">{page ?? "--"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionRail({ currentStep, result, stepIndex }) {
  const start = Math.max(0, stepIndex - 4);
  const visibleSteps = result.history.slice(start, stepIndex + 1);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Current Decision
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p>{currentStep.action}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 ${
                currentStep.pageFault
                  ? "bg-rose-500/15 text-rose-100"
                  : "bg-emerald-500/15 text-emerald-100"
              }`}
            >
              {currentStep.pageFault ? "Page Fault" : "Page Hit"}
            </span>

            {currentStep.replaced !== null && (
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-100">
                Replaced {currentStep.replaced}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Recent Steps
        </div>
        <div className="space-y-2">
          {visibleSteps.map((step) => (
            <div
              key={step.step}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
                step.step === currentStep.step
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-50"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              <span>Step {step.step}</span>
              <span>{step.currentPage}</span>
              <span className={step.pageFault ? "text-rose-200" : "text-emerald-200"}>
                {step.pageFault ? "Fault" : "Hit"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Frame Metadata
        </div>
        <div className="grid gap-2">
          {currentStep.frameMeta.map((meta, index) => (
            <div
              key={`${meta.page ?? "empty"}-${index}`}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
            >
              Frame {index}:{" "}
              <span className="font-semibold text-white">{meta.page ?? "--"}</span>
              {meta.nextUse !== null && (
                <span className="ml-2 text-slate-400">
                  next {meta.nextUse === -1 ? "never" : meta.nextUse + 1}
                </span>
              )}
              {meta.lastUsed !== null && (
                <span className="ml-2 text-slate-400">last {meta.lastUsed + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PagePile({ title, icon: Icon, pages, tone }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon className={`h-4 w-4 ${tone}`} />
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {pages.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-500">
            Empty
          </div>
        ) : (
          pages.map((page) => (
            <div
              key={`${title}-${page}`}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition-all duration-300"
            >
              {page}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VirtualMemoryPanel({ currentStep, result }) {
  const movement = currentStep.movement ?? { type: "hit" };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <HardDrive className="h-4 w-4 text-amber-300" />
          Page Movement
        </div>

        <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          {movement.type === "hit" ? (
            <span>Page {currentStep.currentPage} is served directly from RAM.</span>
          ) : movement.type === "swap" ? (
            <span>
              Page {currentStep.currentPage} moves from Disk to RAM and page{" "}
              {currentStep.replaced} returns to Disk.
            </span>
          ) : (
            <span>Page {currentStep.currentPage} loads from Disk into RAM.</span>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <PagePile
          title="RAM Resident Set"
          icon={Cpu}
          pages={currentStep.ramPages ?? []}
          tone="text-cyan-300"
        />
      </div>

      <div className="border-t border-white/10 pt-6">
        <PagePile
          title="Disk Pages"
          icon={HardDrive}
          pages={currentStep.diskPages ?? []}
          tone="text-amber-300"
        />
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Metric label="Hits" value={currentStep.hitCount} accent="text-emerald-200" />
          <Metric
            label="Swaps"
            value={result.replacements.length}
            accent="text-amber-200"
          />
        </div>
      </div>
    </div>
  );
}

function Visualizer({
  result,
  virtualMemory,
  playback,
  onPlaybackChange,
  mode = "paging",
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [speed, setSpeed] = useState(SPEED_OPTIONS[1].value);
  const isVirtualMode = mode === "virtual";
  const steps = isVirtualMode ? virtualMemory?.history ?? [] : result?.history ?? [];
  const currentStep = steps[stepIndex];

  const progress = useMemo(() => {
    if (steps.length === 0) {
      return 0;
    }

    return ((stepIndex + 1) / steps.length) * 100;
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (!playback.autoPlay || steps.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => {
        if (current >= steps.length - 1) {
          onPlaybackChange({ autoPlay: false });
          return current;
        }

        return current + 1;
      });
    }, speed);

    return () => window.clearTimeout(timer);
  }, [playback.autoPlay, speed, stepIndex, steps.length, onPlaybackChange]);

  if (!result || !currentStep) {
    return null;
  }

  const copy = isVirtualMode
    ? {
        eyebrow: "Virtual Memory Lab",
        title: "RAM and Disk Playback",
      }
    : {
        eyebrow: "Paging Lab",
        title: "Step-by-Step Replacement Playback",
      };

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{copy.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PlaybackButton
            title="Restart"
            onClick={() => {
              setStepIndex(0);
              onPlaybackChange({ autoPlay: false });
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </PlaybackButton>

          <PlaybackButton
            title="Previous step"
            onClick={() => {
              onPlaybackChange({ autoPlay: false });
              setStepIndex((current) => Math.max(current - 1, 0));
            }}
          >
            <SkipBack className="h-4 w-4" />
          </PlaybackButton>

          <PlaybackButton
            title={playback.autoPlay ? "Pause playback" : "Start playback"}
            onClick={() => onPlaybackChange({ autoPlay: !playback.autoPlay })}
          >
            {playback.autoPlay ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </PlaybackButton>

          <PlaybackButton
            title="Next step"
            onClick={() => {
              onPlaybackChange({ autoPlay: false });
              setStepIndex((current) => Math.min(current + 1, steps.length - 1));
            }}
          >
            <SkipForward className="h-4 w-4" />
          </PlaybackButton>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-4">
        <Metric label="Algorithm" value={result.algorithm} accent="text-cyan-200" />
        <Metric label="Step" value={`${currentStep.step} / ${steps.length}`} />
        <Metric
          label="Current Page"
          value={currentStep.currentPage}
          accent={currentStep.pageFault ? "text-rose-200" : "text-emerald-200"}
        />
        <Metric label="Faults" value={currentStep.faultCount} accent="text-amber-200" />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          {SPEED_OPTIONS.map((option) => {
            const active = speed === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setSpeed(option.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  active
                    ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 ${
              currentStep.pageFault
                ? "bg-rose-500/15 text-rose-100"
                : "bg-emerald-500/15 text-emerald-100"
            }`}
          >
            {currentStep.pageFault ? "Page Fault" : "Page Hit"}
          </span>

          {currentStep.replaced !== null && (
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-100">
              Replaced {currentStep.replaced}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {!isVirtualMode && (
          <ReferenceTrace
            referenceString={result.referenceString}
            stepIndex={stepIndex}
          />
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <FrameGrid currentStep={currentStep} />
          {isVirtualMode ? (
            <VirtualMemoryPanel currentStep={currentStep} result={result} />
          ) : (
            <DecisionRail
              currentStep={currentStep}
              result={result}
              stepIndex={stepIndex}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default Visualizer;
