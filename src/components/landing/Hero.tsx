"use client";
import { useRef, lazy, Suspense, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Activity, Bell, Brain, Calendar, Shield, ArrowRight, Play, CheckCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { lazy as lazyLoad } from "react";

const Hero3D        = lazy(() => import("./Hero3D"));
const AuroraBackground = lazyLoad(() => import("./AuroraBackground"));
const VideoDemoButton  = lazyLoad(() => import("./VideoDemoButton"));

/* ── Typewriter rotating words ──────────────────────────────────────────── */
const ROTATING_WORDS = ["Patient Care", "Doctor Insights", "Health Monitoring", "Smarter Outcomes"];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % ROTATING_WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 32, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -32, opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const floatingCards = [
  {
    id: "heart",
    icon: <Activity className="w-4 h-4 text-red-400" />,
    label: "Heart Rate",
    value: "78 bpm",
    sub: "Normal range",
    color: "from-red-500/10 to-pink-500/10",
    border: "border-red-200/60",
    delay: 0,
    pos: "top-8 -left-8",
  },
  {
    id: "med",
    icon: <Bell className="w-4 h-4 text-blue-400" />,
    label: "Medication",
    value: "Next in 40m",
    sub: "Metformin 500mg",
    color: "from-blue-500/10 to-indigo-500/10",
    border: "border-blue-200/60",
    delay: 0.2,
    pos: "top-1/3 -right-10",
  },
  {
    id: "ai",
    icon: <Brain className="w-4 h-4 text-teal-400" />,
    label: "AI Health Score",
    value: "9.1 / 10",
    sub: "Excellent condition",
    color: "from-teal-500/10 to-cyan-500/10",
    border: "border-teal-200/60",
    delay: 0.4,
    pos: "bottom-16 -left-6",
  },
  {
    id: "appt",
    icon: <Calendar className="w-4 h-4 text-purple-400" />,
    label: "Appointment",
    value: "Jul 28 · 10am",
    sub: "Dr. Priya Sharma",
    color: "from-purple-500/10 to-violet-500/10",
    border: "border-purple-200/60",
    delay: 0.6,
    pos: "bottom-4 right-0",
  },
];

function FloatingCard({
  card,
  mouseX,
  mouseY,
}: {
  card: (typeof floatingCards)[0];
  mouseX: any;
  mouseY: any;
}) {
  const rx = useTransform(mouseY, [-0.5, 0.5], [-4, 4]);
  const ry = useTransform(mouseX, [-0.5, 0.5], [4, -4]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: card.delay + 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: rx, rotateY: ry }}
      className={`absolute ${card.pos} z-10 hidden md:block`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3 + card.delay, repeat: Infinity, ease: "easeInOut" }}
        className={`bg-white/80 backdrop-blur-xl border ${card.border} rounded-2xl p-3.5 shadow-xl shadow-slate-900/8 min-w-[160px]`}
      >
        <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${card.color} mb-2`}>
          {card.icon}
        </div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</p>
        <p className="text-sm font-bold text-slate-900 mt-0.5">{card.value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
      </motion.div>
    </motion.div>
  );
}

const trustBadges = [
  { icon: <Shield className="w-4 h-4" />, text: "HIPAA Compliant" },
  { icon: <CheckCircle className="w-4 h-4" />, text: "ISO 27001" },
  { icon: <Activity className="w-4 h-4" />, text: "99.9% Uptime" },
];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#F8FAFC] pt-24 pb-16 dark:bg-[#020617]"
    >
      {/* Aurora animated background */}
      <Suspense fallback={null}>
        <AuroraBackground />
      </Suspense>

      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F172A" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              AI-Powered Healthcare Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl lg:text-6xl xl:text-7xl font-bold text-[#0F172A] leading-[1.08] tracking-tight"
            >
              Your AI Healthcare{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent">
                Companion
              </span>{" "}
              for{" "}<RotatingWord />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl"
            >
              MedSeva connects patients, doctors, and caregivers through AI-powered health monitoring, medication reminders, smart reports, and continuous healthcare support.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap gap-4 mt-10"
            >
              <MagneticButton>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-full shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 text-sm"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Suspense fallback={null}>
                  <VideoDemoButton />
                </Suspense>
              </MagneticButton>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4 mt-10"
            >
              {trustBadges.map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-100 rounded-full px-3.5 py-2 shadow-sm"
                >
                  <span className="text-teal-500">{badge.icon}</span>
                  {badge.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column — 3D + Floating Cards */}
          <div className="relative h-[520px] lg:h-[600px]">
            {/* 3D Canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{
                background: "radial-gradient(ellipse at center, rgba(37,99,235,0.06) 0%, transparent 70%)",
              }}
            >
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-24 h-24 rounded-full bg-blue-100 animate-pulse" /></div>}>
                <Hero3D />
              </Suspense>
            </motion.div>

            {/* Dashboard Mock overlay */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-8 left-0 right-0 mx-4 z-10"
            >
              <div className="bg-white/85 backdrop-blur-2xl border border-white/60 rounded-3xl p-5 shadow-2xl shadow-slate-900/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Dashboard</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Updated just now</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Patients", val: "5,000+", color: "text-blue-600" },
                    { label: "Doctors", val: "200+", color: "text-teal-600" },
                    { label: "AI Score", val: "98%", color: "text-purple-600" },
                    { label: "Support", val: "24/7", color: "text-orange-500" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating Cards */}
            {floatingCards.map((card) => (
              <FloatingCard key={card.id} card={card} mouseX={springX} mouseY={springY} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.2);
    y.set((e.clientY - cy) * 0.2);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}
