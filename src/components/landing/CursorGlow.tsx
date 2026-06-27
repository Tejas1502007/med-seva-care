"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 200, damping: 30 });
  const sy = useSpring(y, { stiffness: 200, damping: 30 });

  // Dot (follows exactly)
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile.current) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX - 16);
      y.set(e.clientY - 16);
      dotX.set(e.clientX - 3);
      dotY.set(e.clientY - 3);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <>
      {/* Glow ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] border border-blue-400/40 bg-blue-500/5 backdrop-blur-[1px]"
        style={{ x: sx, y: sy }}
      />
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-[9999] bg-blue-500"
        style={{ x: dotX, y: dotY }}
      />
    </>
  );
}
