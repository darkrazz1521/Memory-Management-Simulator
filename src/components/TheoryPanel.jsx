import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  Cpu,
  GitCompareArrows,
  HardDrive,
  Layers,
  LayoutDashboard,
  MemoryStick,
} from "lucide-react";

const surfaceClass =
  "premium-surface rounded-2xl border backdrop-blur";

const THEORY_BY_VIEW = {
  overview: {
    icon: LayoutDashboard,
    title: "How the simulator is organized",
    summary:
      "Each lab focuses on one memory-management concept, but they all tell the same story: how the OS decides where data lives and what happens when space is limited.",
    highlights: ["Paging", "Virtual Memory", "Segmentation", "Allocation"],
    cards: [
      {
        title: "Core Idea",
        body:
          "Operating systems separate logical addresses from physical memory so programs can run safely, efficiently, and without needing fixed RAM positions.",
      },
      {
        title: "How to read the labs",
        body:
          "Use the sidebar to move between focused workspaces. Each page keeps the same simulation inputs but frames the output around a single OS concept.",
      },
      {
        title: "What to watch for",
        body:
          "Notice when the system hits in RAM, when it faults, how victims are selected, and how translation rules either resolve or reject an address.",
      },
    ],
    workflow: [
      "Input a reference string, frame count, or address data.",
      "Run the simulation to generate a deterministic history.",
      "Read the visual state changes and the theory deck together.",
    ],
  },
  paging: {
    icon: Cpu,
    title: "Paging and replacement theory",
    summary:
      "Paging divides logical memory into equal-sized pages and physical memory into equal-sized frames. A reference is a hit if the page is already loaded, otherwise the OS takes a page fault and may replace a victim.",
    highlights: ["Page", "Frame", "Hit", "Page Fault", "Victim"],
    cards: [
      {
        title: "Why paging exists",
        body:
          "Equal-sized chunks remove external fragmentation and let the OS map any page into any free frame, which makes placement flexible and predictable.",
      },
      {
        title: "What the algorithm changes",
        body:
          "FIFO removes the oldest resident page, LRU removes the least recently used page, MRU removes the most recently used page, and OPT removes the page used farthest in the future.",
      },
      {
        title: "How to read the visualizer",
        body:
          "The active reference drives each step. Red means the system had to fault, amber marks the frame that changed, and the side rail explains exactly why that decision happened.",
      },
    ],
    workflow: [
      "The CPU references a page number.",
      "The OS checks whether that page is already in one of the frames.",
      "If not, a replacement rule chooses which resident page should leave.",
    ],
  },
  virtual: {
    icon: HardDrive,
    title: "Virtual memory theory",
    summary:
      "Virtual memory extends RAM with disk-backed storage. Programs behave as if they have more memory available, while the OS moves pages between disk and RAM on demand.",
    highlights: ["Resident Set", "Disk", "Swap", "Demand Paging"],
    cards: [
      {
        title: "What changes from basic paging",
        body:
          "The page table still maps pages to frames, but now pages can live off-RAM on disk until the process touches them.",
      },
      {
        title: "What a fault means here",
        body:
          "A page fault triggers I/O work: the requested page is fetched from disk, and if RAM is full a victim page is written back or discarded depending on the policy.",
      },
      {
        title: "How to read the RAM and disk states",
        body:
          "The resident set shows which pages are actively in RAM. The disk pile shows what is still virtual-only, so every swap is a visible movement between the two tiers.",
      },
    ],
    workflow: [
      "A process references a page that may or may not be resident.",
      "RAM serves hits immediately and disk handles misses.",
      "Replacement updates the resident set while preserving the illusion of a larger address space.",
    ],
  },
  comparison: {
    icon: GitCompareArrows,
    title: "Why algorithm comparison matters",
    summary:
      "The same workload can behave very differently under different replacement rules. Comparison mode turns one run into a policy study so you can see which algorithm minimizes page faults for that reference pattern.",
    highlights: ["Same workload", "Different policy", "Best faults", "Benchmark"],
    cards: [
      {
        title: "Fair comparison",
        body:
          "Every algorithm is fed the same reference string and frame count, so the page-fault totals reflect only policy differences, not input changes.",
      },
      {
        title: "How to interpret the winner",
        body:
          "The lowest-fault algorithm is best for that specific pattern. OPT is useful as a theoretical lower bound because it knows the future, not because a real OS can implement it exactly.",
      },
      {
        title: "What to look for",
        body:
          "Compare both the total faults and the final frame contents. Two policies can end differently even if they are close on fault count.",
      },
    ],
    workflow: [
      "Generate one paging history per algorithm.",
      "Aggregate fault totals and final states.",
      "Highlight the policy that handled the workload most efficiently.",
    ],
  },
  analytics: {
    icon: Activity,
    title: "What the charts are teaching",
    summary:
      "Charts turn the simulation history into patterns. Instead of reading isolated steps, you can see whether memory pressure is steady, clustered, or caused by a few expensive references.",
    highlights: ["Trend", "Fault slope", "Cumulative hits", "Pressure"],
    cards: [
      {
        title: "Bar chart meaning",
        body:
          "The comparison bar chart answers the simplest question first: which algorithm generated the fewest page faults for the current workload.",
      },
      {
        title: "Line chart meaning",
        body:
          "The timeline chart shows how faults and hits accumulate over time. A steep fault curve means the workload is repeatedly forcing misses.",
      },
      {
        title: "Why analytics helps",
        body:
          "Visual trends make it easier to explain why one algorithm behaves better than another during viva, review, or portfolio walkthroughs.",
      },
    ],
    workflow: [
      "Convert the simulation history into cumulative counters.",
      "Plot fault totals per algorithm and per step.",
      "Use the shape of the curves to explain the underlying access pattern.",
    ],
  },
  segmentation: {
    icon: Layers,
    title: "Segmentation theory",
    summary:
      "Segmentation models memory as logically meaningful regions such as code, heap, and stack. Each segment has a base and limit, and an address is valid only if its offset stays inside that segment.",
    highlights: ["Base", "Limit", "Offset", "Segmentation Fault"],
    cards: [
      {
        title: "Why segmentation is different",
        body:
          "Unlike paging, segments are variable-sized and carry program meaning. That makes protection intuitive, but it can introduce fragmentation.",
      },
      {
        title: "Translation rule",
        body:
          "If offset < limit, the physical address is base + offset. If the offset exceeds the segment limit, the hardware raises a segmentation fault.",
      },
      {
        title: "How to read this page",
        body:
          "The active segment card shows its physical range, and the translation panel makes the pass or fail decision explicit so the arithmetic is easy to follow.",
      },
    ],
    workflow: [
      "Choose a logical segment and offset.",
      "Look up the segment's base and limit in the segment table.",
      "Either compute the physical address or reject the access as invalid.",
    ],
  },
  allocation: {
    icon: MemoryStick,
    title: "Contiguous allocation theory",
    summary:
      "Contiguous allocation gives each process one continuous block of RAM. It is simple to understand, but it can suffer from fragmentation when free space is broken into small holes.",
    highlights: ["Contiguous block", "Free list", "Fragmentation", "Merge"],
    cards: [
      {
        title: "How allocation works",
        body:
          "The memory manager scans for a free block large enough to satisfy the request, reserves it, and records the process boundaries.",
      },
      {
        title: "What deallocation does",
        body:
          "When a process is released, its cells become free again. Neighboring free ranges can merge so the allocator regains larger usable blocks.",
      },
      {
        title: "What to watch in the grid",
        body:
          "Look for isolated gaps and for cases where total free space exists but no single contiguous hole is large enough for the new process.",
      },
    ],
    workflow: [
      "Submit a process id and requested size.",
      "Find a large enough free block and reserve it.",
      "Release processes to observe fragmentation and recovery.",
    ],
  },
};

function TheoryPanel({ viewId }) {
  const theory = THEORY_BY_VIEW[viewId] ?? THEORY_BY_VIEW.overview;
  const Icon = theory.icon;

  return (
    <section className={`${surfaceClass} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs text-premium-muted">Theory Deck</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="premium-subsurface-soft flex h-10 w-10 items-center justify-center rounded-xl text-premium-accent">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-50">
                {theory.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-premium-muted">
                {theory.summary}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-subsurface inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-300">
          <BookOpen className="h-4 w-4 text-premium-gold" />
          Learn the model
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {theory.highlights.map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ y: -2 }}
            className="premium-subsurface premium-interactive rounded-full px-3 py-1.5 text-xs text-slate-300"
          >
            {item}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-3">
        {theory.cards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="premium-subsurface premium-interactive rounded-2xl p-4"
          >
            <div className="text-sm font-semibold text-slate-50">{card.title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{card.body}</p>
          </motion.article>
        ))}
      </div>

      <div className="premium-subsurface-soft mt-6 rounded-2xl p-4">
        <div className="text-sm font-semibold text-slate-50">
          How it works step by step
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {theory.workflow.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              className="premium-subsurface rounded-2xl p-4"
            >
              <div className="text-xs text-premium-muted">Step {index + 1}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TheoryPanel;
