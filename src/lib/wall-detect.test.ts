import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectWall } from "./wall-detect.ts";

function paint(
  width: number,
  height: number,
  colorAt: (x: number, y: number) => [number, number, number],
) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt(x, y);
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
  return data;
}

function unit(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

describe("detectWall", () => {
  it("accepts a plain wall with a light gradient and a baseboard", () => {
    const width = 160;
    const height = 120;
    const image = paint(width, height, (x, y) => {
      if (y > height * 0.88) return [58, 46, 38];
      const shade = x < width * 0.12 ? 18 : 0;
      const noise = Math.round((unit(x, y) - 0.5) * 10);
      const lift = Math.round((y / height) * 36);
      return [
        196 + lift + noise - shade,
        176 + lift + noise - shade,
        148 + noise - shade,
      ];
    });

    const wall = detectWall(image, width, height);
    assert.ok(wall);
    assert.ok(wall.confidence > 0.55);
    assert.ok(wall.bounds.height < 0.95);
    assert.ok(wall.bounds.width > 0.7);
    assert.ok(wall.color.r > wall.color.b);
  });

  it("keeps a wall that has a small frame near the middle", () => {
    const width = 160;
    const height = 120;
    const image = paint(width, height, (x, y) => {
      const inFrame =
        x > width * 0.38 &&
        x < width * 0.62 &&
        y > height * 0.3 &&
        y < height * 0.58;
      if (inFrame) return [40, 48, 64];
      return [214, 196, 168];
    });

    const wall = detectWall(image, width, height);
    assert.ok(wall);
    assert.ok(wall.coverage > 0.7);
  });

  it("rejects a checkerboard", () => {
    const image = paint(120, 90, (x, y) => {
      const on = (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0;
      return on ? [240, 240, 240] : [20, 20, 20];
    });
    assert.equal(detectWall(image, 120, 90), null);
  });

  it("rejects a busy random scene", () => {
    const image = paint(120, 90, (x, y) => {
      const n = unit(x, y);
      return [Math.round(n * 255), Math.round(unit(y, x) * 255), Math.round(unit(x + y, x) * 255)];
    });
    assert.equal(detectWall(image, 120, 90), null);
  });

  it("rejects a wall that does not fill the view", () => {
    const width = 160;
    const height = 120;
    const image = paint(width, height, (x, y) => {
      const patch =
        x > width * 0.4 && x < width * 0.6 && y > height * 0.4 && y < height * 0.6;
      if (patch) return [210, 190, 160];
      return [
        Math.round(unit(x, y) * 255),
        Math.round(unit(y + 3, x) * 255),
        Math.round(unit(x + 9, y + 2) * 255),
      ];
    });
    assert.equal(detectWall(image, width, height), null);
  });
});
