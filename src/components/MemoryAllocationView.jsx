import { motion } from "framer-motion";
import { Boxes, Cpu, MemoryStick } from "lucide-react";

const PROCESS_COLORS = [
  { background: "rgba(142, 155, 125, 0.16)", border: "rgba(142, 155, 125, 0.44)" },
  { background: "rgba(184, 150, 114, 0.14)", border: "rgba(184, 150, 114, 0.42)" },
  { background: "rgba(165, 137, 137, 0.14)", border: "rgba(165, 137, 137, 0.4)" },
  { background: "rgba(130, 138, 154, 0.14)", border: "rgba(130, 138, 154, 0.38)" },
  { background: "rgba(118, 148, 140, 0.14)", border: "rgba(118, 148, 140, 0.4)" },
  { background: "rgba(173, 165, 140, 0.14)", border: "rgba(173, 165, 140, 0.4)" },
];

const surfaceClass =
  "premium-surface rounded-2xl border backdrop-blur";

function hashLabel(label) {
  return [...String(label)].reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );
}

function colorForProcess(processId) {
  if (!processId) {
    return {
      background: "rgba(17, 16, 14, 0.92)",
      border: "rgba(255,255,255,0.08)",
    };
  }

  return PROCESS_COLORS[hashLabel(processId) % PROCESS_COLORS.length];
}

function Metric({ label, value, accent = "text-stone-100" }) {
  return (
    <div className="premium-subsurface rounded-2xl p-4">
      <div className="text-xs text-premium-muted">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function MemoryAllocationView({ memorySnapshot }) {
  return (
    <section className={`${surfaceClass} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-premium-muted">Allocation Lab</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            Contiguous RAM Allocation
          </h2>
        </div>

        <div className="premium-subsurface inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-200">
          <MemoryStick className="h-4 w-4 text-premium-accent" />
          {memorySnapshot.totalMemory} cells
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric
          label="Used Cells"
          value={memorySnapshot.usage.usedCells}
          accent="text-emerald-100"
        />
        <Metric
          label="Free Cells"
          value={memorySnapshot.usage.freeCells}
          accent="text-stone-100"
        />
        <Metric
          label="Utilization"
          value={`${Math.round(memorySnapshot.usage.utilization * 100)}%`}
          accent="text-amber-100"
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
          <Cpu className="h-4 w-4 text-premium-accent" />
          Physical Memory Grid
        </div>

        <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 lg:grid-cols-12 2xl:grid-cols-16">
          {memorySnapshot.memory.map((cell, index) => {
            const color = colorForProcess(cell);
            return (
              <motion.div
                key={`${cell ?? "free"}-${index}`}
                layout
                whileHover={{ scale: 1.04 }}
                title={`Cell ${index}: ${cell ?? "Free"}`}
                className="flex aspect-square min-h-[36px] items-center justify-center rounded-[4px] border text-[10px] font-semibold text-stone-100"
                style={{
                  backgroundColor: color.background,
                  borderColor: color.border,
                }}
              >
                {cell ?? index}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Boxes className="h-4 w-4 text-premium-gold" />
            Memory Blocks
          </div>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {memorySnapshot.blocks.map((block, index) => {
              const color = colorForProcess(block.processId);
              return (
                <motion.article
                  key={`${block.label}-${block.start}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="rounded-lg border p-3"
                  style={{
                    backgroundColor: color.background,
                    borderColor: color.border,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-stone-50">{block.label}</div>
                    <div className="text-xs text-stone-400">{block.size} cells</div>
                  </div>
                  <div className="mt-2 text-xs text-stone-400">
                    Range {block.start}-{block.end}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-slate-200">
            Process Table
          </div>
          <div className="space-y-2">
            {memorySnapshot.processes.length === 0 ? (
              <div className="premium-subsurface-soft rounded-2xl p-4 text-sm text-premium-muted">
                No processes are allocated.
              </div>
            ) : (
              memorySnapshot.processes.map((process, index) => (
                <motion.div
                  key={process.processId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="premium-subsurface premium-interactive rounded-2xl p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-stone-50">
                      {process.processId}
                    </span>
                    <span className="text-premium-muted">{process.size} cells</span>
                  </div>
                  <div className="mt-2 text-xs text-premium-muted">
                    Start {process.start} | End {process.end}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MemoryAllocationView;
