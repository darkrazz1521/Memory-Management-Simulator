import { Boxes, Cpu, MemoryStick } from "lucide-react";

const PROCESS_COLORS = [
  { background: "rgba(34, 197, 94, 0.18)", border: "rgba(34, 197, 94, 0.65)" },
  { background: "rgba(59, 130, 246, 0.18)", border: "rgba(59, 130, 246, 0.65)" },
  { background: "rgba(249, 115, 22, 0.18)", border: "rgba(249, 115, 22, 0.65)" },
  { background: "rgba(234, 179, 8, 0.18)", border: "rgba(234, 179, 8, 0.65)" },
  { background: "rgba(236, 72, 153, 0.18)", border: "rgba(236, 72, 153, 0.65)" },
  { background: "rgba(20, 184, 166, 0.18)", border: "rgba(20, 184, 166, 0.65)" },
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

function Metric({ label, value, accent = "text-slate-100" }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function MemoryAllocationView({ memorySnapshot }) {
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
            Allocation Lab
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Contiguous RAM Allocation
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
          <MemoryStick className="h-4 w-4 text-emerald-300" />
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
          accent="text-cyan-100"
        />
        <Metric
          label="Utilization"
          value={`${Math.round(memorySnapshot.usage.utilization * 100)}%`}
          accent="text-amber-100"
        />
      </div>

      <div className="mt-6">
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
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Boxes className="h-4 w-4 text-amber-300" />
            Memory Blocks
          </div>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {memorySnapshot.blocks.map((block) => {
              const color = colorForProcess(block.processId);
              return (
                <article
                  key={`${block.label}-${block.start}`}
                  className="rounded-md border p-3"
                  style={{
                    backgroundColor: color.background,
                    borderColor: color.border,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">{block.label}</div>
                    <div className="text-xs text-slate-300">{block.size} cells</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    Range {block.start}-{block.end}
                  </div>
                </article>
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
              <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                No processes are allocated.
              </div>
            ) : (
              memorySnapshot.processes.map((process) => (
                <div
                  key={process.processId}
                  className="rounded-md border border-white/10 bg-white/5 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">
                      {process.processId}
                    </span>
                    <span className="text-slate-300">{process.size} cells</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Start {process.start} | End {process.end}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MemoryAllocationView;
