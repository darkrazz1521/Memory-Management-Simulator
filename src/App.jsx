import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  GitCompareArrows,
  HardDrive,
  Layers,
  LayoutDashboard,
  MemoryStick,
} from "lucide-react";
import ControlPanel from "./components/ControlPanel";
import Visualizer from "./components/Visualizer";
import ComparisonView from "./components/ComparisonView";
import Charts from "./components/Charts";
import MemoryAllocationView from "./components/MemoryAllocationView";
import SegmentationView from "./components/SegmentationView";
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

const LAB_VIEWS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    caption: "Run snapshot",
  },
  {
    id: "paging",
    label: "Paging",
    icon: Cpu,
    caption: "Frames and faults",
  },
  {
    id: "virtual",
    label: "Virtual Memory",
    icon: HardDrive,
    caption: "RAM and disk",
  },
  {
    id: "comparison",
    label: "Comparison",
    icon: GitCompareArrows,
    caption: "Algorithm results",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: Activity,
    caption: "Fault curves",
  },
  {
    id: "segmentation",
    label: "Segmentation",
    icon: Layers,
    caption: "Address translation",
  },
  {
    id: "allocation",
    label: "Allocation",
    icon: MemoryStick,
    caption: "RAM blocks",
  },
];

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

function getInitialView() {
  const hash = window.location.hash.replace("#", "");
  return LAB_VIEWS.some((view) => view.id === hash) ? hash : "overview";
}

function SummaryStat({ stat }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        <Icon className="h-4 w-4 text-cyan-300" />
        {stat.label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${stat.tone}`}>
        {stat.value}
      </div>
    </div>
  );
}

function LabNavigation({ activeView, onViewChange }) {
  return (
    <nav className="rounded-lg border border-white/10 bg-slate-950/80 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LAB_VIEWS.map((view) => {
          const Icon = view.icon;
          const active = activeView === view.id;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={`flex min-w-[156px] items-center gap-3 rounded-md border px-3 py-3 text-left transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-50"
                  : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                  active
                    ? "border-cyan-300/40 bg-cyan-300/15"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {view.label}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {view.caption}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function PageShell({ children }) {
  return <div className="animate-[surface-in_260ms_ease-out]">{children}</div>;
}

function SplitPage({ controls, children }) {
  return (
    <main className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      {controls}
      <div className="min-w-0">{children}</div>
    </main>
  );
}

function OverviewView({ simulation, memorySnapshot, onViewChange }) {
  const finalFrames = simulation.paging.finalFrames.map((frame) => frame ?? "--");

  return (
    <PageShell>
      <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
              Lab Workspace
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Memory Management Modules
            </h2>
          </div>

          <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
            Current run is ready
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LAB_VIEWS.filter((view) => view.id !== "overview").map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => onViewChange(view.id)}
                className="group rounded-md border border-white/10 bg-white/5 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-cyan-400/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-slate-950/60 text-cyan-200 transition group-hover:border-cyan-300/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Open
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{view.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{view.caption}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Current Run
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Paging Snapshot
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Algorithm
              </div>
              <div className="mt-2 text-2xl font-semibold text-cyan-100">
                {simulation.paging.algorithm}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Faults
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-100">
                {simulation.paging.pageFaults}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Hits
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-100">
                {simulation.paging.hits}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                References
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">
                {simulation.paging.totalReferences}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold text-slate-200">
              Final Frames
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${finalFrames.length}, minmax(0, 1fr))`,
              }}
            >
              {finalFrames.map((frame, index) => (
                <div
                  key={`${frame}-${index}`}
                  className="rounded-md border border-cyan-400/25 bg-cyan-400/10 px-3 py-4 text-center text-lg font-semibold text-cyan-50"
                >
                  {frame}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
            Physical Memory
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Allocation Health
          </h2>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{
                width: `${Math.max(
                  4,
                  memorySnapshot.usage.utilization * 100,
                )}%`,
              }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-white/10 bg-white/5 p-3">
              Used{" "}
              <span className="font-semibold text-white">
                {memorySnapshot.usage.usedCells}
              </span>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-3">
              Free{" "}
              <span className="font-semibold text-white">
                {memorySnapshot.usage.freeCells}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onViewChange("allocation")}
            className="mt-5 w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Open Allocation
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function DisabledPanel({ title }) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-6 text-slate-300 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">
        Enable comparison mode in the paging controls to show this page.
      </p>
    </section>
  );
}

function App() {
  const [activeView, setActiveView] = useState(getInitialView);
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

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(getInitialView());
      setPlayback({ autoPlay: false });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const segmentOptions = useMemo(() => {
    try {
      return parseSegmentTable(config.segmentTableText);
    } catch {
      return simulation.segments;
    }
  }, [config.segmentTableText, simulation.segments]);

  const handleViewChange = useCallback((viewId) => {
    setActiveView(viewId);
    setPlayback({ autoPlay: false });
    window.history.replaceState(null, "", `#${viewId}`);
  }, []);

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

  const controlProps = {
    config,
    errors,
    playback,
    segmentOptions,
    memorySnapshot,
    memoryMessage,
    onConfigChange: handleConfigChange,
    onRun: handleRun,
    onReset: handleReset,
    onTogglePlayback: handleTogglePlayback,
    onAllocateProcess: handleAllocateProcess,
    onDeallocateProcess: handleDeallocateProcess,
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

  const view = LAB_VIEWS.find((item) => item.id === activeView) ?? LAB_VIEWS[0];

  const renderView = () => {
    if (view.id === "overview") {
      return (
        <OverviewView
          simulation={simulation}
          memorySnapshot={memorySnapshot}
          onViewChange={handleViewChange}
        />
      );
    }

    if (view.id === "paging") {
      return (
        <PageShell>
          <SplitPage
            controls={
              <ControlPanel
                {...controlProps}
                title="Paging Inputs"
                eyebrow="Paging Console"
                sections={["paging"]}
              />
            }
          >
            <Visualizer
              key={`paging-${simulation.paging.algorithm}-${simulation.frameCount}-${simulation.references.join("|")}`}
              result={simulation.paging}
              virtualMemory={simulation.virtualMemory}
              playback={playback}
              onPlaybackChange={handlePlaybackChange}
              mode="paging"
            />
          </SplitPage>
        </PageShell>
      );
    }

    if (view.id === "virtual") {
      return (
        <PageShell>
          <SplitPage
            controls={
              <ControlPanel
                {...controlProps}
                title="Virtual Memory Inputs"
                eyebrow="Virtual Console"
                sections={["paging"]}
              />
            }
          >
            <Visualizer
              key={`virtual-${simulation.paging.algorithm}-${simulation.frameCount}-${simulation.references.join("|")}`}
              result={simulation.paging}
              virtualMemory={simulation.virtualMemory}
              playback={playback}
              onPlaybackChange={handlePlaybackChange}
              mode="virtual"
            />
          </SplitPage>
        </PageShell>
      );
    }

    if (view.id === "comparison") {
      return (
        <PageShell>
          <SplitPage
            controls={
              <ControlPanel
                {...controlProps}
                title="Comparison Inputs"
                eyebrow="Algorithm Console"
                sections={["paging"]}
                showPlayback={false}
              />
            }
          >
            {config.comparisonMode ? (
              <ComparisonView comparison={simulation.comparison} />
            ) : (
              <DisabledPanel title="Comparison Mode Disabled" />
            )}
          </SplitPage>
        </PageShell>
      );
    }

    if (view.id === "analytics") {
      return (
        <PageShell>
          <SplitPage
            controls={
              <ControlPanel
                {...controlProps}
                title="Analytics Inputs"
                eyebrow="Chart Console"
                sections={["paging"]}
                showPlayback={false}
              />
            }
          >
            {config.comparisonMode ? (
              <Charts result={simulation.paging} comparison={simulation.comparison} />
            ) : (
              <DisabledPanel title="Analytics Require Comparison Mode" />
            )}
          </SplitPage>
        </PageShell>
      );
    }

    if (view.id === "segmentation") {
      return (
        <PageShell>
          <SplitPage
            controls={
              <ControlPanel
                {...controlProps}
                title="Segmentation Inputs"
                eyebrow="Address Console"
                sections={["segmentation"]}
                showPlayback={false}
              />
            }
          >
            <SegmentationView
              segments={simulation.segments}
              translation={simulation.translation}
            />
          </SplitPage>
        </PageShell>
      );
    }

    return (
      <PageShell>
        <SplitPage
          controls={
            <ControlPanel
              {...controlProps}
              title="Allocation Inputs"
              eyebrow="RAM Console"
              sections={["allocation"]}
              showPlayback={false}
            />
          }
        >
          <MemoryAllocationView memorySnapshot={memorySnapshot} />
        </SplitPage>
      </PageShell>
    );
  };

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
                Paging, segmentation, virtual memory, and allocation are split into
                focused lab pages.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryStats.map((stat) => (
                <SummaryStat key={stat.label} stat={stat} />
              ))}
            </div>
          </div>
        </header>

        <LabNavigation activeView={view.id} onViewChange={handleViewChange} />

        {renderView()}
      </div>
    </div>
  );
}

export default App;
