import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const surfaceClass =
  "premium-surface rounded-2xl border backdrop-blur";

function PlaybackButton({ title, onClick, children }) {
  return (
    <motion.button
      type="button"
      title={title}
      aria-label={title}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="premium-outline-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-100 transition"
    >
      {children}
    </motion.button>
  );
}

function Metric({ label, value, accent = "text-stone-100" }) {
  return (
    <motion.div
      layout
      className="premium-subsurface rounded-2xl px-4 py-3"
    >
      <div className="text-xs text-premium-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent}`}>{value}</div>
    </motion.div>
  );
}

function ReferenceTrace({ referenceString, stepIndex }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
        <Activity className="h-4 w-4 text-premium-accent" />
        Reference Trace
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          {referenceString.map((page, index) => {
            const active = index === stepIndex;
            const visited = index < stepIndex;

            return (
              <motion.div
                key={`${page}-${index}`}
                layout
                whileHover={{ y: -2 }}
                className={`flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                  active
                    ? "border-white/[0.16] bg-[rgba(120,196,179,0.16)] text-slate-50 shadow-[0_16px_28px_rgba(120,196,179,0.14)]"
                    : visited
                      ? "premium-subsurface text-slate-300"
                      : "premium-subsurface-soft text-slate-500"
                }`}
              >
                {page}
              </motion.div>
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
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
        <Cpu className="h-4 w-4 text-premium-accent" />
        RAM Frames
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {currentStep.frames.map((page, index) => {
          const inserted = currentStep.insertedFrameIndex === index;
          const replaced = currentStep.replacedFrameIndex === index;

          return (
            <motion.div
              key={`${index}-${page ?? "empty"}`}
              layout
              initial={false}
              animate={
                inserted && currentStep.pageFault
                  ? {
                      y: [0, -2, 0],
                      boxShadow: [
                        "0 0 0 rgba(0,0,0,0)",
                        "0 0 0 1px rgba(199, 95, 95, 0.22), 0 12px 30px rgba(125, 40, 40, 0.16)",
                        "0 0 0 rgba(0,0,0,0)",
                      ],
                    }
                  : {
                      y: 0,
                      boxShadow: "0 0 0 rgba(0,0,0,0)",
                    }
              }
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={`relative aspect-square min-h-[96px] rounded-2xl border px-3 py-3 ${
                page === null
                  ? "premium-subsurface-soft text-slate-500"
                  : inserted && currentStep.pageFault
                    ? "border-rose-300/24 bg-[rgba(213,138,154,0.12)] text-rose-50 shadow-[0_18px_36px_rgba(213,138,154,0.12)]"
                    : "premium-subsurface text-slate-50"
              }`}
            >
              <AnimatePresence>
                {inserted && currentStep.pageFault && (
                  <motion.span
                    key={`pulse-${currentStep.step}-${index}`}
                    initial={{ opacity: 0.7, scale: 0.88 }}
                    animate={{ opacity: 0, scale: 1.14 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-2xl border border-[rgba(120,196,179,0.28)]"
                  />
                )}
              </AnimatePresence>

              {replaced && (
                <span className="status-warn absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px]">
                  replaced
                </span>
              )}

              <div className="text-[11px] text-premium-muted">Frame {index}</div>
              <div className="mt-4 text-3xl font-semibold">{page ?? "--"}</div>
            </motion.div>
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
        <div className="mb-3 text-sm font-semibold text-stone-200">
          Current Decision
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentStep.step}-${currentStep.currentPage}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="premium-subsurface-soft rounded-2xl p-4 text-sm text-slate-300"
          >
            <p>{currentStep.action}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 ${
                  currentStep.pageFault
                    ? "status-danger"
                    : "status-success"
                }`}
              >
                {currentStep.pageFault ? "Page Fault" : "Page Hit"}
              </span>

              {currentStep.replaced !== null && (
                <span className="status-warn rounded-full px-3 py-1">
                  Replaced {currentStep.replaced}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-white/[0.08] pt-6">
        <div className="mb-3 text-sm font-semibold text-stone-200">
          Recent Steps
        </div>
        <div className="space-y-2">
          {visibleSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.03 }}
              whileHover={{ x: 2 }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                step.step === currentStep.step
                  ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)] text-slate-50"
                  : "premium-subsurface text-slate-300"
              }`}
            >
              <span>Step {step.step}</span>
              <span>{step.currentPage}</span>
              <span className={step.pageFault ? "text-rose-200" : "text-emerald-200"}>
                {step.pageFault ? "Fault" : "Hit"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.08] pt-6">
        <div className="mb-3 text-sm font-semibold text-stone-200">
          Frame Metadata
        </div>
        <div className="grid gap-2">
          {currentStep.frameMeta.map((meta, index) => (
            <motion.div
              key={`${meta.page ?? "empty"}-${index}`}
              layout
              className="premium-subsurface-soft rounded-xl px-3 py-2.5 text-sm text-slate-300"
            >
              Frame {index}:{" "}
              <span className="font-semibold text-slate-50">{meta.page ?? "--"}</span>
              {meta.nextUse !== null && (
                <span className="ml-2 text-premium-muted">
                  next {meta.nextUse === -1 ? "never" : meta.nextUse + 1}
                </span>
              )}
              {meta.lastUsed !== null && (
                <span className="ml-2 text-premium-muted">last {meta.lastUsed + 1}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PagePile({ title, icon: Icon, pages, tone }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
        <Icon className={`h-4 w-4 ${tone}`} />
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {pages.length === 0 ? (
          <div className="premium-subsurface-soft rounded-xl px-3 py-2 text-sm text-slate-500">
            Empty
          </div>
        ) : (
          pages.map((page) => (
            <motion.div
              key={`${title}-${page}`}
              layout
              whileHover={{ y: -2 }}
              className="premium-subsurface premium-interactive rounded-xl px-3 py-2 text-sm font-semibold text-slate-100"
            >
              {page}
            </motion.div>
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
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
          <HardDrive className="h-4 w-4 text-amber-300" />
          Page Movement
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${movement.type}-${currentStep.step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="premium-subsurface-soft rounded-2xl px-4 py-3 text-sm text-slate-300"
          >
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
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-white/[0.08] pt-6">
        <PagePile
          title="RAM Resident Set"
          icon={Cpu}
          pages={currentStep.ramPages ?? []}
          tone="text-premium-accent"
        />
      </div>

      <div className="border-t border-white/[0.08] pt-6">
        <PagePile
          title="Disk Pages"
          icon={HardDrive}
          pages={currentStep.diskPages ?? []}
          tone="text-premium-gold"
        />
      </div>

      <div className="border-t border-white/[0.08] pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Metric label="Hits" value={currentStep.hitCount} accent="text-emerald-100" />
          <Metric
            label="Swaps"
            value={result.replacements.length}
            accent="text-amber-100"
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
    <section className={`${surfaceClass} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-premium-muted">{copy.eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">{copy.title}</h2>
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

      <div className="mt-5 grid gap-4 border-t border-white/[0.08] pt-5 md:grid-cols-4">
        <Metric label="Algorithm" value={result.algorithm} accent="text-stone-50" />
        <Metric label="Step" value={`${currentStep.step} / ${steps.length}`} />
        <Metric
          label="Current Page"
          value={currentStep.currentPage}
          accent={currentStep.pageFault ? "text-rose-100" : "text-emerald-100"}
        />
        <Metric label="Faults" value={currentStep.faultCount} accent="text-amber-100" />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--gold))]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex flex-wrap items-center gap-2">
          {SPEED_OPTIONS.map((option) => {
            const active = speed === option.value;
            return (
              <motion.button
                key={option.label}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSpeed(option.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs ${
                  active
                    ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)] text-slate-50 shadow-[0_16px_28px_rgba(120,196,179,0.12)]"
                    : "premium-outline-button text-slate-300"
                }`}
              >
                {option.label}
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 ${
              currentStep.pageFault
                ? "status-danger"
                : "status-success"
            }`}
          >
            {currentStep.pageFault ? "Page Fault" : "Page Hit"}
          </span>

          {currentStep.replaced !== null && (
            <span className="status-warn rounded-full px-3 py-1">
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
