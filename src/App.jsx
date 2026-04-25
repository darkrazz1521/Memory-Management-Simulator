import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import TheoryPanel from "./components/TheoryPanel";
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
const SURFACE_CLASS =
  "premium-surface rounded-2xl border backdrop-blur";

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
    caption: "Run summary",
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
    caption: "Address map",
  },
  {
    id: "allocation",
    label: "Allocation",
    icon: MemoryStick,
    caption: "RAM blocks",
  },
];

const pageTransition = {
  initial: { opacity: 0, y: 18, scale: 0.988, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -14, scale: 0.994, filter: "blur(8px)" },
  transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
};

const staggerList = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const itemTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24 } },
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

function getInitialView() {
  if (typeof window === "undefined") {
    return "overview";
  }

  const hash = window.location.hash.replace("#", "");
  return LAB_VIEWS.some((view) => view.id === hash) ? hash : "overview";
}

function SummaryStat({ stat }) {
  const Icon = stat.icon;

  return (
    <motion.div
      variants={itemTransition}
      whileHover={{ y: -3, scale: 1.01 }}
      className="premium-subsurface premium-interactive rounded-2xl px-4 py-4"
    >
      <div className="flex items-center gap-2 text-xs text-premium-muted">
        <Icon className="h-4 w-4 text-premium-accent" />
        {stat.label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${stat.tone}`}>{stat.value}</div>
    </motion.div>
  );
}

function SidebarItem({ collapsed, active, view, onViewChange }) {
  const Icon = view.icon;

  return (
    <motion.button
      type="button"
      layout
      title={view.label}
      onClick={() => onViewChange(view.id)}
      whileHover={{ x: 1.5 }}
      whileTap={{ scale: 0.985 }}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-left"
    >
      {active && (
        <motion.span
          layoutId="active-sidebar-indicator"
          className="absolute inset-0 rounded-xl border border-white/[0.14] bg-[rgba(120,196,179,0.12)]"
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        />
      )}

      <span
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          active
            ? "border-white/[0.16] bg-[rgba(120,196,179,0.12)] text-slate-50"
            : "premium-subsurface-soft text-premium-muted"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      {!collapsed && (
        <span className="relative z-10 min-w-0">
          <span
            className={`block truncate text-sm ${
              active ? "font-semibold text-slate-50" : "text-slate-300"
            }`}
          >
            {view.label}
          </span>
          <span className="block truncate text-xs text-premium-muted">
            {view.caption}
          </span>
        </span>
      )}
    </motion.button>
  );
}

function DesktopSidebar({
  activeView,
  collapsed,
  currentAlgorithm,
  currentFaults,
  onToggle,
  onViewChange,
}) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 94 : 280 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`${SURFACE_CLASS} sticky top-4 hidden h-[calc(100vh-2rem)] flex-col xl:flex`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-4">
        {!collapsed ? (
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-premium-muted">
              Memory Simulator
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-50">
              Control Workspace
            </div>
          </div>
        ) : (
          <div className="premium-subsurface-soft flex h-10 w-10 items-center justify-center rounded-xl text-slate-200">
            <LayoutDashboard className="h-4 w-4" />
          </div>
        )}

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          className="premium-outline-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </motion.button>
      </div>

      <LayoutGroup>
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {LAB_VIEWS.map((view) => (
            <SidebarItem
              key={view.id}
              collapsed={collapsed}
              active={activeView === view.id}
              view={view}
              onViewChange={onViewChange}
            />
          ))}
        </div>
      </LayoutGroup>

      <div className="border-t border-white/[0.08] px-3 py-4">
        <div className="premium-subsurface rounded-xl px-3 py-3">
          <div className="text-[11px] text-premium-muted">
            {collapsed ? "Run" : "Active Run"}
          </div>
          {!collapsed ? (
            <>
              <div className="mt-2 text-sm font-semibold text-slate-50">
                {currentAlgorithm}
              </div>
              <div className="mt-1 text-xs text-premium-muted">
                {currentFaults} page faults
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm font-semibold text-slate-50">
              {currentFaults}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function MobileNavigation({ activeView, onViewChange }) {
  return (
    <div className="overflow-x-auto xl:hidden">
      <div className="flex min-w-max gap-2 pb-1">
        {LAB_VIEWS.map((view) => {
          const Icon = view.icon;
          const active = activeView === view.id;

          return (
            <motion.button
              key={view.id}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onViewChange(view.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                active
                  ? "border-white/[0.16] bg-[rgba(120,196,179,0.14)] text-slate-50"
                  : "premium-subsurface text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {view.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function TopBar({ currentView, currentAlgorithm, currentFaults }) {
  return (
    <header className={`${SURFACE_CLASS} sticky top-4 z-20 px-4 py-4`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-premium-muted">
            Memory Management Simulator
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-50">
              {currentView.label}
            </h1>
            <span className="text-sm text-premium-muted">{currentView.caption}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <motion.div whileHover={{ y: -1 }} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[rgba(139,200,180,0.12)] px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-300" />
            Ready
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="premium-subsurface inline-flex items-center gap-2 rounded-full px-3 py-1.5">
            <Cpu className="h-3.5 w-3.5 text-premium-accent" />
            {currentAlgorithm}
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[rgba(210,186,134,0.14)] px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-300" />
            {currentFaults} faults
          </motion.div>
        </div>
      </div>
    </header>
  );
}

function PageShell({ viewId, children }) {
  return (
    <motion.div key={viewId} {...pageTransition}>
      {children}
    </motion.div>
  );
}

function SplitPage({ controls, children }) {
  return (
    <div className="mt-4">
      <div className="grid gap-6 xl:grid-cols-[332px_minmax(0,1fr)] 2xl:grid-cols-[348px_minmax(0,1fr)] xl:items-start">
        <div className="xl:sticky xl:top-24 xl:self-start">
          {controls}
        </div>
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function OverviewView({ simulation, memorySnapshot, onViewChange }) {
  const finalFrames = simulation.paging.finalFrames.map((frame) => frame ?? "--");

  return (
    <div className="space-y-6">
      <motion.section
        variants={staggerList}
        initial="initial"
        animate="animate"
        className={`${SURFACE_CLASS} p-5`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-premium-muted">Workspace</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">
              Memory Management Modules
            </h2>
          </div>

          <div className="status-success rounded-full px-3 py-1.5 text-sm">
            Current run ready
          </div>
        </div>

        <motion.div
          variants={staggerList}
          className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {LAB_VIEWS.filter((view) => view.id !== "overview").map((view) => {
            const Icon = view.icon;
            return (
              <motion.button
                key={view.id}
                variants={itemTransition}
                type="button"
                whileHover={{ y: -4, scale: 1.012 }}
                whileTap={{ scale: 0.992 }}
                onClick={() => onViewChange(view.id)}
                className="premium-subsurface premium-interactive group rounded-2xl p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="premium-subsurface-soft flex h-10 w-10 items-center justify-center rounded-xl text-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-premium-muted transition group-hover:text-premium-accent" />
                </div>
                <div className="mt-5 text-base font-semibold text-slate-50">
                  {view.label}
                </div>
                <div className="mt-1 text-sm text-premium-muted">{view.caption}</div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section
          {...itemTransition}
          className={`${SURFACE_CLASS} p-5`}
        >
          <p className="text-xs text-premium-muted">Current Run</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            Paging Snapshot
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="premium-subsurface rounded-2xl p-4">
              <div className="text-xs text-premium-muted">Algorithm</div>
              <div className="mt-2 text-2xl font-semibold text-slate-50">
                {simulation.paging.algorithm}
              </div>
            </div>
            <div className="premium-subsurface rounded-2xl p-4">
              <div className="text-xs text-premium-muted">Faults</div>
              <div className="mt-2 text-2xl font-semibold text-amber-100">
                {simulation.paging.pageFaults}
              </div>
            </div>
            <div className="premium-subsurface rounded-2xl p-4">
              <div className="text-xs text-premium-muted">Hits</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-100">
                {simulation.paging.hits}
              </div>
            </div>
            <div className="premium-subsurface rounded-2xl p-4">
              <div className="text-xs text-premium-muted">References</div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">
                {simulation.paging.totalReferences}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-200">Final Frames</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {finalFrames.map((frame, index) => (
                <motion.div
                  key={`${frame}-${index}`}
                  layout
                  whileHover={{ y: -2 }}
                  className="premium-subsurface rounded-2xl px-4 py-4 text-center text-lg font-semibold text-slate-50"
                >
                  {frame}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          {...itemTransition}
          className={`${SURFACE_CLASS} p-5`}
        >
          <p className="text-xs text-premium-muted">Physical Memory</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            Allocation Health
          </h2>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div
              initial={false}
              animate={{
                width: `${Math.max(4, memorySnapshot.usage.utilization * 100)}%`,
              }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--gold))]"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="premium-subsurface rounded-2xl p-4">
              Used{" "}
              <span className="font-semibold text-stone-50">
                {memorySnapshot.usage.usedCells}
              </span>
            </div>
            <div className="premium-subsurface rounded-2xl p-4">
              Free{" "}
              <span className="font-semibold text-stone-50">
                {memorySnapshot.usage.freeCells}
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onViewChange("allocation")}
            className="premium-outline-button mt-5 w-full rounded-2xl px-4 py-2.5 text-sm text-slate-100 transition"
          >
            Open Allocation
          </motion.button>
        </motion.section>
      </div>
    </div>
  );
}

function DisabledPanel({ title }) {
  return (
    <section className={`${SURFACE_CLASS} p-6`}>
      <h2 className="text-xl font-semibold text-slate-50">{title}</h2>
      <p className="mt-2 text-sm text-premium-muted">
        Enable comparison mode in the paging controls to show this page.
      </p>
    </section>
  );
}

function App() {
  const [activeView, setActiveView] = useState(getInitialView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const currentView = useMemo(
    () => LAB_VIEWS.find((item) => item.id === activeView) ?? LAB_VIEWS[0],
    [activeView],
  );

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
      tone: "text-stone-50",
      icon: Cpu,
    },
    {
      label: "Disk Pages",
      value: simulation.virtualMemory.totalPagesOnDisk,
      tone: "text-stone-200",
      icon: HardDrive,
    },
  ];

  const renderView = () => {
    if (currentView.id === "overview") {
      return (
        <OverviewView
          simulation={simulation}
          memorySnapshot={memorySnapshot}
          onViewChange={handleViewChange}
        />
      );
    }

    if (currentView.id === "paging") {
      return (
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
          <div className="space-y-6">
            <Visualizer
              key={`paging-${simulation.paging.algorithm}-${simulation.frameCount}-${simulation.references.join("|")}`}
              result={simulation.paging}
              virtualMemory={simulation.virtualMemory}
              playback={playback}
              onPlaybackChange={handlePlaybackChange}
              mode="paging"
            />
            <TheoryPanel viewId={currentView.id} />
          </div>
        </SplitPage>
      );
    }

    if (currentView.id === "virtual") {
      return (
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
          <div className="space-y-6">
            <Visualizer
              key={`virtual-${simulation.paging.algorithm}-${simulation.frameCount}-${simulation.references.join("|")}`}
              result={simulation.paging}
              virtualMemory={simulation.virtualMemory}
              playback={playback}
              onPlaybackChange={handlePlaybackChange}
              mode="virtual"
            />
            <TheoryPanel viewId={currentView.id} />
          </div>
        </SplitPage>
      );
    }

    if (currentView.id === "comparison") {
      return (
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
          <div className="space-y-6">
            {config.comparisonMode ? (
              <ComparisonView comparison={simulation.comparison} />
            ) : (
              <DisabledPanel title="Comparison Mode Disabled" />
            )}
            <TheoryPanel viewId={currentView.id} />
          </div>
        </SplitPage>
      );
    }

    if (currentView.id === "analytics") {
      return (
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
          <div className="space-y-6">
            {config.comparisonMode ? (
              <Charts result={simulation.paging} comparison={simulation.comparison} />
            ) : (
              <DisabledPanel title="Analytics Require Comparison Mode" />
            )}
            <TheoryPanel viewId={currentView.id} />
          </div>
        </SplitPage>
      );
    }

    if (currentView.id === "segmentation") {
      return (
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
          <div className="space-y-6">
            <SegmentationView
              segments={simulation.segments}
              translation={simulation.translation}
            />
            <TheoryPanel viewId={currentView.id} />
          </div>
        </SplitPage>
      );
    }

    return (
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
        <div className="space-y-6">
          <MemoryAllocationView memorySnapshot={memorySnapshot} />
          <TheoryPanel viewId={currentView.id} />
        </div>
      </SplitPage>
    );
  };

  return (
    <div className="app-shell min-h-screen bg-[var(--bg-0)] text-slate-100">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-x-[-10%] top-24 h-px bg-[linear-gradient(90deg,transparent,rgba(120,196,179,0.32),transparent)]"
          animate={{ x: ["-6%", "6%", "-6%"], opacity: [0.16, 0.45, 0.16] }}
          transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-x-[-10%] top-[58%] h-px bg-[linear-gradient(90deg,transparent,rgba(210,186,134,0.28),transparent)]"
          animate={{ x: ["8%", "-8%", "8%"], opacity: [0.08, 0.28, 0.08] }}
          transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <DesktopSidebar
          activeView={currentView.id}
          collapsed={sidebarCollapsed}
          currentAlgorithm={simulation.paging.algorithm}
          currentFaults={simulation.paging.pageFaults}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          onViewChange={handleViewChange}
        />

        <div className="min-w-0 flex-1">
          <TopBar
            currentView={currentView}
            currentAlgorithm={simulation.paging.algorithm}
            currentFaults={simulation.paging.pageFaults}
          />

          {currentView.id === "overview" ? (
            <motion.section
              variants={staggerList}
              initial="initial"
              animate="animate"
              className={`${SURFACE_CLASS} mt-4 p-5`}
            >
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-3xl">
                  <p className="text-xs text-premium-muted">Operating Systems Lab</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-50">
                    Memory Management Simulator
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-premium-muted">
                    Paging, segmentation, virtual memory, and allocation presented
                    in a quieter dashboard shell.
                  </p>
                </div>

                <motion.div
                  variants={staggerList}
                  className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                  {summaryStats.map((stat) => (
                    <SummaryStat key={stat.label} stat={stat} />
                  ))}
                </motion.div>
              </div>

              <div className="mt-5">
                <MobileNavigation
                  activeView={currentView.id}
                  onViewChange={handleViewChange}
                />
              </div>
            </motion.section>
          ) : (
            <div className="mt-4 xl:hidden">
              <MobileNavigation
                activeView={currentView.id}
                onViewChange={handleViewChange}
              />
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <PageShell viewId={currentView.id}>
              {currentView.id === "overview" ? (
                <div className="space-y-6">
                  {renderView()}
                  <TheoryPanel viewId={currentView.id} />
                </div>
              ) : (
                renderView()
              )}
            </PageShell>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
