import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coverSourceRect,
  screenToWall,
  snapToCell,
  wallToScreen,
} from "./wall-plane.ts";

const plane = {
  x: 0.1,
  y: 0.2,
  width: 0.8,
  height: 0.6,
  topInset: 0.1,
};

describe("wall plane", () => {
  it("narrows the top edge and keeps the bottom edge full width", () => {
    const topLeft = wallToScreen(0, 0, plane);
    const topRight = wallToScreen(1, 0, plane);
    const bottomLeft = wallToScreen(0, 1, plane);
    const bottomRight = wallToScreen(1, 1, plane);

    assert.ok(topRight.x - topLeft.x < bottomRight.x - bottomLeft.x);
    assert.equal(bottomLeft.x, plane.x);
    assert.equal(bottomRight.x, plane.x + plane.width);
    assert.equal(topLeft.y, plane.y);
    assert.equal(bottomLeft.y, plane.y + plane.height);
  });

  it("round-trips points on the plane", () => {
    for (const u of [0, 0.25, 0.5, 1]) {
      for (const v of [0, 0.4, 1]) {
        const point = wallToScreen(u, v, plane);
        const back = screenToWall(point.x, point.y, plane);
        assert.ok(back);
        assert.ok(Math.abs(back.u - u) < 1e-6);
        assert.ok(Math.abs(back.v - v) < 1e-6);
      }
    }
  });

  it("ignores taps outside the wall", () => {
    assert.equal(screenToWall(0.01, 0.5, plane), null);
    assert.equal(screenToWall(0.5, 0.05, plane), null);
  });

  it("snaps a tap to a grid cell", () => {
    assert.deepEqual(snapToCell(0.05, 0.99, 10, 8), { col: 0, row: 7 });
    assert.deepEqual(snapToCell(0.99, 0, 10, 8), { col: 9, row: 0 });
  });

  it("crops a wide camera frame to the view", () => {
    const crop = coverSourceRect(1600, 900, 400, 800);
    assert.ok(crop.w < 1600);
    assert.equal(crop.h, 900);
    assert.ok(crop.x > 0);
  });
});
