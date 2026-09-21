"use client";

import { useEffect, useRef, useState } from "react";
import { detectWall, type WallBounds, type WallDetection } from "@/lib/wall-detect";
import {
  coverSourceRect,
  screenToWall,
  smoothBounds,
  snapToCell,
  wallToScreen,
  type Plane,
  type ScreenPoint,
} from "@/lib/wall-plane";
import {
  TILES,
  groutFor,
  paintSampleWall,
  renderTileSprite,
  type TileId,
} from "@/lib/tiles";

const LOCK_HITS = 6;
const UNLOCK_MISSES = 14;

type Phase = "intro" | "live" | "error";
type Facing = "environment" | "user";

type World = {
  locked: boolean;
  hits: number;
  misses: number;
  bounds: WallBounds | null;
  rows: number;
};

const emptyWorld = (): World => ({
  locked: false,
  hits: 0,
  misses: 0,
  bounds: null,
  rows: 8,
});

export function ArStudio() {
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const analysisRef = useRef<HTMLCanvasElement | null>(null);
  const spritesRef = useRef<Map<TileId, HTMLCanvasElement>>(new Map());
  const placementsRef = useRef<Map<string, TileId>>(new Map());
  const worldRef = useRef<World>(emptyWorld());
  const selectedRef = useRef<TileId | null>(null);
  const colsRef = useRef(8);
  const groutRef = useRef(0.08);
  const insetRef = useRef(0.08);
  const usingSampleRef = useRef(false);
  const facingRef = useRef<Facing>("environment");
  const paintingRef = useRef(false);
  const frameRef = useRef(0);
  const requestRef = useRef(0);
  const drawRef = useRef<() => void>(() => {});
  const stopStreamRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<Phase>("intro");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);
  const [wallReady, setWallReady] = useState(false);
  const [canSwitch, setCanSwitch] = useState(false);
  const [selectedTile, setSelectedTile] = useState<TileId | null>(null);
  const [placementCount, setPlacementCount] = useState(0);
  const [cols, setCols] = useState(8);
  const [grout, setGrout] = useState(0.08);
  const [inset, setInset] = useState(0.08);
  const [hint, setHint] = useState<string | null>(null);

  selectedRef.current = selectedTile;
  colsRef.current = cols;
  groutRef.current = grout;
  insetRef.current = inset;
  usingSampleRef.current = usingSample;

  stopStreamRef.current = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    return () => stopStreamRef.current();
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    let frame = 0;
    const loop = () => {
      drawRef.current();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  drawRef.current = () => {
    const stage = stageRef.current;
    const overlay = overlayRef.current;
    if (!stage || !overlay || phase !== "live") return;

    const cssW = stage.clientWidth;
    const cssH = stage.clientHeight;
    if (cssW < 2 || cssH < 2) return;

    const view = fitCanvas(overlay, cssW, cssH);
    const overlayCtx = overlay.getContext("2d");
    if (!overlayCtx) return;

    const source = usingSampleRef.current ? ensureSample() : videoRef.current;
    if (!source) return;
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    const ready = source instanceof HTMLVideoElement ? source.readyState >= 2 : srcW > 0;
    if (!ready || srcW < 2 || srcH < 2) return;

    const crop = coverSourceRect(srcW, srcH, view.w, view.h);

    if (usingSampleRef.current && plateRef.current) {
      const plate = plateRef.current;
      fitCanvas(plate, cssW, cssH);
      const plateCtx = plate.getContext("2d");
      plateCtx?.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, plate.width, plate.height);
    }

    frameRef.current += 1;
    if (frameRef.current % 3 === 0) {
      const analysis = ensureAnalysis();
      const analysisCtx = analysis.getContext("2d", { willReadFrequently: true });
      if (analysisCtx) {
        analysisCtx.drawImage(
          source,
          crop.x,
          crop.y,
          crop.w,
          crop.h,
          0,
          0,
          analysis.width,
          analysis.height,
        );
        const image = analysisCtx.getImageData(0, 0, analysis.width, analysis.height);
        applyDetection(detectWall(image.data, analysis.width, analysis.height), cssW, cssH);
      }
    }

    overlayCtx.clearRect(0, 0, view.w, view.h);
    const world = worldRef.current;
    if (!world.bounds) return;
    const plane: Plane = { ...world.bounds, topInset: insetRef.current };
    paintOverlay(overlayCtx, plane, view.w, view.h, world);
  };

  function ensureSample() {
    if (sampleRef.current) return sampleRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");
    if (ctx) paintSampleWall(ctx, canvas.width, canvas.height);
    sampleRef.current = canvas;
    return canvas;
  }

  function ensureAnalysis() {
    if (!analysisRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      analysisRef.current = canvas;
    }
    return analysisRef.current;
  }

  function spriteFor(id: TileId) {
    const cached = spritesRef.current.get(id);
    if (cached) return cached;
    const sprite = renderTileSprite(id);
    spritesRef.current.set(id, sprite);
    return sprite;
  }

  function applyDetection(detected: WallDetection | null, viewW: number, viewH: number) {
    const world = worldRef.current;
    if (detected) {
      world.hits += 1;
      world.misses = 0;
      world.bounds = smoothBounds(world.bounds, detected.bounds);
      if (!world.locked && world.hits >= LOCK_HITS) {
        world.locked = true;
        world.rows = rowsFor(world.bounds, viewW, viewH, colsRef.current);
        setWallReady(true);
        setHint(null);
      }
      return;
    }

    world.hits = Math.max(0, world.hits - 2);
    if (!world.locked) {
      if (world.hits === 0) world.bounds = null;
      return;
    }
    world.misses += 1;
    if (world.misses >= UNLOCK_MISSES) {
      world.locked = false;
      world.bounds = null;
      setWallReady(false);
    }
  }

  function paintOverlay(
    ctx: CanvasRenderingContext2D,
    plane: Plane,
    width: number,
    height: number,
    world: World,
  ) {
    const corners = quad(plane, 0, 0, 1, 1);
    dimOutside(ctx, corners, width, height);

    ctx.save();
    ctx.lineWidth = world.locked ? 3 : 2;
    ctx.strokeStyle = world.locked ? "rgba(230, 211, 177, 0.95)" : "rgba(230, 211, 177, 0.7)";
    ctx.setLineDash(world.locked ? [] : [12, 8]);
    trace(ctx, corners, width, height);
    ctx.stroke();
    ctx.restore();

    if (!world.locked) return;

    const columns = colsRef.current;
    const rows = world.rows;
    ctx.save();
    ctx.strokeStyle = "rgba(246, 241, 231, 0.28)";
    ctx.lineWidth = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        trace(ctx, cellQuad(plane, col, row, columns, rows, 0), width, height);
        ctx.stroke();
      }
    }
    ctx.restore();

    const shrink = groutRef.current / 2;
    for (const [key, tileId] of placementsRef.current) {
      const [col, row] = key.split(",").map(Number);
      if (col >= columns || row >= rows) continue;
      const cell = cellQuad(plane, col, row, columns, rows, 0);
      const tile = cellQuad(plane, col, row, columns, rows, shrink);
      ctx.save();
      ctx.fillStyle = groutFor(tileId);
      trace(ctx, cell, width, height);
      ctx.fill();
      trace(ctx, tile, width, height);
      ctx.clip();
      const box = boundsOf(tile, width, height);
      ctx.drawImage(spriteFor(tileId), box.x, box.y, box.w, box.h);
      ctx.restore();
    }
  }

  function placeAt(clientX: number, clientY: number) {
    const overlay = overlayRef.current;
    const world = worldRef.current;
    if (!overlay || !world.locked || !world.bounds) return;
    const tile = selectedRef.current;
    if (!tile) {
      setHint("Choose a tile first.");
      return;
    }
    const rect = overlay.getBoundingClientRect();
    const point = screenToWall(
      (clientX - rect.left) / rect.width,
      (clientY - rect.top) / rect.height,
      { ...world.bounds, topInset: insetRef.current },
    );
    if (!point) return;
    const { col, row } = snapToCell(point.u, point.v, colsRef.current, world.rows);
    const key = `${col},${row}`;
    if (placementsRef.current.get(key) === tile) return;
    placementsRef.current.set(key, tile);
    setPlacementCount(placementsRef.current.size);
    setHint(null);
  }

  function coverWall() {
    const tile = selectedRef.current;
    const world = worldRef.current;
    if (!tile || !world.locked) {
      setHint("Choose a tile first.");
      return;
    }
    for (let row = 0; row < world.rows; row++) {
      for (let col = 0; col < colsRef.current; col++) {
        placementsRef.current.set(`${col},${row}`, tile);
      }
    }
    setPlacementCount(placementsRef.current.size);
    setHint(null);
  }

  function clearTiles() {
    placementsRef.current.clear();
    setPlacementCount(0);
  }

  function updateCols(value: number) {
    setCols(value);
    colsRef.current = value;
    const world = worldRef.current;
    const stage = stageRef.current;
    if (world.locked && world.bounds && stage) {
      world.rows = rowsFor(world.bounds, stage.clientWidth, stage.clientHeight, value);
    }
    const hadTiles = placementsRef.current.size > 0;
    placementsRef.current.clear();
    setPlacementCount(0);
    if (hadTiles) setHint("Size changed, so the placed tiles were cleared.");
  }

  async function openCamera() {
    const request = ++requestRef.current;
    setBusy(true);
    setError(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("The camera needs a secure page. Open this app on localhost or https.");
      setPhase("error");
      setBusy(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingRef.current },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      stopStreamRef.current();
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      if (request !== requestRef.current) {
        stopStreamRef.current();
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCanSwitch(devices.filter((device) => device.kind === "videoinput").length > 1);
      resetTracking();
      setUsingSample(false);
      setPhase("live");
    } catch (caught) {
      if (request !== requestRef.current) return;
      setError(cameraErrorMessage(caught));
      setPhase("error");
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  }

  function openSample() {
    requestRef.current += 1;
    stopStreamRef.current();
    ensureSample();
    resetTracking();
    setError(null);
    setBusy(false);
    setCanSwitch(false);
    setUsingSample(true);
    setPhase("live");
  }

  function switchCamera() {
    facingRef.current = facingRef.current === "environment" ? "user" : "environment";
    void openCamera();
  }

  function closeSession() {
    requestRef.current += 1;
    stopStreamRef.current();
    resetTracking();
    setUsingSample(false);
    setCanSwitch(false);
    setSelectedTile(null);
    setHint(null);
    setError(null);
    setPhase("intro");
  }

  function resetTracking() {
    worldRef.current = emptyWorld();
    placementsRef.current.clear();
    frameRef.current = 0;
    setWallReady(false);
    setPlacementCount(0);
  }

  const showCamera = phase === "live" && !usingSample;
  const status = wallReady
    ? "Wall in view. Choose a tile and tap the surface."
    : usingSample
      ? "Looking at the sample wall."
      : "Point the camera at a plain, well-lit wall.";

  return (
    <div className="ar-root relative h-dvh overflow-hidden bg-[#141816] text-[#f6f1e7]">
      <div ref={stageRef} className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${showCamera ? "" : "opacity-0"}`}
          autoPlay
          playsInline
          muted
          aria-hidden="true"
        />
        <canvas
          ref={plateRef}
          className={`absolute inset-0 h-full w-full ${phase === "live" && usingSample ? "" : "hidden"}`}
          aria-hidden="true"
        />
        <canvas
          ref={overlayRef}
          className={`absolute inset-0 h-full w-full touch-none ${phase === "live" ? "" : "hidden"} ${wallReady ? "cursor-crosshair" : ""}`}
          aria-hidden="true"
          onPointerDown={(event) => {
            paintingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            placeAt(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (!paintingRef.current) return;
            placeAt(event.clientX, event.clientY);
          }}
          onPointerUp={() => {
            paintingRef.current = false;
          }}
          onPointerCancel={() => {
            paintingRef.current = false;
          }}
        />

        {phase === "live" && !wallReady ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="scan-line absolute inset-x-[12%] h-px bg-[#e6d3b1]/80 shadow-[0_0_18px_rgba(230,211,177,0.8)]" />
            <div className="absolute top-[18%] left-[12%] h-10 w-10 border-t-2 border-l-2 border-[#e6d3b1]" />
            <div className="absolute top-[18%] right-[12%] h-10 w-10 border-t-2 border-r-2 border-[#e6d3b1]" />
            <div className="absolute bottom-[22%] left-[12%] h-10 w-10 border-b-2 border-l-2 border-[#e6d3b1]" />
            <div className="absolute right-[12%] bottom-[22%] h-10 w-10 border-r-2 border-b-2 border-[#e6d3b1]" />
          </div>
        ) : null}
      </div>

      {phase === "live" ? (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={closeSession}
              className="pointer-events-auto justify-self-start rounded-full border border-white/15 bg-black/45 px-3 py-2 text-sm backdrop-blur-md"
            >
              Close
            </button>
            <p className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-center text-sm backdrop-blur-md">
              {wallReady ? "Wall found" : "Looking for a wall"}
            </p>
            {canSwitch ? (
              <button
                type="button"
                onClick={switchCamera}
                className="pointer-events-auto justify-self-end rounded-full border border-white/15 bg-black/45 px-3 py-2 text-sm backdrop-blur-md"
              >
                Flip
              </button>
            ) : (
              <span />
            )}
          </header>

          <p className="sr-only" role="status">
            {status}
          </p>

          {!wallReady ? (
            <p className="pointer-events-none absolute inset-x-6 bottom-10 z-10 text-center text-sm text-[#f6f1e7] drop-shadow">
              {usingSample
                ? "Hold on the plaster until the wall locks in."
                : "Fill the frame with a plain wall. Tile choices appear when it locks in."}
            </p>
          ) : (
            <section className="tile-tray absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#121614]/90 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#f6f1e7]/90">
                  {hint
                    ? hint
                    : placementCount === 0
                      ? "Tap or drag on the wall to place tiles."
                      : `${placementCount} ${placementCount === 1 ? "tile" : "tiles"} on the wall`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={coverWall}
                    disabled={!selectedTile}
                    className="rounded-full bg-[#e6d3b1] px-3 py-2 text-sm font-semibold text-[#1c1712] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cover wall
                  </button>
                  <button
                    type="button"
                    onClick={clearTiles}
                    disabled={placementCount === 0}
                    className="rounded-full border border-white/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {TILES.map((tile) => {
                  const selected = selectedTile === tile.id;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedTile(tile.id);
                        setHint(null);
                      }}
                      className={`w-[5.5rem] shrink-0 rounded-2xl border p-2 text-left ${
                        selected
                          ? "border-[#e6d3b1] bg-white/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span
                        className="block h-14 rounded-xl"
                        style={{ background: tile.swatch }}
                        aria-hidden="true"
                      />
                      <span className="mt-2 block text-sm font-medium">{tile.name}</span>
                      <span className="block text-[11px] text-[#f6f1e7]/60">{tile.finish}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <Slider
                  label="Size"
                  min={5}
                  max={12}
                  step={1}
                  value={cols}
                  onChange={updateCols}
                  display={`${cols} across`}
                />
                <Slider
                  label="Grout"
                  min={0.02}
                  max={0.16}
                  step={0.01}
                  value={grout}
                  onChange={setGrout}
                  display={grout < 0.06 ? "Fine" : grout < 0.11 ? "Medium" : "Wide"}
                />
                <Slider
                  label="Angle"
                  min={0}
                  max={0.2}
                  step={0.01}
                  value={inset}
                  onChange={setInset}
                  display={inset < 0.04 ? "Flat" : "Perspective"}
                />
              </div>
            </section>
          )}
        </>
      ) : (
        <Intro
          busy={busy}
          error={phase === "error" ? error : null}
          onCamera={() => void openCamera()}
          onSample={openSample}
        />
      )}
    </div>
  );
}

function Intro({
  busy,
  error,
  onCamera,
  onSample,
}: {
  busy: boolean;
  error: string | null;
  onCamera: () => void;
  onSample: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-[#141816]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] [perspective:700px]" aria-hidden="true">
        <div className="absolute inset-0 origin-bottom opacity-70 [transform:rotateX(62deg)] bg-[linear-gradient(rgba(230,211,177,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(230,211,177,0.18)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="relative flex flex-1 flex-col justify-between px-6 py-8 sm:px-10">
        <p className="font-[family-name:var(--font-syne)] text-sm font-semibold tracking-[0.28em] text-[#e6d3b1]">
          AR
        </p>

        <div className="max-w-xl">
          <h1 className="font-[family-name:var(--font-syne)] text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
            Point at a wall. Place the tile.
          </h1>
          <p className="mt-4 max-w-md text-base text-[#f6f1e7]/75 sm:text-lg">
            Allow the camera, aim it at a plain wall, then pick a material. Tiles stay on that surface while you look around.
          </p>

          <ol className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ["1", "Allow the camera"],
              ["2", "Point it at a wall"],
              ["3", "Tap to place tiles"],
            ].map(([step, label]) => (
              <li key={step} className="flex items-center gap-3 border-t border-white/15 pt-3">
                <span className="font-[family-name:var(--font-syne)] text-[#e6d3b1]">{step}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>

          {error ? (
            <p className="mt-6 rounded-2xl border border-[#e7b08a]/40 bg-[#3a241c]/80 px-4 py-3 text-sm text-[#f6d7c4]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCamera}
              disabled={busy}
              className="rounded-full bg-[#e6d3b1] px-6 py-3 text-sm font-semibold text-[#1c1712] disabled:opacity-60"
            >
              {busy ? "Waiting for the camera…" : error ? "Try the camera again" : "Allow camera"}
            </button>
            <button
              type="button"
              onClick={onSample}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold"
            >
              Preview a sample wall
            </button>
          </div>
        </div>

        <p className="text-xs text-[#f6f1e7]/45">
          Works best on a matte, evenly lit wall. The back camera is used when the phone has one.
        </p>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-[#f6f1e7]/70">
        <span>{label}</span>
        <span>{display}</span>
      </span>
      <input
        className="mt-1 w-full accent-[#e6d3b1]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function fitCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h };
}

function rowsFor(bounds: WallBounds, viewW: number, viewH: number, cols: number) {
  const pixelW = Math.max(1, bounds.width * viewW);
  const pixelH = Math.max(1, bounds.height * viewH);
  return Math.max(4, Math.min(24, Math.round(pixelH / (pixelW / cols))));
}

function quad(plane: Plane, u0: number, v0: number, u1: number, v1: number) {
  return [
    wallToScreen(u0, v0, plane),
    wallToScreen(u1, v0, plane),
    wallToScreen(u1, v1, plane),
    wallToScreen(u0, v1, plane),
  ] as const;
}

function cellQuad(
  plane: Plane,
  col: number,
  row: number,
  cols: number,
  rows: number,
  shrink: number,
) {
  return quad(
    plane,
    (col + shrink) / cols,
    (row + shrink) / rows,
    (col + 1 - shrink) / cols,
    (row + 1 - shrink) / rows,
  );
}

function trace(
  ctx: CanvasRenderingContext2D,
  points: readonly ScreenPoint[],
  width: number,
  height: number,
) {
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = point.x * width;
    const y = point.y * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function boundsOf(points: readonly ScreenPoint[], width: number, height: number) {
  const xs = points.map((point) => point.x * width);
  const ys = points.map((point) => point.y * height);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    w: Math.max(1, Math.max(...xs) - x),
    h: Math.max(1, Math.max(...ys) - y),
  };
}

function dimOutside(
  ctx: CanvasRenderingContext2D,
  corners: readonly ScreenPoint[],
  width: number,
  height: number,
) {
  ctx.save();
  ctx.fillStyle = "rgba(6, 8, 7, 0.38)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "destination-out";
  trace(ctx, corners, width, height);
  ctx.fill();
  ctx.restore();
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Camera access was blocked. Allow the camera for this site, then try again.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No camera was found on this device.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The camera is already in use by another app.";
    }
  }
  return "The camera could not be opened.";
}
