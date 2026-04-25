import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const panelClass =
  "premium-surface rounded-2xl border backdrop-blur";
const inputClass =
  "premium-input w-full rounded-xl px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500";
const subtleButtonClass =
  "premium-outline-button inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-slate-100 transition";

const sectionMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

function SectionTitle({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-start gap-3">
      <span className="premium-subsurface-soft flex h-8 w-8 items-center justify-center rounded-xl text-slate-200 xl:h-9 xl:w-9">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-premium-muted">{detail}</p>
      </div>
    </div>
  );
}

function MessageBanner({ message }) {
  if (!message?.text) {
    return null;
  }

  const tone =
    message.type === "error"
      ? "border-rose-300/18 bg-rose-300/8 text-rose-100"
      : "border-emerald-300/18 bg-emerald-300/8 text-emerald-100";

  return (
    <motion.div
      key={message.text}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border px-3 py-2.5 text-sm ${tone}`}
    >
      {message.text}
    </motion.div>
  );
}

function ErrorStack({ errors }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="status-danger space-y-2 rounded-xl p-3"
    >
      {errors.map((error) => (
        <div key={error} className="flex items-start gap-2 text-sm text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ))}
    </motion.div>
  );
}

function ControlPanel({
  title = "Memory Control Panel",
  eyebrow = "Simulation Console",
  sections = ["paging", "segmentation", "allocation"],
  showPlayback = true,
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
  const showPaging = sections.includes("paging");
  const showSegmentation = sections.includes("segmentation");
  const showAllocation = sections.includes("allocation");

  const handleAllocate = () => {
    onAllocateProcess({ processId, size: processSize });
  };

  const handleDeallocate = () => {
    onDeallocateProcess(processId);
  };

  return (
    <aside className={`${panelClass} p-4 xl:p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-premium-muted">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-50 xl:text-[1.55rem]">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={onRun}
            className="premium-primary-button inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition"
          >
            <Play className="h-4 w-4" />
            Run
          </motion.button>

          {showPlayback && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={onTogglePlayback}
              className={subtleButtonClass}
            >
              {playback.autoPlay ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {playback.autoPlay ? "Pause" : "Play"}
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={onReset}
            className={subtleButtonClass}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </motion.button>
        </div>
      </div>

      <div className="mt-4">
        <ErrorStack errors={errors} />
      </div>

      <div className="mt-4 space-y-4">
        {showPaging && (
          <motion.section
            {...sectionMotion}
            className="premium-subsurface rounded-2xl p-3.5"
          >
            <SectionTitle
              icon={Cpu}
              title="Paging Setup"
              detail="Reference string, frames, and replacement policy"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs text-premium-muted">Frame Count</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={config.frameCount}
                  onChange={(event) => onConfigChange("frameCount", event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs text-premium-muted">Memory Size</span>
                <input
                  type="number"
                  min="16"
                  max="128"
                  value={config.memorySize}
                  onChange={(event) => onConfigChange("memorySize", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="mt-3 block space-y-1.5">
              <span className="text-xs text-premium-muted">Reference String</span>
              <textarea
                rows="3"
                value={config.referenceString}
                onChange={(event) =>
                  onConfigChange("referenceString", event.target.value)
                }
                className={`${inputClass} resize-none`}
              />
            </label>

            <div className="mt-3">
              <span className="text-xs text-premium-muted">Algorithm</span>
              <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
                {PAGE_ALGORITHMS.map((algorithm) => {
                  const active = config.algorithm === algorithm;
                  return (
                    <motion.button
                      key={algorithm}
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onConfigChange("algorithm", algorithm)}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        active
                          ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)] text-slate-50 shadow-[0_16px_28px_rgba(120,196,179,0.12)]"
                          : "premium-subsurface-soft text-slate-300 hover:border-[rgba(120,196,179,0.2)]"
                      }`}
                    >
                      {algorithm}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <label className="premium-subsurface-soft mt-3 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-200">
              <span>Comparison Mode</span>
              <input
                type="checkbox"
                checked={config.comparisonMode}
                onChange={(event) =>
                  onConfigChange("comparisonMode", event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--accent)]"
              />
            </label>
          </motion.section>
        )}

        {showSegmentation && (
          <motion.section
            {...sectionMotion}
            className="premium-subsurface rounded-2xl p-3.5"
          >
            <SectionTitle
              icon={Layers}
              title="Segmentation"
              detail="Segment table and logical address translation"
            />

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs text-premium-muted">Segment Table</span>
              <textarea
                rows="4"
                value={config.segmentTableText}
                onChange={(event) =>
                  onConfigChange("segmentTableText", event.target.value)
                }
                className={`${inputClass} resize-none font-mono text-xs`}
              />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs text-premium-muted">Segment</span>
                <select
                  value={config.segmentName}
                  onChange={(event) =>
                    onConfigChange("segmentName", event.target.value)
                  }
                  className={inputClass}
                >
                  {segmentOptions.map((segment) => (
                    <option key={segment.name} value={segment.name}>
                      {segment.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs text-premium-muted">Offset</span>
                <input
                  type="number"
                  min="0"
                  value={config.segmentOffset}
                  onChange={(event) => onConfigChange("segmentOffset", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </motion.section>
        )}

        {showAllocation && (
          <motion.section
            {...sectionMotion}
            className="premium-subsurface rounded-2xl p-3.5"
          >
            <SectionTitle
              icon={HardDrive}
              title="Memory Manager"
              detail="Allocate and release contiguous RAM blocks"
            />

            <div className="mt-4 flex items-center justify-between text-sm text-premium-muted">
              <span>
                Used {memorySnapshot.usage.usedCells} / {memorySnapshot.totalMemory}
              </span>
              <span>{Math.round(memorySnapshot.usage.utilization * 100)}%</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={false}
                animate={{
                  width: `${Math.max(4, memorySnapshot.usage.utilization * 100)}%`,
                }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--gold))]"
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
              <label className="space-y-1.5">
                <span className="text-xs text-premium-muted">Process ID</span>
                <input
                  type="text"
                  value={processId}
                  onChange={(event) => setProcessId(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs text-premium-muted">Size</span>
                <input
                  type="number"
                  min="1"
                  value={processSize}
                  onChange={(event) => setProcessSize(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAllocate}
                className="premium-primary-button inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition"
              >
                <Plus className="h-4 w-4" />
                Allocate
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleDeallocate}
                className={subtleButtonClass}
              >
                <Trash2 className="h-4 w-4" />
                Deallocate
              </motion.button>
            </div>

            <div className="mt-3">
              <AnimatePresence mode="wait">
                <MessageBanner message={memoryMessage} />
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </div>
    </aside>
  );
}

export default ControlPanel;
