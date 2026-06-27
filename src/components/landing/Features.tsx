"use client";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Activity,
  Bell,
  LayoutDashboard,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";

/* ── 3-D tilt + spotlight card wrapper ─────────────────────────────────── */
function TiltCard({ children, glowColor }: { children: React.ReactNode; glowColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotX = useMotionValue(-999);
  const spotY = useMotionValue(-999);
  const sx = useSpring(x, { stiffness: 200, damping: 22 });
  const sy = useSpring(y, { stiffness: 200, damping: 22 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);

  const [hovered, setHovered] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    x.set(nx);
    y.set(ny);
    spotX.set(e.clientX - r.left);
    spotY.set(e.clientY - r.top);
  };

  const onLeave = () => {
    x.set(0); y.set(0);
    spotX.set(-999); spotY.set(-999);
    setHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className="relative h-full"
    >
      {/* Spotlight overlay */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20 overflow-hidden"
        style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <motion.div
          className="absolute w-40 h-40 rounded-full pointer-events-none"
          style={{
            x: useTransform(spotX, v => v - 80),
            y: useTransform(spotY, v => v - 80),
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      </motion.div>
      {children}
    </motion.div>
  );
}

/* ─── Inline SVG illustrations ─────────────────────────────────────────────
   Pure SVG so there are zero external image requests and no bundle bloat.
   Each illustration uses the card's accent colour and a soft white/slate fill.
────────────────────────────────────────────────────────────────────────── */

function IllustrationMonitoring() {
  return (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="280" height="160" rx="16" fill="#EFF6FF" />
      {/* monitor body */}
      <rect x="50" y="24" width="180" height="98" rx="10" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <rect x="60" y="34" width="160" height="72" rx="6" fill="#F0F9FF" />
      {/* ECG line */}
      <polyline
        points="68,70 88,70 96,50 104,88 112,56 120,70 180,70"
        stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="180" y1="70" x2="212" y2="70" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4 3" />
      {/* pulse dot */}
      <circle cx="180" cy="70" r="5" fill="#2563EB" opacity="0.85" />
      {/* stand */}
      <rect x="126" y="122" width="28" height="8" rx="4" fill="#BFDBFE" />
      <rect x="118" y="128" width="44" height="6" rx="3" fill="#93C5FD" />
      {/* stat chips */}
      <rect x="60" y="110" width="44" height="16" rx="8" fill="#BFDBFE" />
      <text x="82" y="121" textAnchor="middle" fontSize="8" fill="#1D4ED8" fontWeight="600">78 bpm</text>
      <rect x="112" y="110" width="44" height="16" rx="8" fill="#D1FAE5" />
      <text x="134" y="121" textAnchor="middle" fontSize="8" fill="#065F46" fontWeight="600">Normal</text>
      <rect x="164" y="110" width="36" height="16" rx="8" fill="#FEF3C7" />
      <text x="182" y="121" textAnchor="middle" fontSize="8" fill="#92400E" fontWeight="600">SpO2 98</text>
    </svg>
  );
}

function IllustrationMedication() {
  return (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="280" height="160" rx="16" fill="#F0FDFA" />
      {/* pill bottle */}
      <rect x="104" y="30" width="50" height="80" rx="12" fill="#CCFBF1" stroke="#2DD4BF" strokeWidth="1.5" />
      <rect x="104" y="30" width="50" height="22" rx="8" fill="#5EEAD4" />
      <rect x="100" y="26" width="58" height="12" rx="6" fill="#14B8A6" />
      {/* pills inside */}
      <ellipse cx="129" cy="74" rx="12" ry="6" fill="#A7F3D0" />
      <ellipse cx="129" cy="84" rx="12" ry="6" fill="#6EE7B7" />
      {/* floating pills */}
      <ellipse cx="72" cy="55" rx="16" ry="8" fill="#A7F3D0" stroke="#6EE7B7" strokeWidth="1" />
      <line x1="72" y1="55" x2="72" y2="55" stroke="#2DD4BF" strokeWidth="1.5" />
      <ellipse cx="200" cy="75" rx="16" ry="8" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="1" transform="rotate(-30 200 75)" />
      {/* bell reminder */}
      <path d="M52 110 Q62 96 72 110" stroke="#14B8A6" strokeWidth="2" fill="none" />
      <circle cx="62" cy="113" r="3" fill="#14B8A6" />
      {/* reminder chip */}
      <rect x="160" y="104" width="76" height="22" rx="11" fill="#CCFBF1" />
      <text x="198" y="118" textAnchor="middle" fontSize="9" fill="#0F766E" fontWeight="600">Next in 40 min</text>
    </svg>
  );
}

function IllustrationDashboard() {
  return (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="280" height="160" rx="16" fill="#EEF2FF" />
      {/* main panel */}
      <rect x="30" y="20" width="220" height="120" rx="12" fill="#E0E7FF" stroke="#A5B4FC" strokeWidth="1" />
      {/* sidebar */}
      <rect x="30" y="20" width="48" height="120" rx="12" fill="#C7D2FE" />
      <circle cx="54" cy="44" r="10" fill="#6366F1" />
      <rect x="40" y="64" width="28" height="6" rx="3" fill="#A5B4FC" />
      <rect x="40" y="78" width="28" height="6" rx="3" fill="#A5B4FC" />
      <rect x="40" y="92" width="28" height="6" rx="3" fill="#A5B4FC" />
      {/* content area */}
      <rect x="88" y="30" width="150" height="28" rx="8" fill="white" opacity="0.7" />
      <rect x="96" y="38" width="60" height="8" rx="4" fill="#818CF8" />
      <rect x="96" y="50" width="40" height="5" rx="2.5" fill="#C7D2FE" />
      {/* stat cards */}
      <rect x="88" y="68" width="46" height="36" rx="8" fill="white" opacity="0.8" />
      <text x="111" y="88" textAnchor="middle" fontSize="13" fill="#4F46E5" fontWeight="700">24</text>
      <text x="111" y="98" textAnchor="middle" fontSize="7" fill="#6366F1">Patients</text>
      <rect x="142" y="68" width="46" height="36" rx="8" fill="white" opacity="0.8" />
      <text x="165" y="88" textAnchor="middle" fontSize="13" fill="#059669" fontWeight="700">94%</text>
      <text x="165" y="98" textAnchor="middle" fontSize="7" fill="#6366F1">Adherence</text>
      <rect x="196" y="68" width="42" height="36" rx="8" fill="white" opacity="0.8" />
      <text x="217" y="88" textAnchor="middle" fontSize="13" fill="#DC2626" fontWeight="700">6</text>
      <text x="217" y="98" textAnchor="middle" fontSize="7" fill="#6366F1">Alerts</text>
      {/* bar chart */}
      <rect x="88" y="114" width="150" height="20" rx="6" fill="white" opacity="0.5" />
      {[0,1,2,3,4].map((b) => (
        <rect key={b} x={96 + b * 24} y={120 - b * 2} width="14" height={b * 2 + 6} rx="3" fill="#818CF8" opacity="0.7" />
      ))}
    </svg>
  );
}

function IllustrationAppointment() {
  return (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="280" height="160" rx="16" fill="#FAF5FF" />
      {/* calendar */}
      <rect x="60" y="22" width="160" height="118" rx="14" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1.5" />
      {/* header band */}
      <rect x="60" y="22" width="160" height="36" rx="14" fill="#7C3AED" />
      <rect x="60" y="40" width="160" height="18" fill="#7C3AED" />
      <text x="140" y="45" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">July 2025</text>
      {/* nav arrows */}
      <text x="74" y="45" textAnchor="middle" fontSize="12" fill="#DDD6FE">‹</text>
      <text x="206" y="45" textAnchor="middle" fontSize="12" fill="#DDD6FE">›</text>
      {/* day labels */}
      {["M","T","W","T","F","S","S"].map((d, i) => (
        <text key={i} x={76 + i * 20} y="74" textAnchor="middle" fontSize="8" fill="#7C3AED" fontWeight="600">{d}</text>
      ))}
      {/* day cells */}
      {Array.from({length: 28}, (_, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const day = i + 1;
        const isActive = day === 28;
        return (
          <g key={i}>
            {isActive && <circle cx={76 + col * 20} cy={86 + row * 18} r="9" fill="#7C3AED" />}
            <text x={76 + col * 20} y={90 + row * 18} textAnchor="middle" fontSize="8"
              fill={isActive ? "white" : day === 15 ? "#7C3AED" : "#6B7280"} fontWeight={isActive || day === 15 ? "700" : "400"}>
              {day}
            </text>
          </g>
        );
      })}
      {/* appointment chip */}
      <rect x="72" y="152" width="136" height="18" rx="9" fill="#7C3AED" opacity="0.15" />
      <text x="140" y="164" textAnchor="middle" fontSize="8" fill="#6D28D9" fontWeight="600">Dr. Sharma — Jul 28 · 10:00 AM</text>
    </svg>
  );
}

function IllustrationReports() {
  return (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="280" height="160" rx="16" fill="#ECFEFF" />
      {/* document */}
      <rect x="80" y="16" width="120" height="128" rx="12" fill="white" stroke="#A5F3FC" strokeWidth="1.5" />
      {/* header bar */}
      <rect x="80" y="16" width="120" height="28" rx="12" fill="#0891B2" />
      <rect x="80" y="30" width="120" height="14" fill="#0891B2" />
      <text x="140" y="33" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">AI Health Report</text>
      {/* text lines */}
      {[52, 64, 76].map((y) => (
        <rect key={y} x="96" y={y} width={y === 76 ? 60 : 88} height="7" rx="3.5" fill="#CFFAFE" />
      ))}
      {/* score ring */}
      <circle cx="140" cy="108" r="22" fill="#ECFEFF" stroke="#A5F3FC" strokeWidth="2" />
      <path d="M140 86 A22 22 0 1 1 139.9 86" stroke="#0891B2" strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray="124" strokeDashoffset="12" fill="none" />
      <text x="140" y="112" textAnchor="middle" fontSize="12" fill="#0E7490" fontWeight="800">9.1</text>
      <text x="140" y="122" textAnchor="middle" fontSize="7" fill="#6B7280">/10</text>
      {/* AI sparkle */}
      <circle cx="188" cy="32" r="10" fill="#CFFAFE" />
      <text x="188" y="36" textAnchor="middle" fontSize="10">✦</text>
    </svg>
  );
}

function IllustrationEmergency() {
  return (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect width="280" height="160" rx="16" fill="#FFF1F2" />
      {/* shield */}
      <path d="M140 20 L188 38 L188 88 Q188 120 140 140 Q92 120 92 88 L92 38 Z" fill="#FEE2E2" stroke="#FCA5A5" strokeWidth="2" />
      <path d="M140 30 L180 45 L180 88 Q180 114 140 132 Q100 114 100 88 L100 45 Z" fill="#FECACA" />
      {/* cross */}
      <rect x="130" y="62" width="20" height="52" rx="6" fill="#EF4444" />
      <rect x="114" y="78" width="52" height="20" rx="6" fill="#EF4444" />
      {/* pulse rings */}
      <circle cx="140" cy="88" r="56" stroke="#FCA5A5" strokeWidth="1" opacity="0.4" strokeDasharray="4 4" />
      <circle cx="140" cy="88" r="70" stroke="#FCA5A5" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" />
      {/* alert chip */}
      <rect x="86" y="148" width="108" height="18" rx="9" fill="#FEE2E2" />
      <text x="140" y="160" textAnchor="middle" fontSize="8" fill="#B91C1C" fontWeight="700">Emergency Protocol Active</text>
    </svg>
  );
}

const features = [
  {
    illustration: <IllustrationMonitoring />,
    icon: <Activity className="w-5 h-5" />,
    title: "AI Health Monitoring",
    description: "Continuous vitals tracking with intelligent alerts and anomaly detection powered by advanced ML models.",
    color: "from-blue-500 to-blue-600",
    glow: "hover:shadow-blue-500/15",
    bg: "bg-blue-50",
    text: "text-blue-600",
    hoverBorder: "hover:border-blue-200",
    learnColor: "text-blue-600",
    spotlightColor: "rgba(37,99,235,0.12)",
  },
  {
    illustration: <IllustrationMedication />,
    icon: <Bell className="w-5 h-5" />,
    title: "Medication Reminders",
    description: "Timely dose notifications, adherence analytics, and smart refill management for every patient.",
    color: "from-teal-500 to-teal-600",
    glow: "hover:shadow-teal-500/15",
    bg: "bg-teal-50",
    text: "text-teal-600",
    hoverBorder: "hover:border-teal-200",
    learnColor: "text-teal-600",
    spotlightColor: "rgba(20,184,166,0.12)",
  },
  {
    illustration: <IllustrationDashboard />,
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: "Doctor Dashboard",
    description: "One unified view for patient history, vital trends, risk flags, and actionable care next steps.",
    color: "from-indigo-500 to-indigo-600",
    glow: "hover:shadow-indigo-500/15",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    hoverBorder: "hover:border-indigo-200",
    learnColor: "text-indigo-600",
    spotlightColor: "rgba(99,102,241,0.12)",
  },
  {
    illustration: <IllustrationAppointment />,
    icon: <Calendar className="w-5 h-5" />,
    title: "Appointment Scheduling",
    description: "Simplified booking, rescheduling, and virtual visit management across patients and providers.",
    color: "from-purple-500 to-purple-600",
    glow: "hover:shadow-purple-500/15",
    bg: "bg-purple-50",
    text: "text-purple-600",
    hoverBorder: "hover:border-purple-200",
    learnColor: "text-purple-600",
    spotlightColor: "rgba(124,58,237,0.12)",
  },
  {
    illustration: <IllustrationReports />,
    icon: <FileText className="w-5 h-5" />,
    title: "AI Medical Reports",
    description: "Auto-generated summaries and insights tailored for care teams from real-time health data.",
    color: "from-cyan-500 to-cyan-600",
    glow: "hover:shadow-cyan-500/15",
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    hoverBorder: "hover:border-cyan-200",
    learnColor: "text-cyan-600",
    spotlightColor: "rgba(6,182,212,0.12)",
  },
  {
    illustration: <IllustrationEmergency />,
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Emergency Alerts",
    description: "Instant escalation protocols for deteriorating health signals, connecting care teams in seconds.",
    color: "from-red-500 to-red-600",
    glow: "hover:shadow-red-500/15",
    bg: "bg-red-50",
    text: "text-red-600",
    hoverBorder: "hover:border-red-200",
    learnColor: "text-red-600",
    spotlightColor: "rgba(239,68,68,0.12)",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header — unchanged */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Platform Features
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F172A] leading-tight">
            Powerful healthcare tools in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              one platform
            </span>
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            Everything your care team needs, designed with precision for modern
            healthcare delivery.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col"
            >
              <TiltCard glowColor={feature.spotlightColor}>
              <div
                className={`relative flex flex-col h-full bg-white border border-slate-100 ${feature.hoverBorder} rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl ${feature.glow} transition-all duration-300`}
              >
                {/* ── Illustration banner ───────────────────────── */}
                <div className="relative w-full h-44 overflow-hidden bg-slate-50 flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full p-4"
                  >
                    {feature.illustration}
                  </motion.div>

                  {/* subtle top-to-bottom fade so illustration blends into card body */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>

                {/* ── Card body ─────────────────────────────────── */}
                <div className="flex flex-col flex-1 px-7 pt-5 pb-7">
                  {/* Gradient bg on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.025] transition-opacity duration-300`}
                  />

                  {/* Icon + title row */}
                  <div className="flex items-center gap-3 mb-3 relative">
                    <motion.div
                      whileHover={{ scale: 1.12, rotate: 6 }}
                      transition={{ duration: 0.2 }}
                      className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${feature.bg} ${feature.text}`}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed relative flex-1">
                    {feature.description}
                  </p>

                  <motion.div
                    className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${feature.learnColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative`}
                  >
                    Learn more
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.div>
                </div>
              </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
