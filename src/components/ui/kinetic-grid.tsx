"use client";

import { useEffect, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  born: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_SIZE = 60; // Clean, proportional grid size
const INFLUENCE_RADIUS = 180; // Focused, local cursor influence
const MAX_WARP = 10; // Gentle, smooth elastic flex (no ugly pinch/distortion)
const DOT_SPACING = 30;
const LERP_SPEED = 0.12;

const LINE_BASE_DARK = { r: 255, g: 255, b: 255, a: 0.08 };
const LINE_BASE_LIGHT = { r: 0, g: 0, b: 0, a: 0.06 };
const NODE_BASE_RADIUS = 1.4;
const NODE_ACTIVE_RADIUS = 2.8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(
  base: { r: number; g: number; b: number; a: number },
  active: { r: number; g: number; b: number; a: number },
  t: number,
): string {
  const r = Math.round(lerpN(base.r, active.r, t));
  const g = Math.round(lerpN(base.g, active.g, t));
  const b = Math.round(lerpN(base.b, active.b, t));
  const a = lerpN(base.a, active.a, t);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KineticGrid({
  children,
  className,
  globalColor = "default",
  themeMode = "dark",
}: {
  children?: ReactNode;
  className?: string;
  globalColor?: "default" | "monochrome";
  themeMode?: "dark" | "light";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const targetMouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef<{ w: number; h: number; dpr: number }>({ w: 0, h: 0, dpr: 1 });
  const isRunningRef = useRef<boolean>(false);

  // ── Warp ────────────────────────────────────────────────────────────────────

  const getWarpedPoint = useCallback(
    (
      gx: number,
      gy: number,
      col: number,
      row: number,
      mouse: Point,
      ripples: Ripple[],
      cols: number,
      rows: number,
    ): { pt: Point; proximity: number } => {
      // Edge pin — locks boundary rows/cols in place
      const edgeMargin = 1.5;
      const colPin = Math.min(
        col / edgeMargin,
        (cols - 1 - col) / edgeMargin,
        1,
      );
      const rowPin = Math.min(
        row / edgeMargin,
        (rows - 1 - row) / edgeMargin,
        1,
      );
      const pinFactor = colPin * colPin * rowPin * rowPin;

      const dx = gx - mouse.x;
      const dy = gy - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS) * pinFactor;

      // Ripple displacement
      let rx = 0;
      let ry = 0;
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const rdx = gx - r.x;
        const rdy = gy - r.y;
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        const waveWidth = 45;
        const diff = rdist - r.radius;
        if (Math.abs(diff) < waveWidth) {
          const strength =
            (1 - Math.abs(diff) / waveWidth) * r.opacity * 12 * pinFactor;
          const angle = Math.atan2(rdy, rdx);
          const sign = diff < 0 ? -1 : 1;
          rx += Math.cos(angle) * strength * sign * -1;
          ry += Math.sin(angle) * strength * sign * -1;
        }
      }

      // Cursor warp with smooth cubic falloff (avoids pinched spiderwebs)
      if (dist < INFLUENCE_RADIUS && dist > 0 && pinFactor > 0) {
        const t = dist / INFLUENCE_RADIUS;
        const eased = Math.pow(1 - t, 2.5);
        const warpAmt = eased * MAX_WARP * pinFactor;
        const angle = Math.atan2(dy, dx);
        return {
          pt: {
            x: gx - Math.cos(angle) * warpAmt + rx,
            y: gy - Math.sin(angle) * warpAmt + ry,
          },
          proximity,
        };
      }

      return { pt: { x: gx + rx, y: gy + ry }, proximity };
    },
    [],
  );

  // ── Draw ────────────────────────────────────────────────────────────────────

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w: W, h: H, dpr } = sizeRef.current;
      const mouse = mouseRef.current;
      const ripples = ripplesRef.current;
      const isLight = themeMode === "light";

      const theme = {
        default: {
          bg: isLight ? "#ffffff" : "#000000",
          lineActive: { r: 29, g: 155, b: 240, a: 0.9 },
          nodeActive: { r: 29, g: 155, b: 240, a: 1.0 },
          glow: "29,155,240",
          ripple: "29,155,240",
        },
        monochrome: {
          bg: isLight ? "#ffffff" : "#000000",
          lineActive: isLight
            ? { r: 0, g: 0, b: 0, a: 0.85 }
            : { r: 255, g: 255, b: 255, a: 0.85 },
          nodeActive: isLight
            ? { r: 0, g: 0, b: 0, a: 1.0 }
            : { r: 255, g: 255, b: 255, a: 1.0 },
          glow: isLight ? "0,0,0" : "255,255,255",
          ripple: isLight ? "0,0,0" : "255,255,255",
        },
      }[globalColor ?? "default"];

      const lineBase = isLight ? LINE_BASE_LIGHT : LINE_BASE_DARK;

      ctx.save();
      // Razor-sharp scaling on Retina / 4K / High-DPI screens
      ctx.scale(dpr, dpr);

      // Clean background fill
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // ── Batched Static Background Dot Texture ──
      ctx.fillStyle = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
      ctx.beginPath();
      for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING) {
        for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING) {
          ctx.rect(Math.round(x) - 0.5, Math.round(y) - 0.5, 1, 1);
        }
      }
      ctx.fill();

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = (now - r.born) / 1000;
        r.radius = Math.max(0, age * 360);
        r.opacity = Math.max(0, 1 - age * 1.4);
        if (r.opacity <= 0) ripples.splice(i, 1);
      }

      // ── Build Grid Vertices ──
      const cols = Math.max(2, Math.ceil(W / CELL_SIZE)) + 1;
      const rows = Math.max(2, Math.ceil(H / CELL_SIZE)) + 1;
      const cellW = W / (cols - 1);
      const cellH = H / (rows - 1);

      const pts: Point[][] = [];
      const prox: number[][] = [];

      for (let row = 0; row < rows; row++) {
        pts[row] = [];
        prox[row] = [];
        for (let col = 0; col < cols; col++) {
          const { pt, proximity } = getWarpedPoint(
            col * cellW,
            row * cellH,
            col,
            row,
            mouse,
            ripples,
            cols,
            rows,
          );
          pts[row][col] = pt;
          prox[row][col] = proximity;
        }
      }

      // ── Batched Grid Lines (Ultra-fast, zero lag) ──
      // Pass 1: Draw all base lines in one single path call
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${lineBase.r},${lineBase.g},${lineBase.b},${lineBase.a})`;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols - 1; col++) {
          const pr1 = prox[row][col];
          const pr2 = prox[row][col + 1];
          if (pr1 === 0 && pr2 === 0) {
            ctx.moveTo(pts[row][col].x, pts[row][col].y);
            ctx.lineTo(pts[row][col + 1].x, pts[row][col + 1].y);
          }
        }
      }

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows - 1; row++) {
          const pr1 = prox[row][col];
          const pr2 = prox[row + 1][col];
          if (pr1 === 0 && pr2 === 0) {
            ctx.moveTo(pts[row][col].x, pts[row][col].y);
            ctx.lineTo(pts[row + 1][col].x, pts[row + 1][col].y);
          }
        }
      }
      ctx.stroke();

      // Pass 2: Draw only active (illuminated) lines
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols - 1; col++) {
          const pr1 = prox[row][col];
          const pr2 = prox[row][col + 1];
          if (pr1 > 0 || pr2 > 0) {
            const avg = (pr1 + pr2) / 2;
            const t = avg * avg * (3 - 2 * avg);
            ctx.beginPath();
            ctx.moveTo(pts[row][col].x, pts[row][col].y);
            ctx.lineTo(pts[row][col + 1].x, pts[row][col + 1].y);
            ctx.strokeStyle = lerpColor(lineBase, theme.lineActive, t);
            ctx.lineWidth = lerpN(1, 1.8, t);
            ctx.stroke();
          }
        }
      }

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows - 1; row++) {
          const pr1 = prox[row][col];
          const pr2 = prox[row + 1][col];
          if (pr1 > 0 || pr2 > 0) {
            const avg = (pr1 + pr2) / 2;
            const t = avg * avg * (3 - 2 * avg);
            ctx.beginPath();
            ctx.moveTo(pts[row][col].x, pts[row][col].y);
            ctx.lineTo(pts[row + 1][col].x, pts[row + 1][col].y);
            ctx.strokeStyle = lerpColor(lineBase, theme.lineActive, t);
            ctx.lineWidth = lerpN(1, 1.8, t);
            ctx.stroke();
          }
        }
      }

      // ── Batched Intersection Nodes ──
      // Inactive nodes: drawn together in one path
      ctx.beginPath();
      ctx.fillStyle = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)";
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (prox[row][col] === 0) {
            const p = pts[row][col];
            ctx.rect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
          }
        }
      }
      ctx.fill();

      // Active nodes near cursor: with soft glow
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const pr = prox[row][col];
          if (pr > 0) {
            const p = pts[row][col];
            const t = pr * pr * (3 - 2 * pr);
            const r = lerpN(NODE_BASE_RADIUS, NODE_ACTIVE_RADIUS, t);

            if (t > 0.25) {
              const glowR = r + lerpN(0, 5, (t - 0.25) / 0.75);
              const grd = ctx.createRadialGradient(
                p.x,
                p.y,
                r * 0.5,
                p.x,
                p.y,
                glowR,
              );
              grd.addColorStop(0, `rgba(${theme.glow},${(t * 0.35).toFixed(3)})`);
              grd.addColorStop(1, `rgba(${theme.glow},0)`);
              ctx.beginPath();
              ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
              ctx.fillStyle = grd;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = lerpColor(
              isLight ? { r: 0, g: 0, b: 0, a: 0.15 } : { r: 255, g: 255, b: 255, a: 0.2 },
              theme.nodeActive,
              t,
            );
            ctx.fill();
          }
        }
      }

      // ── Ripple Rings ──
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const safeRadius = Math.max(0, r.radius);
        if (safeRadius > 0) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, safeRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${theme.ripple},${(r.opacity * 0.25).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      ctx.restore();
    },
    [getWarpedPoint, globalColor, themeMode],
  );

  // ── Animation Loop with Idle Suspension ──────────────────────────────────────

  const animate = useCallback(
    (now: number) => {
      const m = mouseRef.current;
      const t = targetMouseRef.current;

      const dx = t.x - m.x;
      const dy = t.y - m.y;
      const hasMovement = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
      const hasRipples = ripplesRef.current.length > 0;

      m.x = lerpN(m.x, t.x, LERP_SPEED);
      m.y = lerpN(m.y, t.y, LERP_SPEED);

      draw(now);

      // Keep running if mouse is moving or ripples are propagating
      if (hasMovement || hasRipples) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Settle in resting state; will wake up on next mouse event
        isRunningRef.current = false;
      }
    },
    [draw],
  );

  const startAnimation = useCallback(() => {
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // ── Setup ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      sizeRef.current = { w, h, dpr };
      draw(performance.now());
    };

    setSize();
    window.addEventListener("resize", setSize);

    const onMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = { x: e.clientX, y: e.clientY };
      startAnimation();
    };

    const onMouseLeave = () => {
      // Smoothly settle back to orthogonal grid when mouse leaves window
      targetMouseRef.current = { x: -9999, y: -9999 };
      startAnimation();
    };

    const onClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        opacity: 1,
        born: performance.now(),
      });
      startAnimation();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("click", onClick);

    // Initial render
    startAnimation();

    return () => {
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("click", onClick);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate, draw, startAnimation]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "relative w-full min-h-screen overflow-hidden",
        themeMode === "light"
          ? "bg-[#ffffff]"
          : "bg-[#000000]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
