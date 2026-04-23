import { useState } from "react";
import {
  AlertTriangle,
  Cpu,
  HardDrive,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { PAGE_ALGORITHMS } from "../core/paging";

const fieldClassName =
  "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:bg-white/8 focus:ring-2 focus:ring-cyan-400/20";

function SectionTitle({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function MemoryMessage({ message }) {
  if (!message?.text) {
    return null;
  }

  const tone =
    message.type === "error"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";

  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${tone}`}>
      {message.text}
    </div>
  );
}

function ControlPanel({
  config,
  errors,
  playback,
  segmentOptions,
  memorySnapshot,
  memoryMessage,
  onConfigChange,
  onRun,
  onReset,
  onTogglePlayback,
  onAllocateProcess,
  onDeallocateProcess,
}) {
  const [processId, setProcessId] = useState("P3");
  const [processSize, setProcessSize] = useState(6);

  const handleAllocate = () => {
    onAllocateProcess({ processId, size: processSize });
  };

  const handleDeallocate = () => {
    onDeallocateProcess(processId);
  };

  return (
    <aside className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Simulation Console
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Memory Control Panel</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRun}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Play className="h-4 w-4" />
            Run
          </button>

          <button
            type="button"
            onClick={onTogglePlayback}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            {playback.autoPlay ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {playback.autoPlay ? "Pause" : "Resume"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 space-y-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3">
          {errors.map((error) => (
            <div
              key={error}
              className="flex items-start gap-2 text-sm text-rose-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <section className="border-t border-white/10 pt-6">
          <SectionTitle
            icon={Cpu}
            title="Paging Setup"
            detail="Reference string, frames, and replacement policy"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Frame Count
              </span>
              <input
                type="number"
                min="1"
                max="12"
                value={config.frameCount}
                onChange={(event) => onConfigChange("frameCount", event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Memory Size
              </span>
              <input
                type="number"
                min="16"
                max="128"
                value={config.memorySize}
                onChange={(event) => onConfigChange("memorySize", event.target.value)}
                className={fieldClassName}
              />
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Reference String
            </span>
            <textarea
              rows="4"
              value={config.referenceString}
              onChange={(event) =>
                onConfigChange("referenceString", event.target.value)
              }
              className={`${fieldClassName} resize-none`}
            />
          </label>

          <div className="mt-4">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Algorithm
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAGE_ALGORITHMS.map((algorithm) => {
                const active = config.algorithm === algorithm;
                return (
                  <button
                    key={algorithm}
                    type="button"
                    onClick={() => onConfigChange("algorithm", algorithm)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {algorithm}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-4 flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
            <span>Comparison Mode</span>
            <input
              type="checkbox"
              checked={config.comparisonMode}
              onChange={(event) =>
                onConfigChange("comparisonMode", event.target.checked)
              }
              className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan-400"
            />
          </label>
        </section>

        <section className="border-t border-white/10 pt-6">
          <SectionTitle
            icon={Layers}
            title="Segmentation"
            detail="Segment table and logical address translation"
          />

          <label className="mt-4 block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Segment Table
            </span>
            <textarea
              rows="5"
              value={config.segmentTableText}
              onChange={(event) =>
                onConfigChange("segmentTableText", event.target.value)
              }
              className={`${fieldClassName} resize-none font-mono text-xs`}
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Segment
              </span>
              <select
                value={config.segmentName}
                onChange={(event) => onConfigChange("segmentName", event.target.value)}
                className={fieldClassName}
              >
                {segmentOptions.map((segment) => (
                  <option key={segment.name} value={segment.name}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Offset
              </span>
              <input
                type="number"
                min="0"
                value={config.segmentOffset}
                onChange={(event) => onConfigChange("segmentOffset", event.target.value)}
                className={fieldClassName}
              />
            </label>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <SectionTitle
            icon={HardDrive}
            title="Memory Manager"
            detail="Allocate and release contiguous RAM blocks"
          />

          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <span>
              Used {memorySnapshot.usage.usedCells} / {memorySnapshot.totalMemory}
            </span>
            <span>{Math.round(memorySnapshot.usage.utilization * 100)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-300"
              style={{
                width: `${Math.max(
                  4,
                  memorySnapshot.usage.utilization * 100,
                )}%`,
              }}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Process ID
              </span>
              <input
                type="text"
                value={processId}
                onChange={(event) => setProcessId(event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Size
              </span>
              <input
                type="number"
                min="1"
                value={processSize}
                onChange={(event) => setProcessSize(event.target.value)}
                className={fieldClassName}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAllocate}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              Allocate
            </button>

            <button
              type="button"
              onClick={handleDeallocate}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" />
              Deallocate
            </button>
          </div>

          <div className="mt-4">
            <MemoryMessage message={memoryMessage} />
          </div>
        </section>
      </div>
    </aside>
  );
}

export default ControlPanel;
