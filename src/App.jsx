import { useCallback, useMemo, useState } from "react";
import { Activity, CheckCircle2, Cpu, HardDrive } from "lucide-react";
import ControlPanel from "./components/ControlPanel";
import Visualizer from "./components/Visualizer";
import ComparisonView from "./components/ComparisonView";
import Charts from "./components/Charts";
import MemoryManager from "./core/memoryManager";
import {
  comparePagingAlgorithms,
  parsePageReferences,
  simulatePaging,
} from "./core/paging";
import {
  DEFAULT_SEGMENTS,
  parseSegmentTable,
  Segmentation,
  segmentTableToText,
} from "./core/segmentation";
import { simulateVirtualMemory } from "./core/virtualMemory";

const DEFAULT_MEMORY_SIZE = 48;

const DEFAULT_CONFIG = {
  frameCount: "4",
  referenceString: "7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2",
  algorithm: "LRU",
  memorySize: String(DEFAULT_MEMORY_SIZE),
  comparisonMode: true,
  segmentTableText: segmentTableToText(DEFAULT_SEGMENTS),
  segmentName: "Heap",
  segmentOffset: "42",
};

function normalizeMemorySize(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 16 || parsed > 128) {
    throw new Error("Memory size must be between 16 and 128 cells.");
  }

  return parsed;
}

function createSeededMemory(totalMemory) {
  const manager = new MemoryManager(totalMemory);
  manager.allocateProcess("OS", Math.min(6, totalMemory));

  if (totalMemory >= 18) {
    manager.allocateProcess("P1", 6);
  }

  if (totalMemory >= 30) {
    manager.allocateProcess("P2", 8);
  }

  return manager.getSnapshot();
}

function buildSimulation(config) {
  const frameCount = Number.parseInt(config.frameCount, 10);

  if (!Number.isFinite(frameCount) || frameCount < 1 || frameCount > 12) {
    throw new Error("Frame count must be between 1 and 12.");
  }

  const memorySize = normalizeMemorySize(config.memorySize);
  const references = parsePageReferences(config.referenceString);

  if (references.length === 0) {
    throw new Error("Reference string must include at least one page.");
  }

  const segments = parseSegmentTable(config.segmentTableText);
  const selectedSegment = segments.some(
    (segment) => segment.name === config.segmentName,
  )
    ? config.segmentName
    : segments[0].name;

  const segmentation = new Segmentation(segments);

  return {
    frameCount,
    memorySize,
    references,
    segments,
    selectedSegment,
    paging: simulatePaging({
      frameCount,
      referenceString: references,
      algorithm: config.algorithm,
    }),
    virtualMemory: simulateVirtualMemory({
      frameCount,
      referenceString: references,
      algorithm: config.algorithm,
    }),
    comparison: comparePagingAlgorithms({
      frameCount,
      referenceString: references,
    }),
    translation: segmentation.translate(selectedSegment, config.segmentOffset),
  };
}

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [simulation, setSimulation] = useState(() => buildSimulation(DEFAULT_CONFIG));
  const [errors, setErrors] = useState([]);
  const [playback, setPlayback] = useState({ autoPlay: false });
  const [memorySnapshot, setMemorySnapshot] = useState(() =>
    createSeededMemory(DEFAULT_MEMORY_SIZE),
  );
  const [memoryMessage, setMemoryMessage] = useState({
    type: "success",
    text: "RAM seeded with OS, P1, and P2 blocks.",
  });

  const segmentOptions = useMemo(() => {
    try {
      return parseSegmentTable(config.segmentTableText);
    } catch {
      return simulation.segments;
    }
  }, [config.segmentTableText, simulation.segments]);

  const handleConfigChange = (field, value) => {
    setConfig((current) => {
      const next = { ...current, [field]: value };

      if (field === "segmentTableText") {
        try {
          const parsedSegments = parseSegmentTable(value);
          if (!parsedSegments.some((segment) => segment.name === next.segmentName)) {
            next.segmentName = parsedSegments[0].name;
          }
        } catch {
          return next;
        }
      }

      return next;
    });

    if (field === "memorySize") {
      const parsed = Number.parseInt(value, 10);

      if (Number.isFinite(parsed) && parsed >= 16 && parsed <= 128) {
        setMemorySnapshot(createSeededMemory(parsed));
        setMemoryMessage({
          type: "success",
          text: `RAM resized to ${parsed} cells and reseeded.`,
        });
      }
    }
  };

  const handleRun = () => {
    try {
      const nextSimulation = buildSimulation(config);
      setSimulation(nextSimulation);
      setErrors([]);
      setPlayback({ autoPlay: false });
      setConfig((current) => ({
        ...current,
        segmentName: nextSimulation.selectedSegment,
      }));

      if (memorySnapshot.totalMemory !== nextSimulation.memorySize) {
        setMemorySnapshot(createSeededMemory(nextSimulation.memorySize));
      }
    } catch (error) {
      setErrors([error.message]);
      setPlayback({ autoPlay: false });
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setSimulation(buildSimulation(DEFAULT_CONFIG));
    setErrors([]);
    setPlayback({ autoPlay: false });
    setMemorySnapshot(createSeededMemory(DEFAULT_MEMORY_SIZE));
    setMemoryMessage({
      type: "success",
      text: "Simulation reset to the default showcase state.",
    });
  };

  const handleTogglePlayback = useCallback(() => {
    setPlayback((current) => ({ autoPlay: !current.autoPlay }));
  }, []);

  const handlePlaybackChange = useCallback((partial) => {
    setPlayback((current) => ({ ...current, ...partial }));
  }, []);

  const handleAllocateProcess = ({ processId, size }) => {
    const manager = MemoryManager.fromSnapshot(memorySnapshot);
    const response = manager.allocateProcess(processId, size);

    setMemoryMessage({
      type: response.ok ? "success" : "error",
      text: response.message,
    });

    if (response.ok) {
      setMemorySnapshot(response.snapshot);
    }
  };

  const handleDeallocateProcess = (processId) => {
    const manager = MemoryManager.fromSnapshot(memorySnapshot);
    const response = manager.deallocateProcess(processId);

    setMemoryMessage({
      type: response.ok ? "success" : "error",
      text: response.message,
    });

    if (response.ok) {
      setMemorySnapshot(response.snapshot);
    }
  };

  const summaryStats = [
    {
      label: "Page Faults",
      value: simulation.paging.pageFaults,
      tone: "text-amber-100",
      icon: Activity,
    },
    {
      label: "Hit Rate",
      value: `${Math.round(simulation.paging.hitRate * 100)}%`,
      tone: "text-emerald-100",
      icon: CheckCircle2,
    },
    {
      label: "Frames",
      value: simulation.frameCount,
      tone: "text-cyan-100",
      icon: Cpu,
    },
    {
      label: "Disk Pages",
      value: simulation.virtualMemory.totalPagesOnDisk,
      tone: "text-orange-100",
      icon: HardDrive,
    },
  ];

  return (
    <div className="min-h-screen bg-[#05070b] text-slate-100">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 px-4 py-5 lg:px-6">
        <header className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/80">
                Operating Systems Lab
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Memory Management Simulator & Visualizer
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Paging, segmentation, virtual memory, and contiguous allocation in a
                single interactive workstation.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-md border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      <Icon className="h-4 w-4 text-cyan-300" />
                      {stat.label}
                    </div>
                    <div className={`mt-2 text-2xl font-semibold ${stat.tone}`}>
                      {stat.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <ControlPanel
            config={config}
            errors={errors}
            playback={playback}
            segmentOptions={segmentOptions}
            memorySnapshot={memorySnapshot}
            memoryMessage={memoryMessage}
            onConfigChange={handleConfigChange}
            onRun={handleRun}
            onReset={handleReset}
            onTogglePlayback={handleTogglePlayback}
            onAllocateProcess={handleAllocateProcess}
            onDeallocateProcess={handleDeallocateProcess}
          />

          <div className="space-y-6">
            <Visualizer
              key={`${simulation.paging.algorithm}-${simulation.frameCount}-${simulation.references.join("|")}`}
              result={simulation.paging}
              virtualMemory={simulation.virtualMemory}
              memorySnapshot={memorySnapshot}
              playback={playback}
              onPlaybackChange={handlePlaybackChange}
            />

            {config.comparisonMode && (
              <ComparisonView comparison={simulation.comparison} />
            )}

            <Charts result={simulation.paging} comparison={simulation.comparison} />

            <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
                    Segmentation
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Logical to Physical Translation
                  </h2>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    simulation.translation.ok
                      ? "bg-emerald-500/15 text-emerald-100"
                      : "bg-rose-500/15 text-rose-100"
                  }`}
                >
                  {simulation.translation.ok ? "Address Valid" : "Fault"}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                <div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {simulation.segments.map((segment) => (
                      <div
                        key={segment.name}
                        className="rounded-md border border-white/10 bg-white/5 px-4 py-4"
                      >
                        <div className="text-sm font-semibold text-white">
                          {segment.name}
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-slate-300">
                          <div>Base: {segment.base}</div>
                          <div>Limit: {segment.limit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  {simulation.translation.ok ? (
                    <div className="space-y-3 text-sm text-slate-200">
                      <div>
                        Segment <span className="font-semibold">{simulation.translation.segment}</span>
                      </div>
                      <div>Base {simulation.translation.base}</div>
                      <div>Offset {simulation.translation.offset}</div>
                      <div>Physical Address {simulation.translation.physicalAddress}</div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-rose-100">
                      <div>{simulation.translation.error}</div>
                      <div>
                        Segment <span className="font-semibold">{simulation.translation.segment}</span>
                      </div>
                      {"limit" in simulation.translation && (
                        <div>Limit {simulation.translation.limit}</div>
                      )}
                      {"offset" in simulation.translation && (
                        <div>Offset {simulation.translation.offset}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
