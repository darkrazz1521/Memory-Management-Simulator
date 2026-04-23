export const DEFAULT_SEGMENTS = [
  { name: "Code", base: 120, limit: 80 },
  { name: "Heap", base: 320, limit: 120 },
  { name: "Stack", base: 620, limit: 96 },
  { name: "IO", base: 840, limit: 64 },
];

function toPositiveInteger(value, fieldName, allowZero = true) {
  const parsed = Number.parseInt(value, 10);
  const minimum = allowZero ? 0 : 1;

  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${fieldName} must be ${allowZero ? "non-negative" : "positive"}.`);
  }

  return parsed;
}

export function normalizeSegment({ name, base, limit }) {
  const normalizedName = String(name ?? "").trim();

  if (!normalizedName) {
    throw new Error("Segment name is required.");
  }

  return {
    name: normalizedName,
    base: toPositiveInteger(base, "Segment base"),
    limit: toPositiveInteger(limit, "Segment limit", false),
  };
}

export function parseSegmentTable(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Segment table must contain at least one segment.");
  }

  const segments = lines.map((line) => {
    const parts = line.replace(/[:,]/g, " ").split(/\s+/);

    if (parts.length < 3) {
      throw new Error(`Invalid segment row: "${line}".`);
    }

    const [name, base, limit] = parts;
    return normalizeSegment({ name, base, limit });
  });

  const names = new Set();
  segments.forEach((segment) => {
    const key = segment.name.toLowerCase();

    if (names.has(key)) {
      throw new Error(`Duplicate segment name: ${segment.name}.`);
    }

    names.add(key);
  });

  return segments;
}

export function segmentTableToText(segments = DEFAULT_SEGMENTS) {
  return segments
    .map((segment) => `${segment.name}: ${segment.base}, ${segment.limit}`)
    .join("\n");
}

function normalizeSegments(input) {
  if (Array.isArray(input)) {
    return input.map(normalizeSegment);
  }

  if (input && typeof input === "object") {
    return Object.entries(input).map(([name, segment]) =>
      normalizeSegment({ name, base: segment.base, limit: segment.limit }),
    );
  }

  return DEFAULT_SEGMENTS.map(normalizeSegment);
}

export class Segmentation {
  constructor(segments = DEFAULT_SEGMENTS) {
    this.segments = normalizeSegments(segments);
  }

  addSegment(name, base, limit) {
    const segment = normalizeSegment({ name, base, limit });
    const existingIndex = this.segments.findIndex(
      (item) => item.name.toLowerCase() === segment.name.toLowerCase(),
    );

    if (existingIndex === -1) {
      this.segments.push(segment);
    } else {
      this.segments[existingIndex] = segment;
    }

    return segment;
  }

  getSegment(name) {
    return this.segments.find(
      (segment) => segment.name.toLowerCase() === String(name).toLowerCase(),
    );
  }

  translate(segmentName, offset) {
    const parsedOffset = Number.parseInt(offset, 10);

    if (!Number.isFinite(parsedOffset) || parsedOffset < 0) {
      return {
        ok: false,
        status: "FAULT",
        error: "Offset must be a non-negative integer.",
        segment: segmentName,
      };
    }

    const segment = this.getSegment(segmentName);

    if (!segment) {
      return {
        ok: false,
        status: "FAULT",
        error: "Segment not found.",
        segment: segmentName,
        offset: parsedOffset,
      };
    }

    if (parsedOffset >= segment.limit) {
      return {
        ok: false,
        status: "FAULT",
        error: "Segmentation fault: offset exceeds segment limit.",
        segment: segment.name,
        base: segment.base,
        limit: segment.limit,
        offset: parsedOffset,
      };
    }

    return {
      ok: true,
      status: "OK",
      segment: segment.name,
      base: segment.base,
      limit: segment.limit,
      offset: parsedOffset,
      physicalAddress: segment.base + parsedOffset,
    };
  }

  getTable() {
    return this.segments.map((segment) => ({ ...segment }));
  }
}

export function translateLogicalAddress({ segments, segmentName, offset }) {
  return new Segmentation(segments).translate(segmentName, offset);
}
