"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

/* ── Deterministic floating dots ─────────────────────────────────────────
   Blue-tinted on the light background instead of white on dark.
──────────────────────────────────────────────────────────────────────── */
const DOTS = [
  { id:  0, x:  8, y: 12, s: 5,  o: 0.18, d: 0    },
  { id:  1, x: 22, y: 68, s: 4,  o: 0.14, d: 0.4  },
  { id:  2, x: 37, y: 35, s: 6,  o: 0.10, d: 0.8  },
  { id:  3, x: 51, y: 82, s: 4,  o: 0.16, d: 1.2  },
  { id:  4, x: 64, y: 18, s: 5,  o: 0.09, d: 0.6  },
  { id:  5, x: 78, y: 55, s: 6,  o: 0.13, d: 1.5  },
  { id:  6, x: 90, y: 30, s: 4,  o: 0.11, d: 0.3  },
  { id:  7, x: 14, y: 90, s: 5,  o: 0.08, d: 1.8  },
  { id:  8, x: 45, y: 60, s: 4,  o: 0.12, d: 0.9  },
  { id:  9, x: 70, y: 78, s: 5,  o: 0.10, d: 2.1  },
  { id: 10, x: 30, y: 14, s: 6,  o: 0.07, d: 1.0  },
  { id: 11, x: 55, y: 44, s: 4,  o: 0.15, d: 0.2  },
  { id: 12, x: 83, y: 92, s: 5,  o: 0.08, d: 1.6  },
  { id: 13, x: 95, y: 10, s: 4,  o: 0.11, d: 0.7  },
  { id: 14, x:  6, y: 50, s: 5,  o: 0.09, d: 2.4  },
  { id: 15, x: 18, y: 28, s: 6,  o: 0.10, d: 1.3  },
];

function Dot({ x, y, s, o, d }: { x: number; y: number; s: number; o: number; d: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-blue-400 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, opacity: o }}
      animate={{ y: [-8, 8, -8], opacity: [o, o * 0.35, o] }}
      transition={{ duration: 3.5, repeat: Infinity, delay: d, ease: "easeInOut" }}
    />
  );
}

/* ── Animated light blob ─────────────────────────────────────────────── */
function LightBlob({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width  - 0.5) * 24);
    mouseY.set(((e.clientY - rect.top)  / rect.height - 0.5) * 24);
  };

  return (
    <section id="contact" className="py-20 px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2rem] p-12 lg:p-16 dark:bg-slate-900/90"
          style={{
            /* Light blue → soft cyan gradient — Option 1 */
            background: "linear-gradient(135deg, #F0F7FF 0%, #E8F4FF 35%, #E0F2FE 65%, #EEF9FF 100%)",
            boxShadow:
              "0 4px 6px rgba(37,99,235,0.04), 0 20px 48px rgba(37,99,235,0.08), 0 0 0 1px rgba(37,99,235,0.07)",
          }}
        >
          {/* ── Central radial glow ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 65% 55% at 50% 40%, rgba(37,99,235,0.07) 0%, transparent 70%)",
            }}
          />

          {/* ── Light blobs ── */}
          <LightBlob className="w-72 h-72 -top-20 -left-20 bg-blue-200/40 blur-3xl" />
          <LightBlob className="w-96 h-96 -bottom-24 -right-24 bg-cyan-200/35 blur-3xl" />
          <LightBlob className="w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sky-100/60 blur-2xl" />

          {/* ── Mouse-tracked parallax orbs ── */}
          <motion.div
            style={{ x: springX, y: springY }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-blue-300/12 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div
            style={{ x: springX, y: springY }}
            className="absolute -bottom-14 -left-14 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none"
          />

          {/* ── Dot grid pattern ── */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* ── Thin decorative border ring ── */}
          <div
            className="absolute inset-0 rounded-[2rem] pointer-events-none"
            style={{
              border: "1px solid rgba(37,99,235,0.10)",
            }}
          />

          {/* ── Floating dots ── */}
          {DOTS.map((d) => (
            <Dot key={d.id} x={d.x} y={d.y} s={d.s} o={d.o} d={d.d} />
          ))}

          {/* ── Abstract healthcare arc lines ── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05]"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="10%" cy="20%" r="80"  fill="none" stroke="#2563EB" strokeWidth="1" />
            <circle cx="90%" cy="75%" r="100" fill="none" stroke="#0891B2" strokeWidth="1" />
            <circle cx="50%" cy="50%" r="160" fill="none" stroke="#2563EB" strokeWidth="0.5" strokeDasharray="6 8" />
            <path d="M0,50% Q25%,30% 50%,50% T100%,50%" fill="none" stroke="#2563EB" strokeWidth="0.8" strokeDasharray="4 6" />
          </svg>

          {/* ── Content ── */}
          <div className="relative text-center max-w-2xl mx-auto">

            {/* Badge */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white border border-blue-100 shadow-sm rounded-full px-4 py-2 text-sm font-semibold text-blue-700 mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              30-day free trial, no credit card required
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl lg:text-6xl font-bold leading-[1.1] mb-5 text-[#0F172A]"
            >
              Ready to Transform{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Healthcare?
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-slate-500 text-lg mb-10 leading-relaxed"
            >
              Join 5,000+ patients and 200+ doctors already delivering smarter,
              safer care with MedSeva.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {/* Primary — blue gradient */}
              <motion.div
                whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 text-sm"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Secondary — white with blue border */}
              <motion.div
                whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.97 }}
              >
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-blue-200 text-blue-700 font-bold rounded-full hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 text-sm shadow-sm hover:shadow-md">
                  Book a Demo
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
