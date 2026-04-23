export const PAGE_ALGORITHMS = ["FIFO", "LRU", "MRU", "OPT"];

const EMPTY_FRAME = null;

export function normalizeAlgorithm(algorithm = "FIFO") {
  const normalized = String(algorithm).trim().toUpperCase();
  return PAGE_ALGORITHMS.includes(normalized) ? normalized : "FIFO";
}

export function parsePageReferences(input) {
  if (Array.isArray(input)) {
    return input
      .filter((page) => page !== null && page !== undefined)
      .map((page) => String(page).trim())
      .filter(Boolean);
  }

  return String(input ?? "")
    .split(/[,\s]+/)
    .map((page) => page.trim())
    .filter(Boolean);
}

function normalizeFrameCount(frameCount) {
  const parsed = Number.parseInt(frameCount, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("Frame count must be at least 1.");
  }

  return parsed;
}

function padFrames(frames, frameCount) {
  return Array.from({ length: frameCount }, (_, index) =>
    frames[index] ?? EMPTY_FRAME,
  );
}

function nextUseIndex(references, page, currentIndex) {
  return references.indexOf(page, currentIndex + 1);
}

function chooseReplacementIndex({
  algorithm,
  frames,
  fifoQueue,
  lastUsed,
  references,
  currentIndex,
}) {
  if (algorithm === "FIFO") {
    const victim = fifoQueue.shift();
    const victimIndex = frames.indexOf(victim);
    return victimIndex === -1 ? 0 : victimIndex;
  }

  if (algorithm === "LRU") {
    return frames.reduce((leastRecentIndex, page, index) => {
      const leastRecentPage = frames[leastRecentIndex];
      const pageLastUsed = lastUsed.get(page) ?? -1;
      const leastRecentLastUsed = lastUsed.get(leastRecentPage) ?? -1;
      return pageLastUsed < leastRecentLastUsed ? index : leastRecentIndex;
    }, 0);
  }

  if (algorithm === "MRU") {
    return frames.reduce((mostRecentIndex, page, index) => {
      const mostRecentPage = frames[mostRecentIndex];
      const pageLastUsed = lastUsed.get(page) ?? -1;
      const mostRecentLastUsed = lastUsed.get(mostRecentPage) ?? -1;
      return pageLastUsed > mostRecentLastUsed ? index : mostRecentIndex;
    }, 0);
  }

  return frames.reduce(
    (best, page, index) => {
      const futureIndex = nextUseIndex(references, page, currentIndex);

      if (futureIndex === -1) {
        return { index, distance: Number.POSITIVE_INFINITY };
      }

      if (futureIndex > best.distance) {
        return { index, distance: futureIndex };
      }

      return best;
    },
    { index: 0, distance: -1 },
  ).index;
}

function buildFrameMeta({ frames, algorithm, references, currentIndex, lastUsed }) {
  return frames.map((page) => {
    if (page === EMPTY_FRAME) {
      return { page, nextUse: null, lastUsed: null };
    }

    return {
      page,
      lastUsed: lastUsed.get(page) ?? null,
      nextUse:
        algorithm === "OPT" ? nextUseIndex(references, page, currentIndex) : null,
    };
  });
}

export function simulatePaging({
  frameCount = 3,
  referenceString = [],
  algorithm = "FIFO",
} = {}) {
  const normalizedFrameCount = normalizeFrameCount(frameCount);
  const references = parsePageReferences(referenceString);
  const normalizedAlgorithm = normalizeAlgorithm(algorithm);

  if (references.length === 0) {
    throw new Error("Reference string must contain at least one page.");
  }

  const frames = [];
  const fifoQueue = [];
  const lastUsed = new Map();
  const history = [];
  let pageFaults = 0;
  let hits = 0;

  references.forEach((page, index) => {
    const hitIndex = frames.indexOf(page);
    const pageFault = hitIndex === -1;
    let insertedFrameIndex = hitIndex;
    let replaced = null;
    let replacedFrameIndex = null;
    let action = `Page ${page} was already resident in RAM.`;

    if (pageFault) {
      pageFaults += 1;

      if (frames.length < normalizedFrameCount) {
        frames.push(page);
        insertedFrameIndex = frames.length - 1;
        action = `Loaded page ${page} into an empty frame.`;
      } else {
        const targetIndex = chooseReplacementIndex({
          algorithm: normalizedAlgorithm,
          frames,
          fifoQueue,
          lastUsed,
          references,
          currentIndex: index,
        });

        replaced = frames[targetIndex];
        replacedFrameIndex = targetIndex;
        insertedFrameIndex = targetIndex;
        frames[targetIndex] = page;
        action = `Replaced page ${replaced} with page ${page}.`;
      }

      if (normalizedAlgorithm === "FIFO") {
        fifoQueue.push(page);
      }
    } else {
      hits += 1;
    }

    lastUsed.set(page, index);

    const frameSnapshot = padFrames(frames, normalizedFrameCount);
    history.push({
      step: index + 1,
      referenceIndex: index,
      currentPage: page,
      frames: frameSnapshot,
      pageFault,
      hit: !pageFault,
      replaced,
      replacedFrameIndex,
      insertedFrameIndex,
      faultCount: pageFaults,
      hitCount: hits,
      algorithm: normalizedAlgorithm,
      action,
      frameMeta: buildFrameMeta({
        frames: frameSnapshot,
        algorithm: normalizedAlgorithm,
        references,
        currentIndex: index,
        lastUsed,
      }),
      fifoQueue: [...fifoQueue],
    });
  });

  const replacements = history
    .filter((step) => step.replaced !== null)
    .map((step) => ({
      step: step.step,
      incomingPage: step.currentPage,
      replacedPage: step.replaced,
      frameIndex: step.replacedFrameIndex,
      algorithm: step.algorithm,
    }));

  return {
    algorithm: normalizedAlgorithm,
    frameCount: normalizedFrameCount,
    referenceString: references,
    totalReferences: references.length,
    pageFaults,
    hits,
    faultRate: Number((pageFaults / references.length).toFixed(3)),
    hitRate: Number((hits / references.length).toFixed(3)),
    replacements,
    finalFrames: padFrames(frames, normalizedFrameCount),
    history,
  };
}

export function comparePagingAlgorithms({
  frameCount = 3,
  referenceString = [],
  algorithms = PAGE_ALGORITHMS,
} = {}) {
  const results = algorithms.map((algorithm) =>
    simulatePaging({ frameCount, referenceString, algorithm }),
  );

  const faultCounts = results.map((result) => result.pageFaults);
  const minFaults = Math.min(...faultCounts);
  const maxFaults = Math.max(...faultCounts);

  return {
    results,
    minFaults,
    maxFaults,
    bestAlgorithms: results
      .filter((result) => result.pageFaults === minFaults)
      .map((result) => result.algorithm),
    worstAlgorithms: results
      .filter((result) => result.pageFaults === maxFaults)
      .map((result) => result.algorithm),
    averageFaults: Number(
      (
        faultCounts.reduce((total, faults) => total + faults, 0) /
        faultCounts.length
      ).toFixed(2),
    ),
  };
}

export class Paging {
  constructor(frameCount, algorithm = "FIFO") {
    this.frameCount = frameCount;
    this.algorithm = normalizeAlgorithm(algorithm);
    this.frames = [];
    this.pageFaults = 0;
    this.history = [];
  }

  process(pages) {
    const result = simulatePaging({
      frameCount: this.frameCount,
      referenceString: pages,
      algorithm: this.algorithm,
    });

    this.frames = result.finalFrames.filter((frame) => frame !== EMPTY_FRAME);
    this.pageFaults = result.pageFaults;
    this.history = result.history;

    return result;
  }
}
