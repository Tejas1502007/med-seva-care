"use client";
import { useEffect, useRef } from "react";

/**
 * AuroraBackground
 * CSS-canvas animated aurora behind the hero section.
 * Pure canvas — zero JS animation libraries needed.
 * Automatically respects prefers-reduced-motion.
 */
export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0;
    let raf = 0;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Aurora blobs config
    const blobs = [
      { x: 0.2, y: 0.3, r: 0.45, hue: 220, speed: 0.00018, phase: 0    }, // blue
      { x: 0.7, y: 0.2, r: 0.40, hue: 175, speed: 0.00014, phase: 1.2  }, // teal
      { x: 0.5, y: 0.7, r: 0.35, hue: 245, speed: 0.00020, phase: 2.4  }, // indigo
      { x: 0.1, y: 0.8, r: 0.30, hue: 195, speed: 0.00016, phase: 0.8  }, // cyan
      { x: 0.85, y: 0.6, r: 0.32, hue: 210, speed: 0.00022, phase: 1.7 }, // sky
    ];

    let t = 0;

    const draw = (now: number) => {
      t = reduced ? 0 : now;

      ctx.clearRect(0, 0, W, H);

      for (const blob of blobs) {
        const cx = (blob.x + 0.12 * Math.sin(t * blob.speed * 1.3 + blob.phase)) * W;
        const cy = (blob.y + 0.10 * Math.cos(t * blob.speed       + blob.phase)) * H;
        const radius = blob.r * Math.min(W, H);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0,   `hsla(${blob.hue}, 80%, 62%, 0.18)`);
        grad.addColorStop(0.5, `hsla(${blob.hue}, 70%, 55%, 0.08)`);
        grad.addColorStop(1,   `hsla(${blob.hue}, 60%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "normal" }}
    />
  );
}
