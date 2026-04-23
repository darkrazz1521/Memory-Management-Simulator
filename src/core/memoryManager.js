export class MemoryManager {
  constructor(totalMemory = 48) {
    const parsedTotal = Number.parseInt(totalMemory, 10);

    if (!Number.isFinite(parsedTotal) || parsedTotal < 1) {
      throw new Error("Total memory must be at least 1 cell.");
    }

    this.totalMemory = parsedTotal;
    this.memory = new Array(parsedTotal).fill(null);
    this.processes = new Map();
  }

  static fromSnapshot(snapshot) {
    const manager = new MemoryManager(snapshot.totalMemory);
    manager.memory = [...snapshot.memory];
    manager.processes = new Map(
      (snapshot.processes ?? []).map((process) => [
        process.processId,
        { ...process },
      ]),
    );
    return manager;
  }

  findFreeBlock(size) {
    let start = 0;
    let length = 0;

    for (let index = 0; index <= this.memory.length; index += 1) {
      if (this.memory[index] === null) {
        if (length === 0) {
          start = index;
        }

        length += 1;

        if (length >= size) {
          return start;
        }
      } else {
        length = 0;
      }
    }

    return -1;
  }

  allocateProcess(processId, size) {
    const normalizedProcessId = String(processId ?? "").trim();
    const parsedSize = Number.parseInt(size, 10);

    if (!normalizedProcessId) {
      return { ok: false, message: "Process id is required." };
    }

    if (!Number.isFinite(parsedSize) || parsedSize < 1) {
      return { ok: false, message: "Process size must be at least 1 cell." };
    }

    if (this.processes.has(normalizedProcessId)) {
      return { ok: false, message: `Process ${normalizedProcessId} already exists.` };
    }

    const start = this.findFreeBlock(parsedSize);

    if (start === -1) {
      return {
        ok: false,
        message: `No contiguous block of ${parsedSize} cells is available.`,
      };
    }

    for (let index = start; index < start + parsedSize; index += 1) {
      this.memory[index] = normalizedProcessId;
    }

    const process = {
      processId: normalizedProcessId,
      start,
      size: parsedSize,
      end: start + parsedSize - 1,
    };

    this.processes.set(normalizedProcessId, process);

    return {
      ok: true,
      message: `Allocated ${parsedSize} cells to ${normalizedProcessId}.`,
      process,
      snapshot: this.getSnapshot(),
    };
  }

  allocate(start, size, processId) {
    const parsedStart = Number.parseInt(start, 10);
    const parsedSize = Number.parseInt(size, 10);
    const normalizedProcessId = String(processId ?? "").trim();

    if (
      !normalizedProcessId ||
      !Number.isFinite(parsedStart) ||
      !Number.isFinite(parsedSize) ||
      parsedStart < 0 ||
      parsedSize < 1 ||
      parsedStart + parsedSize > this.totalMemory
    ) {
      return false;
    }

    for (let index = parsedStart; index < parsedStart + parsedSize; index += 1) {
      if (this.memory[index] !== null) {
        return false;
      }
    }

    for (let index = parsedStart; index < parsedStart + parsedSize; index += 1) {
      this.memory[index] = normalizedProcessId;
    }

    this.processes.set(normalizedProcessId, {
      processId: normalizedProcessId,
      start: parsedStart,
      size: parsedSize,
      end: parsedStart + parsedSize - 1,
    });

    return true;
  }

  deallocateProcess(processId) {
    const normalizedProcessId = String(processId ?? "").trim();

    if (!this.processes.has(normalizedProcessId)) {
      return { ok: false, message: `Process ${normalizedProcessId || "(empty)"} not found.` };
    }

    this.memory = this.memory.map((cell) =>
      cell === normalizedProcessId ? null : cell,
    );
    this.processes.delete(normalizedProcessId);

    return {
      ok: true,
      message: `Released process ${normalizedProcessId}.`,
      snapshot: this.getSnapshot(),
    };
  }

  deallocate(processId) {
    this.deallocateProcess(processId);
  }

  getBlocks() {
    if (this.memory.length === 0) {
      return [];
    }

    const blocks = [];
    let current = this.memory[0];
    let start = 0;

    for (let index = 1; index <= this.memory.length; index += 1) {
      if (this.memory[index] !== current) {
        blocks.push({
          processId: current,
          label: current ?? "Free",
          free: current === null,
          start,
          end: index - 1,
          size: index - start,
        });

        current = this.memory[index];
        start = index;
      }
    }

    return blocks;
  }

  getUsage() {
    const usedCells = this.memory.filter((cell) => cell !== null).length;

    return {
      usedCells,
      freeCells: this.totalMemory - usedCells,
      totalCells: this.totalMemory,
      utilization: Number((usedCells / this.totalMemory).toFixed(3)),
    };
  }

  getMemory() {
    return [...this.memory];
  }

  getSnapshot() {
    return {
      totalMemory: this.totalMemory,
      memory: this.getMemory(),
      blocks: this.getBlocks(),
      usage: this.getUsage(),
      processes: [...this.processes.values()],
    };
  }
}

export default MemoryManager;
