export type Rgb = {
  r: number;
  g: number;
  b: number;
};

export type WallBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WallDetection = {
  confidence: number;
  coverage: number;
  bounds: WallBounds;
  color: Rgb;
};

const COLS = 40;
const ROWS = 30;
const NEIGHBOR_DISTANCE = 40;
const MAX_CELL_VARIANCE = 700;
const MIN_COVERAGE = 0.36;
const MIN_FILL = 0.68;
const MIN_SPAN = 0.34;
const CENTER_OVERLAP = 0.42;

/**
 * Finds a large, similarly colored surface that occupies the middle of the
 * frame. Painted and lightly textured walls pass; busy scenes do not.
 */
export function detectWall(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): WallDetection | null {
  if (width < 16 || height < 16) return null;
  if (pixels.length < width * height * 4) return null;

  const count = COLS * ROWS;
  const rs = new Float32Array(count);
  const gs = new Float32Array(count);
  const bs = new Float32Array(count);
  const calm = new Uint8Array(count);

  for (let row = 0; row < ROWS; row++) {
    const y0 = Math.floor((row * height) / ROWS);
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * height) / ROWS));
    for (let col = 0; col < COLS; col++) {
      const x0 = Math.floor((col * width) / COLS);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * width) / COLS));
      const sample = sampleCell(pixels, width, height, x0, y0, x1, y1);
      const index = row * COLS + col;
      rs[index] = sample.r;
      gs[index] = sample.g;
      bs[index] = sample.b;
      calm[index] = sample.variance <= MAX_CELL_VARIANCE ? 1 : 0;
    }
  }

  const parent = new Int32Array(count);
  const rank = new Uint8Array(count);
  for (let index = 0; index < count; index++) parent[index] = index;

  const find = (start: number) => {
    let root = start;
    while (parent[root] !== root) root = parent[root];
    let node = start;
    while (parent[node] !== root) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  };

  const union = (a: number, b: number) => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) {
      const swap = ra;
      ra = rb;
      rb = swap;
    }
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra] += 1;
  };

  const limit = NEIGHBOR_DISTANCE * NEIGHBOR_DISTANCE;
  const close = (a: number, b: number) => {
    const dr = rs[a] - rs[b];
    const dg = gs[a] - gs[b];
    const db = bs[a] - bs[b];
    return dr * dr + dg * dg + db * db <= limit;
  };

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const index = row * COLS + col;
      if (!calm[index]) continue;
      if (col + 1 < COLS && calm[index + 1] && close(index, index + 1)) {
        union(index, index + 1);
      }
      if (row + 1 < ROWS && calm[index + COLS] && close(index, index + COLS)) {
        union(index, index + COLS);
      }
    }
  }

  const sizes = new Map<number, number>();
  for (let index = 0; index < count; index++) {
    if (!calm[index]) continue;
    const root = find(index);
    sizes.set(root, (sizes.get(root) ?? 0) + 1);
  }

  let wallRoot = -1;
  let wallCells = 0;
  for (const [root, size] of sizes) {
    if (size > wallCells) {
      wallRoot = root;
      wallCells = size;
    }
  }
  if (wallRoot < 0) return null;

  const col0 = Math.floor(COLS * 0.3);
  const col1 = Math.ceil(COLS * 0.7);
  const row0 = Math.floor(ROWS * 0.28);
  const row1 = Math.ceil(ROWS * 0.72);
  let centerCells = 0;
  let centerHits = 0;
  for (let row = row0; row < row1; row++) {
    for (let col = col0; col < col1; col++) {
      centerCells += 1;
      const index = row * COLS + col;
      if (calm[index] && find(index) === wallRoot) centerHits += 1;
    }
  }
  if (centerCells === 0 || centerHits / centerCells < CENTER_OVERLAP) return null;

  let minCol = COLS;
  let maxCol = 0;
  let minRow = ROWS;
  let maxRow = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const index = row * COLS + col;
      if (!calm[index] || find(index) !== wallRoot) continue;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
      sumR += rs[index];
      sumG += gs[index];
      sumB += bs[index];
    }
  }

  const coverage = wallCells / count;
  const spanW = maxCol - minCol + 1;
  const spanH = maxRow - minRow + 1;
  const fill = wallCells / (spanW * spanH);
  if (coverage < MIN_COVERAGE || fill < MIN_FILL) return null;
  if (spanW / COLS < MIN_SPAN || spanH / ROWS < MIN_SPAN) return null;

  return {
    confidence: Math.min(1, coverage * 0.62 + fill * 0.38),
    coverage,
    bounds: {
      x: minCol / COLS,
      y: minRow / ROWS,
      width: spanW / COLS,
      height: spanH / ROWS,
    },
    color: {
      r: Math.round(sumR / wallCells),
      g: Math.round(sumG / wallCells),
      b: Math.round(sumB / wallCells),
    },
  };
}

function sampleCell(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Rgb & { variance: number } {
  const xs = [x0, (x0 + x1) >> 1, x1 - 1];
  const ys = [y0, (y0 + y1) >> 1, y1 - 1];
  let r = 0;
  let g = 0;
  let b = 0;
  const lums: number[] = [];
  for (const rawY of ys) {
    const y = Math.min(height - 1, Math.max(0, rawY));
    for (const rawX of xs) {
      const x = Math.min(width - 1, Math.max(0, rawX));
      const index = (y * width + x) * 4;
      const pr = pixels[index];
      const pg = pixels[index + 1];
      const pb = pixels[index + 2];
      r += pr;
      g += pg;
      b += pb;
      lums.push(0.2126 * pr + 0.7152 * pg + 0.0722 * pb);
    }
  }
  const n = lums.length;
  const mean = lums.reduce((sum, value) => sum + value, 0) / n;
  const variance = lums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n;
  return { r: r / n, g: g / n, b: b / n, variance };
}
