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

const PROCESS_COLORS = [
  { background: "rgba(34, 197, 94, 0.18)", border: "rgba(34, 197, 94, 0.65)" },
  { background: "rgba(59, 130, 246, 0.18)", border: "rgba(59, 130, 246, 0.65)" },
  { background: "rgba(249, 115, 22, 0.18)", border: "rgba(249, 115, 22, 0.65)" },
  { background: "rgba(234, 179, 8, 0.18)", border: "rgba(234, 179, 8, 0.65)" },
  { background: "rgba(236, 72, 153, 0.18)", border: "rgba(236, 72, 153, 0.65)" },
  { background: "rgba(168, 85, 247, 0.18)", border: "rgba(168, 85, 247, 0.65)" },
];

function hashLabel(label) {
  return [...String(label)].reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );
}

function colorForProcess(processId) {
  if (!processId) {
    return {
      background: "rgba(15, 23, 42, 0.92)",
      border: "rgba(148, 163, 184, 0.15)",
    };
  }

  return PROCESS_COLORS[hashLabel(processId) % PROCESS_COLORS.length];
}

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

function Visualizer({
  result,
  virtualMemory,
  memorySnapshot,
  playback,
  onPlaybackChange,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [speed, setSpeed] = useState(SPEED_OPTIONS[1].value);

  const steps = virtualMemory?.history ?? result?.history ?? [];
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

  const gridColumns =
    memorySnapshot.totalMemory > 96
      ? 16
      : memorySnapshot.totalMemory > 64
        ? 12
        : memorySnapshot.totalMemory > 36
          ? 10
          : 8;

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Visualization Engine
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Step-by-Step Memory Playback
          </h2>
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
        <Metric
          label="Faults"
          value={currentStep.faultCount}
          accent="text-amber-200"
        />
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

          {currentStep.replaced && (
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-100">
              Replaced {currentStep.replaced}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Activity className="h-4 w-4 text-cyan-300" />
          Reference Trace
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            {result.referenceString.map((page, index) => {
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

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Cpu className="h-4 w-4 text-cyan-300" />
              RAM Frames
            </div>

            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${result.frameCount}, minmax(0, 1fr))`,
              }}
            >
              {currentStep.frames.map((page, index) => {
                const inserted = currentStep.insertedFrameIndex === index;
                const replaced = currentStep.replacedFrameIndex === index;

                return (
                  <div
                    key={`${index}-${page ?? "empty"}`}
                    className={`relative aspect-square min-h-[88px] rounded-md border px-3 py-2 transition-all duration-300 ${
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
                    <div className="mt-3 text-3xl font-semibold">
                      {page ?? "--"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Cpu className="h-4 w-4 text-cyan-300" />
              Physical Memory Grid
            </div>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
              }}
            >
              {memorySnapshot.memory.map((cell, index) => {
                const color = colorForProcess(cell);
                return (
                  <div
                    key={`${cell ?? "free"}-${index}`}
                    title={`Cell ${index}: ${cell ?? "Free"}`}
                    className="flex aspect-square min-h-[36px] items-center justify-center rounded-[4px] border text-[10px] font-semibold text-slate-100 transition-transform duration-300 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: color.background,
                      borderColor: color.border,
                    }}
                  >
                    {cell ?? index}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              {memorySnapshot.blocks.map((block) => {
                const color = colorForProcess(block.processId);
                return (
                  <div
                    key={`${block.label}-${block.start}`}
                    className="rounded-md border px-3 py-2"
                    style={{
                      backgroundColor: color.background,
                      borderColor: color.border,
                    }}
                  >
                    {block.label} [{block.start}-{block.end}]
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <HardDrive className="h-4 w-4 text-amber-300" />
              Virtual Memory
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {currentStep.movement.type === "hit" ? (
                <span>Page {currentStep.currentPage} served directly from RAM.</span>
              ) : currentStep.movement.type === "swap" ? (
                <span>
                  Page {currentStep.currentPage} moved from Disk to RAM and page{" "}
                  {currentStep.replaced} returned to Disk.
                </span>
              ) : (
                <span>Page {currentStep.currentPage} loaded from Disk into RAM.</span>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="mb-3 text-sm font-semibold text-slate-200">Resident Set</div>
            <div className="flex flex-wrap gap-2">
              {currentStep.ramPages.map((page) => (
                <div
                  key={`ram-${page}`}
                  className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-50 transition-all duration-300"
                >
                  {page}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="mb-3 text-sm font-semibold text-slate-200">Disk Pages</div>
            <div className="flex flex-wrap gap-2">
              {currentStep.diskPages.map((page) => (
                <div
                  key={`disk-${page}`}
                  className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-50 transition-all duration-300"
                >
                  {page}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Metric label="Hits" value={currentStep.hitCount} accent="text-emerald-200" />
              <Metric
                label="Replacements"
                value={result.replacements.length}
                accent="text-amber-200"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Visualizer;
