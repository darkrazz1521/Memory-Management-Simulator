import { parsePageReferences, simulatePaging } from "./paging";

function uniqueInOrder(values) {
  const seen = new Set();
  const unique = [];

  values.forEach((value) => {
    if (!seen.has(value)) {
      seen.add(value);
      unique.push(value);
    }
  });

  return unique;
}

export function simulateVirtualMemory({
  frameCount = 3,
  referenceString = [],
  algorithm = "FIFO",
} = {}) {
  const references = parsePageReferences(referenceString);
  const virtualPages = uniqueInOrder(references);
  const pagingResult = simulatePaging({
    frameCount,
    referenceString: references,
    algorithm,
  });

  const history = pagingResult.history.map((step) => {
    const ramPages = step.frames.filter((page) => page !== null);
    const diskPages = virtualPages.filter((page) => !ramPages.includes(page));

    return {
      ...step,
      ramPages,
      diskPages,
      movement: step.pageFault
        ? {
            type: step.replaced === null ? "load" : "swap",
            incomingPage: step.currentPage,
            evictedPage: step.replaced,
            from: "Disk",
            to: "RAM",
          }
        : {
            type: "hit",
            incomingPage: step.currentPage,
            evictedPage: null,
            from: "RAM",
            to: "CPU",
          },
    };
  });

  const finalStep = history.at(-1);

  return {
    ...pagingResult,
    history,
    virtualPages,
    totalPagesOnDisk: virtualPages.length,
    finalRAM: finalStep?.ramPages ?? [],
    finalDisk: finalStep?.diskPages ?? virtualPages,
    swapCount: pagingResult.replacements.length,
  };
}

export class VirtualMemory {
  constructor(frameCount, algorithm = "FIFO") {
    if (typeof frameCount === "object" && frameCount !== null) {
      this.frameCount = frameCount.frameCount;
      this.algorithm = frameCount.algorithm ?? algorithm;
    } else {
      this.frameCount = frameCount;
      this.algorithm = algorithm;
    }

    this.disk = new Set();
    this.ram = [];
  }

  loadPages(pages) {
    parsePageReferences(pages).forEach((page) => this.disk.add(page));
  }

  run(pages) {
    const result = simulateVirtualMemory({
      frameCount: this.frameCount,
      referenceString: pages,
      algorithm: this.algorithm,
    });

    result.virtualPages.forEach((page) => this.disk.add(page));
    this.ram = result.finalRAM;

    return result;
  }
}
