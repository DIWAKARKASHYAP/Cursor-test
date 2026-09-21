export const TILES = [
  {
    id: "calacatta",
    name: "Calacatta",
    finish: "Polished marble",
    grout: "#d5cec2",
    swatch:
      "linear-gradient(128deg, #f7f4ee 0 36%, #b7b1a6 37%, #f7f4ee 44% 68%, #c4beb4 69%, #f4f1ea 76% 100%)",
  },
  {
    id: "subway",
    name: "Subway",
    finish: "Gloss ceramic",
    grout: "#cfc8be",
    swatch: "linear-gradient(145deg, #ffffff 0%, #f3f1ec 46%, #d5d0c8 100%)",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    finish: "Matte clay",
    grout: "#efe4d4",
    swatch: "linear-gradient(160deg, #e08a62 0%, #b85a38 100%)",
  },
  {
    id: "zellige",
    name: "Zellige",
    finish: "Handmade glaze",
    grout: "#f3efe6",
    swatch: "linear-gradient(150deg, #69b5a4 0%, #1f5c50 100%)",
  },
  {
    id: "slate",
    name: "Slate",
    finish: "Cleft stone",
    grout: "#1a1c1e",
    swatch: "linear-gradient(160deg, #6a7580 0%, #2a3138 100%)",
  },
  {
    id: "herringbone",
    name: "Herringbone",
    finish: "Brushed oak",
    grout: "#6e5644",
    swatch:
      "repeating-linear-gradient(45deg, #c4a27a 0 10px, #8d6b45 10px 20px)",
  },
  {
    id: "terrazzo",
    name: "Terrazzo",
    finish: "Speckled cement",
    grout: "#d9d2c6",
    swatch:
      "radial-gradient(circle at 20% 30%, #c4554a 0 5px, transparent 6px), radial-gradient(circle at 70% 40%, #2f5f88 0 6px, transparent 7px), radial-gradient(circle at 45% 75%, #d4a24a 0 4px, transparent 5px), #ece6dc",
  },
  {
    id: "encaustic",
    name: "Encaustic",
    finish: "Patterned cement",
    grout: "#cfc3a4",
    swatch:
      "conic-gradient(from 45deg, #1e3558 0 25%, #e6d5b0 0 50%, #1e3558 0 75%, #e6d5b0 0 100%)",
  },
] as const;

export type TileId = (typeof TILES)[number]["id"];

export function groutFor(id: TileId) {
  return TILES.find((tile) => tile.id === id)?.grout ?? "#d5cec2";
}

export function renderTileSprite(id: TileId, size = 192) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  painters[id](ctx, size);
  return canvas;
}

const painters: Record<TileId, (ctx: CanvasRenderingContext2D, size: number) => void> = {
  calacatta(ctx, size) {
    ctx.fillStyle = "#f6f3ec";
    ctx.fillRect(0, 0, size, size);
    vein(ctx, size, "#c9c3b8", 0.55, 8);
    vein(ctx, size, "#9d978c", 0.35, 21);
    gloss(ctx, size, 0.28);
  },
  subway(ctx, size) {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.45, "#f4f2ed");
    gradient.addColorStop(1, "#ddd8d0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, size - ctx.lineWidth * 2, size * 0.42);
    gloss(ctx, size, 0.4);
  },
  terracotta(ctx, size) {
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, "#e3926a");
    gradient.addColorStop(1, "#b25a39");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    specks(ctx, size, "#8a3e24", 0.35, 48, 4);
    specks(ctx, size, "#f0c2a4", 0.25, 17, 5);
  },
  zellige(ctx, size) {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#7ec4b2");
    gradient.addColorStop(0.55, "#2f7d6c");
    gradient.addColorStop(1, "#1c564b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = size * 0.03;
    ctx.strokeRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84);
    gloss(ctx, size, 0.45);
  },
  slate(ctx, size) {
    const gradient = ctx.createLinearGradient(0, 0, size, size * 0.4);
    gradient.addColorStop(0, "#7b868f");
    gradient.addColorStop(1, "#323940");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(20,22,24,0.55)";
    ctx.lineWidth = Math.max(1, size * 0.015);
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size * 0.35);
    ctx.lineTo(size * 0.9, size * 0.28);
    ctx.moveTo(size * 0.2, size * 0.72);
    ctx.lineTo(size * 0.85, size * 0.8);
    ctx.stroke();
  },
  herringbone(ctx, size) {
    ctx.fillStyle = "#7a5b40";
    ctx.fillRect(0, 0, size, size);
    const plank = size / 4;
    for (let row = -1; row < 6; row++) {
      for (let col = -1; col < 6; col++) {
        ctx.save();
        ctx.translate(col * plank + plank / 2, row * plank + plank / 2);
        ctx.rotate(((row + col) % 2 === 0 ? -45 : 45) * (Math.PI / 180));
        ctx.fillStyle = (row + col) % 2 === 0 ? "#c6a47c" : "#9a734c";
        ctx.fillRect(-plank * 0.72, -plank * 0.22, plank * 1.44, plank * 0.44);
        ctx.restore();
      }
    }
  },
  terrazzo(ctx, size) {
    ctx.fillStyle = "#efeae2";
    ctx.fillRect(0, 0, size, size);
    const chips: Array<[string, number]> = [
      ["#c4554a", 11],
      ["#2f5f88", 7],
      ["#d4a24a", 13],
      ["#243028", 19],
      ["#8d8f86", 3],
    ];
    const random = mulberry32(42);
    for (const [color, seed] of chips) {
      ctx.fillStyle = color;
      for (let i = 0; i < 8; i++) {
        const x = random() * size;
        const y = random() * size;
        const radius = size * (0.03 + random() * 0.045);
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * (0.6 + random() * 0.5), seed + i, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  encaustic(ctx, size) {
    ctx.fillStyle = "#e7d7b1";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#1e3558";
    ctx.beginPath();
    ctx.moveTo(size / 2, size * 0.12);
    ctx.lineTo(size * 0.88, size / 2);
    ctx.lineTo(size / 2, size * 0.88);
    ctx.lineTo(size * 0.12, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e7d7b1";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8c3d32";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  },
};

function vein(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  alpha: number,
  seed: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.018);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, size * (0.2 + (seed % 5) * 0.05));
  ctx.bezierCurveTo(
    size * 0.3,
    size * 0.15,
    size * 0.45,
    size * 0.7,
    size * 1.05,
    size * (0.35 + (seed % 3) * 0.08),
  );
  ctx.stroke();
  ctx.restore();
}

function gloss(ctx: CanvasRenderingContext2D, size: number, alpha: number) {
  const sheen = ctx.createLinearGradient(0, 0, size * 0.8, size);
  sheen.addColorStop(0, `rgba(255,255,255,${alpha})`);
  sheen.addColorStop(0.45, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);
}

function specks(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  alpha: number,
  count: number,
  seed: number,
) {
  const random = mulberry32(seed);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const radius = size * (0.008 + random() * 0.02);
    ctx.beginPath();
    ctx.arc(random() * size, random() * size, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function paintSampleWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const plaster = ctx.createLinearGradient(0, 0, 0, height);
  plaster.addColorStop(0, "#cbb892");
  plaster.addColorStop(1, "#e4d2b2");
  ctx.fillStyle = plaster;
  ctx.fillRect(0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const noise = ((Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0) % 11 - 5;
      const index = (y * width + x) * 4;
      data[index] = clampByte(data[index] + noise);
      data[index + 1] = clampByte(data[index + 1] + noise);
      data[index + 2] = clampByte(data[index + 2] + noise);
    }
  }
  ctx.putImageData(image, 0, 0);

  const shade = ctx.createLinearGradient(0, 0, width * 0.16, 0);
  shade.addColorStop(0, "rgba(48, 36, 24, 0.22)");
  shade.addColorStop(1, "rgba(48, 36, 24, 0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width * 0.16, height * 0.9);

  ctx.fillStyle = "#4a3d34";
  ctx.fillRect(0, height * 0.9, width, height * 0.1);
  ctx.fillStyle = "#6a5848";
  ctx.fillRect(0, height * 0.9, width, Math.max(3, height * 0.012));
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, value));
}
