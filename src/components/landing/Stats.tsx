"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Stethoscope, Cpu, Clock } from "lucide-react";

const stats = [
  { label: "Patients",    end: 5000, suffix: "+",  icon: <Users       className="w-6 h-6" />, color: "from-blue-500 to-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/30",   text: "text-blue-600", ring: "rgba(37,99,235,0.35)"   },
  { label: "Doctors",     end: 200,  suffix: "+",  icon: <Stethoscope className="w-6 h-6" />, color: "from-teal-500 to-teal-600",   bg: "bg-teal-50 dark:bg-teal-900/30",   text: "text-teal-600", ring: "rgba(20,184,166,0.35)"  },
  { label: "AI Accuracy", end: 98,   suffix: "%",  icon: <Cpu         className="w-6 h-6" />, color: "from-purple-500 to-purple-600",bg: "bg-purple-50 dark:bg-purple-900/30",text:"text-purple-600",ring:"rgba(124,58,237,0.35)"  },
  { label: "Support",     end: 24,   suffix: "×7", icon: <Clock       className="w-6 h-6" />, color: "from-orange-500 to-orange-600",bg: "bg-orange-50 dark:bg-orange-900/30",text:"text-orange-500",ring:"rgba(249,115,22,0.35)"  },
];

/* ── Slot-machine digit roller ──────────────────────────────────────── */
function Digit({ value, delay }: { value: string; delay: number }) {
  return (
    <div className="inline-block overflow-hidden h-[1.2em] leading-none align-bottom">
      <motion.span
        key={value}
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {value}
      </motion.span>
    </div>
  );
}

function SlotCounter({ end, suffix, started }: { end: number; suffix: string; started: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const duration = 1800;
    const run = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * end));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [started, end]);

  const str = count.toLocaleString();
  return (
    <span className="tabular-nums">
      {str.split("").map((ch, i) => (
        <Digit key={`${i}-${ch}`} value={ch} delay={i * 0.04} />
      ))}
      {suffix.split("").map((ch, i) => (
        <Digit key={`s${i}-${ch}`} value={ch} delay={str.length * 0.04 + i * 0.04} />
      ))}
    </span>
  );
}

/* ── Animated gradient border card ─────────────────────────────────── */
function GlowCard({
  children,
  ring,
  color,
  i,
}: {
  children: React.ReactNode;
  ring: string;
  color: string;
  i: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group"
    >
      {/* Animated gradient border — spins on hover */}
      <motion.div
        className={`absolute -inset-[1.5px] rounded-3xl bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        animate={hovered ? { rotate: [0, 360] } : { rotate: 0 }}
        transition={hovered ? { duration: 3, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        style={{ filter: `blur(4px)` }}
      />

      {/* Card face */}
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center overflow-hidden z-10"
        style={{
          boxShadow: hovered ? `0 20px 40px ${ring}, 0 0 0 1px transparent` : undefined,
          transition: "box-shadow 0.3s ease",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-white dark:bg-[#0D1320]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Trusted by thousands
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0F172A] dark:text-white">
            Numbers that speak for themselves
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <GlowCard key={stat.label} ring={stat.ring} color={stat.color} i={i}>
              {/* Hover background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-3xl`} />

              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${stat.bg} ${stat.text} mb-5 mx-auto`}>
                {stat.icon}
              </div>

              <div className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                <SlotCounter end={stat.end} suffix={stat.suffix} started={inView} />
              </div>

              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}
