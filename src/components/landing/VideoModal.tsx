"use client";
/**
 * VideoModal — Premium interactive product demo
 *
 * Performance strategy:
 * - Timer tick stored in a ref; only 4 derived values pushed to state at 10fps
 * - All scenes memoized with React.memo; only the active scene renders
 * - Stable callbacks via useCallback; expensive derivations via useMemo
 * - Feature timeline sidebar memoized; re-renders only when activeId / time changes
 * - No layout-triggering animations (no scaleY, no y-transforms on hot paths)
 * - Backdrop blur applied once, only on backdrop layer
 * - Progress bar updated via direct DOM ref — zero React re-renders per tick
 * - Background orb color changes via CSS variable — no React re-render
 * - All event listeners cleaned up on unmount / modal close
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  memo, useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Activity, ArrowRight, Bot, CheckCircle, ChevronRight,
  Droplet, FileText, Footprints, HeartPulse,
  Pause, Pill, Play,
  RotateCcw, Shield, Sparkles, Stethoscope,
  Volume2, VolumeX, X,
} from "lucide-react";

// ─── Feature definition ───────────────────────────────────────────────────────
const DEMO_FEATURES = [
  { id: "hero",        label: "MedSeva Overview",   icon: Activity,    color: "from-blue-600 to-blue-500",    accentColor: "#2563EB", duration: 10 },
  { id: "dashboard",   label: "Patient Dashboard",  icon: HeartPulse,  color: "from-teal-600 to-teal-500",   accentColor: "#0D7A5F", duration: 12 },
  { id: "vitals",      label: "Vitals & Charts",    icon: Activity,    color: "from-indigo-600 to-indigo-500",accentColor: "#4F46E5", duration: 10 },
  { id: "medications", label: "Medication Tracker", icon: Pill,        color: "from-amber-600 to-amber-500",  accentColor: "#D97706", duration: 10 },
  { id: "reports",     label: "AI Health Reports",  icon: FileText,    color: "from-cyan-600 to-cyan-500",    accentColor: "#0891B2", duration: 12 },
  { id: "doctor",      label: "Doctor Dashboard",   icon: Stethoscope, color: "from-rose-600 to-rose-500",    accentColor: "#E11D48", duration: 10 },
  { id: "aara",        label: "AARA AI Assistant",  icon: Bot,         color: "from-purple-600 to-purple-500",accentColor: "#7C3AED", duration: 11 },
  { id: "cta",         label: "Get Started",        icon: Shield,      color: "from-emerald-600 to-teal-500", accentColor: "#059669", duration:  5 },
] as const;

type FeatureId = typeof DEMO_FEATURES[number]["id"];
type Feature   = typeof DEMO_FEATURES[number];

const TOTAL_DURATION = DEMO_FEATURES.reduce((s, f) => s + f.duration, 0); // 80 s

// Pre-compute cumulative start times once at module level — never recalculated
const FEATURE_STARTS = DEMO_FEATURES.reduce<Record<string, number>>((acc, f, i) => {
  acc[f.id] = i === 0 ? 0 : DEMO_FEATURES.slice(0, i).reduce((s, x) => s + x.duration, 0);
  return acc;
}, {});

function featureAtTime(t: number): { feature: Feature; localPct: number } {
  let acc = 0;
  for (const f of DEMO_FEATURES) {
    if (t < acc + f.duration) return { feature: f, localPct: (t - acc) / f.duration };
    acc += f.duration;
  }
  return { feature: DEMO_FEATURES[DEMO_FEATURES.length - 1], localPct: 1 };
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Scenes (all memoized — only re-render when their own pct changes) ─────────

const SceneHero = memo(function SceneHero({ pct }: { pct: number }) {
  const badgesVisible = pct > 0.3;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center select-none">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-xl shadow-blue-500/40">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <span className="text-3xl font-bold text-white">MedSeva</span>
      </div>
      <p className="text-xl font-semibold text-white/90 max-w-md leading-snug">
        Your AI-Powered Healthcare Companion
      </p>
      <p className="text-sm text-white/60 max-w-sm leading-relaxed">
        Connecting patients, doctors, and caregivers through intelligent monitoring, AI insights, and continuous care.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {(["HIPAA Compliant", "ISO 27001", "99.9% Uptime", "AI-Powered"] as const).map((b) => (
          <span
            key={b}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/20 text-white/80 px-3 py-1.5 rounded-full"
            style={{ opacity: badgesVisible ? 1 : 0, transition: "opacity 0.4s" }}
          >
            <CheckCircle className="w-3 h-3 text-teal-400" /> {b}
          </span>
        ))}
      </div>
    </div>
  );
});

const SceneDashboard = memo(function SceneDashboard({ pct }: { pct: number }) {
  const STATS = useMemo(() => [
    { label: "Blood Sugar",    value: "142 mg/dL", icon: Droplet,    color: "text-red-400",    bad: true  },
    { label: "Blood Pressure", value: "138/88",    icon: HeartPulse, color: "text-teal-400",   bad: false },
    { label: "Med Adherence",  value: "85%",       icon: Pill,       color: "text-purple-400", bad: false },
    { label: "Daily Steps",    value: "4,200",     icon: Footprints, color: "text-blue-400",   bad: false },
  ], []);
  return (
    <div className="p-5 h-full flex flex-col gap-4 overflow-hidden select-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-lg">Namaste, Rajesh ji 🙏</p>
          <p className="text-white/50 text-xs">Wednesday, 24 June 2026</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MODERATE RISK</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="bg-white/8 border border-white/10 rounded-2xl p-4"
            style={{ opacity: pct > i * 0.15 ? 1 : 0, transform: `translateY(${pct > i * 0.15 ? 0 : 12}px)`, transition: "opacity 0.35s, transform 0.35s" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-white/50 text-xs">{s.label}</p>
            </div>
            <p className={`text-xl font-bold ${s.bad ? "text-red-400" : "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div
        className="bg-gradient-to-r from-teal-600/30 to-cyan-600/20 border border-teal-500/30 rounded-2xl p-4 flex items-center gap-3"
        style={{ opacity: pct > 0.5 ? 1 : 0, transition: "opacity 0.4s" }}
      >
        <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0" />
        <p className="text-white/80 text-sm">Your blood pressure has stabilized over 3 days. Excellent progress!</p>
      </div>
    </div>
  );
});

// Chart data at module level — never re-allocated
const WEEKLY_VALS = [138, 145, 142, 148, 140, 144, 142];
const DAY_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHART_H = 100;
const MIN_V = 120; const MAX_V = 160;
const BAR_W_PCT = 0.7;

const SceneVitals = memo(function SceneVitals({ pct }: { pct: number }) {
  const visibleBars = Math.ceil(pct * 7);
  return (
    <div className="p-5 h-full flex flex-col gap-4 select-none">
      <div>
        <p className="text-white font-bold text-lg mb-1">Your Vitals This Week</p>
        <p className="text-white/50 text-xs">Blood Glucose (mg/dL)</p>
      </div>
      <div className="flex-1 bg-white/6 border border-white/10 rounded-2xl p-4 flex flex-col">
        <svg className="w-full flex-1" viewBox={`0 0 100 ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2DD4BF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {WEEKLY_VALS.map((v, i) => {
            const colW = 100 / 7;
            const bh   = ((v - MIN_V) / (MAX_V - MIN_V)) * (CHART_H - 8);
            const bx   = i * colW + colW * (1 - BAR_W_PCT) / 2;
            const bw   = colW * BAR_W_PCT;
            return (
              <rect
                key={i}
                x={bx} y={CHART_H - bh} width={bw} height={bh}
                rx="2"
                fill={i < visibleBars ? "url(#vg)" : "transparent"}
                style={{ transition: "fill 0.2s" }}
              />
            );
          })}
        </svg>
        <div className="flex justify-around mt-2">
          {DAY_LABELS.map((d, i) => (
            <span key={d} className="text-[10px]" style={{ color: i < visibleBars ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", transition: "color 0.2s" }}>{d}</span>
          ))}
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-4 py-3 bg-white/8 border border-white/10 rounded-xl"
        style={{ opacity: pct > 0.7 ? 1 : 0, transition: "opacity 0.4s" }}
      >
        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
        <p className="text-white/70 text-sm">Blood sugar <span className="text-red-400 font-semibold">+5% this week</span>. Recommend medication review.</p>
      </div>
    </div>
  );
});

const MEDS_DATA = [
  { name: "Metformin",    dose: "500mg",  time: "8:00 PM",  status: "Pending", streak: 5  },
  { name: "Amlodipine",   dose: "5mg",    time: "9:00 AM",  status: "Taken",   streak: 12 },
  { name: "Atorvastatin", dose: "10mg",   time: "10:00 PM", status: "Pending", streak: 8  },
] as const;

const SceneMedications = memo(function SceneMedications({ pct }: { pct: number }) {
  return (
    <div className="p-5 h-full flex flex-col gap-4 select-none">
      <div>
        <p className="text-white font-bold text-lg mb-1">Today's Medications</p>
        <p className="text-white/50 text-xs">Adherence: <span className="text-teal-400 font-semibold">85%</span></p>
      </div>
      <div className="space-y-3">
        {MEDS_DATA.map((m, i) => (
          <div
            key={m.name}
            className="flex items-center gap-4 bg-white/8 border border-white/10 rounded-2xl p-4"
            style={{ opacity: pct > i * 0.22 ? 1 : 0, transform: `translateX(${pct > i * 0.22 ? 0 : -12}px)`, transition: "opacity 0.35s, transform 0.35s" }}
          >
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Pill className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{m.name} {m.dose}</p>
              <p className="text-white/40 text-xs">at {m.time} · 🔥 {m.streak} day streak</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              m.status === "Taken" ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>{m.status}</span>
          </div>
        ))}
      </div>
      <div
        className="mt-auto bg-gradient-to-r from-amber-600/25 to-orange-600/15 border border-amber-500/30 rounded-2xl p-4"
        style={{ opacity: pct > 0.6 ? 1 : 0, transition: "opacity 0.4s" }}
      >
        <p className="text-amber-300 text-xs font-semibold mb-1">⏰ Upcoming Reminder</p>
        <p className="text-white/70 text-sm">Metformin 500mg due in <span className="text-amber-300 font-semibold">40 minutes</span></p>
      </div>
    </div>
  );
});

const LAB_DATA = [
  { param: "HbA1c",             value: "7.2%",       status: "high"       },
  { param: "Fasting Glucose",   value: "142 mg/dL",  status: "high"       },
  { param: "Total Cholesterol", value: "195 mg/dL",  status: "normal"     },
  { param: "LDL",               value: "118 mg/dL",  status: "borderline" },
  { param: "Creatinine",        value: "0.9 mg/dL",  status: "normal"     },
] as const;

const SceneReports = memo(function SceneReports({ pct }: { pct: number }) {
  const visibleRows = Math.ceil(pct * LAB_DATA.length);
  return (
    <div className="p-5 h-full flex flex-col gap-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-lg">AI Report Analysis</p>
          <p className="text-white/50 text-xs">Blood Test — Apollo Diagnostics</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
          <Sparkles className="w-3 h-3" /> Analyzed by AI
        </span>
      </div>
      <div className="bg-white/6 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-2 border-b border-white/10">
          {(["Parameter", "Value", "Status"] as const).map(h => (
            <span key={h} className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {LAB_DATA.slice(0, visibleRows).map((l) => (
          <div key={l.param} className="grid grid-cols-3 px-4 py-2.5 border-b border-white/5 last:border-0">
            <span className="text-white/80 text-xs">{l.param}</span>
            <span className="text-white text-xs font-semibold">{l.value}</span>
            <span className={`text-xs font-bold w-fit px-2 py-0.5 rounded-full ${
              l.status === "high" ? "bg-red-500/20 text-red-300" : l.status === "borderline" ? "bg-amber-500/20 text-amber-300" : "bg-teal-500/20 text-teal-300"
            }`}>{l.status}</span>
          </div>
        ))}
      </div>
      <div
        className="flex gap-3 items-start bg-gradient-to-r from-blue-600/20 to-teal-600/15 border border-blue-500/30 rounded-2xl p-4"
        style={{ opacity: pct > 0.7 ? 1 : 0, transition: "opacity 0.4s" }}
      >
        <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/75 text-xs leading-relaxed">
          HbA1c 7.2% — slightly elevated 3-month average.{" "}
          <span className="text-blue-300 font-semibold">Reduce rice portions at dinner</span> and continue evening walks.
        </p>
      </div>
    </div>
  );
});

const QUEUE_DATA = [
  { name: "Priya Nair",    cond: "Type 2 Diabetes",  risk: "HIGH",     reading: "264 mg/dL", critical: true  },
  { name: "Mohan Iyer",    cond: "Post-Op Cardiac",   risk: "HIGH",     reading: "98 bpm",    critical: true  },
  { name: "Rajesh Sharma", cond: "T2DM + HTN",        risk: "MODERATE", reading: "142 mg/dL", critical: false },
  { name: "Sunita Joshi",  cond: "Type 2 Diabetes",   risk: "STABLE",   reading: "118 mg/dL", critical: false },
] as const;

const SceneDoctor = memo(function SceneDoctor({ pct }: { pct: number }) {
  const visibleCards = Math.ceil(pct * QUEUE_DATA.length);
  return (
    <div className="p-5 h-full flex flex-col gap-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-lg">Patient Queue</p>
          <p className="text-white/50 text-xs">42 active cases today</p>
        </div>
        <div className="flex gap-2">
          {([{ l: "High", v: 5, c: "text-red-400" }, { l: "Mod", v: 12, c: "text-amber-400" }, { l: "Stable", v: 25, c: "text-teal-400" }] as const).map(s => (
            <div key={s.l} className="text-center bg-white/8 border border-white/10 rounded-xl px-3 py-1.5">
              <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
              <p className="text-white/40 text-[9px]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {QUEUE_DATA.slice(0, visibleCards).map((p) => (
          <div
            key={p.name}
            className={`flex items-center gap-3 rounded-xl p-3 border ${p.critical ? "bg-red-500/10 border-red-500/30" : "bg-white/6 border-white/10"}`}
          >
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-300 text-xs font-bold">{p.name.split(" ").map(n => n[0]).join("")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{p.name}</p>
              <p className="text-white/40 text-[10px] truncate">{p.cond}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xs font-bold ${p.critical ? "text-red-400" : p.risk === "MODERATE" ? "text-amber-400" : "text-teal-400"}`}>{p.risk}</p>
              <p className="text-white/40 text-[10px]">{p.reading}</p>
            </div>
            {p.critical && (
              <span className="text-[10px] font-bold text-red-300 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full flex-shrink-0">⚠ Alert</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const CHAT_DATA = [
  { role: "aara", text: "Namaste, Rajesh ji 🙏 Your blood sugar today was 142 mg/dL — slightly elevated. How are you feeling?" },
  { role: "user", text: "I feel a bit tired. Should I be worried?" },
  { role: "aara", text: "Fatigue with elevated glucose is common. Have you taken your evening Metformin? A 15-min walk after dinner helps too." },
] as const;

const SceneAARA = memo(function SceneAARA({ pct }: { pct: number }) {
  const visibleMsgs = pct < 0.3 ? 1 : pct < 0.62 ? 2 : 3;
  return (
    <div className="p-5 h-full flex flex-col gap-3 select-none">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm flex items-center gap-1.5">AARA <Sparkles className="w-3 h-3 text-yellow-300" /></p>
          <p className="text-teal-400 text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> AI Health Assistant · Online</p>
        </div>
        <span className="ml-auto text-[10px] font-bold text-white/40 bg-white/8 border border-white/15 px-2 py-0.5 rounded-full">Encrypted</span>
      </div>
      <div className="flex-1 space-y-3">
        {CHAT_DATA.slice(0, visibleMsgs).map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user" ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm" : "bg-white/10 border border-white/15 text-white/85 rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ opacity: pct > 0.6 ? 1 : 0, transition: "opacity 0.4s" }} className="flex flex-wrap gap-2">
        {(["Log vitals", "Missed medication", "View Lab Results"] as const).map(q => (
          <span key={q} className="text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-full px-3 py-1">{q}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-2xl px-4 py-3">
        <p className="flex-1 text-white/30 text-sm">Ask AARA anything about your health…</p>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
});

const SceneCTA = memo(function SceneCTA({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center select-none">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-2">Experience MedSeva</p>
        <p className="text-white/60 text-sm max-w-xs leading-relaxed">Join 5,000+ patients and 200+ doctors delivering smarter, safer care.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3" style={{ opacity: pct > 0.4 ? 1 : 0, transition: "opacity 0.4s" }}>
        <a href="/login" className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 text-sm">
          Start Free Trial <ArrowRight className="w-4 h-4" />
        </a>
        <a href="/login" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/25 text-white font-bold rounded-full text-sm">
          Get Started
        </a>
      </div>
    </div>
  );
});

// ─── Active scene switcher (memoized, only re-mounts on featureId change) ─────
const DemoScene = memo(function DemoScene({ featureId, pct }: { featureId: FeatureId; pct: number }) {
  switch (featureId) {
    case "hero":        return <SceneHero        pct={pct} />;
    case "dashboard":   return <SceneDashboard   pct={pct} />;
    case "vitals":      return <SceneVitals      pct={pct} />;
    case "medications": return <SceneMedications pct={pct} />;
    case "reports":     return <SceneReports     pct={pct} />;
    case "doctor":      return <SceneDoctor      pct={pct} />;
    case "aara":        return <SceneAARA        pct={pct} />;
    case "cta":         return <SceneCTA         pct={pct} />;
    default:            return null;
  }
});

// ─── Timeline sidebar — memoized, stable props ────────────────────────────────
const TimelineSidebar = memo(function TimelineSidebar({
  activeId, doneIds, activeLocalPct, onJump,
}: {
  activeId: FeatureId;
  doneIds: Set<string>;
  activeLocalPct: number;
  onJump: (id: FeatureId) => void;
}) {
  return (
    <nav
      className="hidden lg:flex flex-col w-52 xl:w-56 border-r border-white/8 bg-black/20 flex-shrink-0 overflow-y-auto py-3"
      aria-label="Feature tour"
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-4 pb-3">Feature Tour</p>
      {DEMO_FEATURES.map((f) => {
        const isActive = f.id === activeId;
        const isDone   = doneIds.has(f.id);
        const Icon     = f.icon;
        return (
          <button
            key={f.id}
            onClick={() => onJump(f.id as FeatureId)}
            className={`relative flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${isActive ? "bg-white/8" : "hover:bg-white/4"}`}
          >
            {isActive && (
              <div className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-gradient-to-b ${f.color}`} />
            )}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
              isActive ? `bg-gradient-to-br ${f.color}` : isDone ? "bg-white/10" : "bg-white/5"
            }`}>
              <Icon className={`w-3.5 h-3.5 ${isActive || isDone ? "text-white" : "text-white/40"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : isDone ? "text-white/50" : "text-white/35"}`}>
                {f.label}
              </p>
              {isActive && (
                <div className="mt-1 h-0.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${f.color}`}
                    style={{ width: `${activeLocalPct * 100}%`, transition: "width 0.1s linear" }}
                  />
                </div>
              )}
            </div>
            {isDone && !isActive && <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0" />}
          </button>
        );
      })}
    </nav>
  );
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface VideoModalProps { open: boolean; onClose: () => void; }

export default function VideoModal({ open, onClose }: VideoModalProps) {
  // ── Playback state — kept minimal ──────────────────────────────────────────
  const [playing, setPlaying]   = useState(false);
  const [muted,   setMuted]     = useState(false);
  const [ended,   setEnded]     = useState(false);
  // Only what React needs to re-render scenes / sidebar:
  const [activeId,       setActiveId]       = useState<FeatureId>("hero");
  const [localPct,       setLocalPct]       = useState(0);
  const [doneIds,        setDoneIds]        = useState<Set<string>>(new Set());
  const [displayTime,    setDisplayTime]    = useState(0); // updated at 10fps for readout only

  // ── Refs for values that don't drive React renders ─────────────────────────
  const timeRef       = useRef(0);           // source of truth for time
  const rafRef        = useRef<number>(0);
  const lastRafRef    = useRef<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const accentRef     = useRef<HTMLDivElement>(null); // scene background div
  const displayTickRef = useRef(0);          // sub-frame counter for 10fps readout

  // ── Derive feature from time — pure, no state ─────────────────────────────
  const updateDerivedFromTime = useCallback((t: number) => {
    // Progress bar fill — direct DOM, zero React render
    const gPct = t / TOTAL_DURATION;
    if (progressFillRef.current)  progressFillRef.current.style.width  = `${gPct * 100}%`;
    if (progressThumbRef.current) progressThumbRef.current.style.left  = `calc(${gPct * 100}% - 7px)`;

    // Scene + sidebar — React state, but only when the feature boundary is crossed
    const { feature, localPct: lp } = featureAtTime(t);
    setLocalPct(lp);
    setActiveId((prev) => {
      if (prev !== feature.id) {
        // Update accent color directly on the DOM element
        if (accentRef.current) {
          accentRef.current.style.background = `radial-gradient(ellipse 80% 55% at 50% 30%, ${feature.accentColor}18 0%, transparent 70%), #0A0F1A`;
        }
        // Mark previous feature as done
        setDoneIds((d) => { const next = new Set(d); next.add(prev); return next; });
        return feature.id;
      }
      return prev;
    });

    // Readout update: ~10fps (every 10 frames at 60fps ≈ 100ms)
    displayTickRef.current += 1;
    if (displayTickRef.current >= 6) {
      displayTickRef.current = 0;
      setDisplayTime(t);
    }
  }, []);

  // ── rAF-based playback loop ────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    lastRafRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastRafRef.current) / 1000, 0.1); // cap at 100ms
      lastRafRef.current = now;
      timeRef.current = Math.min(timeRef.current + dt, TOTAL_DURATION);
      updateDerivedFromTime(timeRef.current);

      if (timeRef.current >= TOTAL_DURATION) {
        setPlaying(false);
        setEnded(true);
        setDisplayTime(TOTAL_DURATION);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [updateDerivedFromTime]);

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (playing && !ended) startLoop();
    else stopLoop();
    return stopLoop;
  }, [playing, ended, startLoop, stopLoop]);

  // ── Reset on open / close ──────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      timeRef.current = 0;
      displayTickRef.current = 0;
      setActiveId("hero");
      setLocalPct(0);
      setDoneIds(new Set());
      setDisplayTime(0);
      setEnded(false);
      setPlaying(true);
      if (progressFillRef.current)  progressFillRef.current.style.width = "0%";
      if (progressThumbRef.current) progressThumbRef.current.style.left = "0%";
    } else {
      stopLoop();
      setPlaying(false);
    }
  }, [open, stopLoop]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === "ArrowRight") {
        timeRef.current = Math.min(timeRef.current + 5, TOTAL_DURATION);
        updateDerivedFromTime(timeRef.current);
      }
      if (e.key === "ArrowLeft") {
        timeRef.current = Math.max(timeRef.current - 5, 0);
        updateDerivedFromTime(timeRef.current);
        setEnded(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, updateDerivedFromTime]);

  // ── Progress bar scrub ─────────────────────────────────────────────────────
  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    timeRef.current = pct * TOTAL_DURATION;
    updateDerivedFromTime(timeRef.current);
    setEnded(false);
    setPlaying(true);
  }, [updateDerivedFromTime]);

  // ── Jump to feature ────────────────────────────────────────────────────────
  const jumpTo = useCallback((id: FeatureId) => {
    timeRef.current = FEATURE_STARTS[id];
    updateDerivedFromTime(timeRef.current);
    setEnded(false);
    setPlaying(true);
  }, [updateDerivedFromTime]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    timeRef.current = 0;
    displayTickRef.current = 0;
    setDoneIds(new Set());
    setEnded(false);
    updateDerivedFromTime(0);
    setPlaying(true);
  }, [updateDerivedFromTime]);

  // ── Current feature (stable reference for badge) ───────────────────────────
  const currentFeature = useMemo(
    () => DEMO_FEATURES.find(f => f.id === activeId) ?? DEMO_FEATURES[0],
    [activeId],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop: single blur layer ── */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[199] bg-black/80 backdrop-blur-md"
            style={{ willChange: "opacity" }}
          />

          {/* ── Modal: true 100vw × 100vh ── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[200] flex flex-col bg-[#0A0F1A] overflow-hidden"
            style={{ willChange: "transform, opacity" }}
          >
            {/* ── Title bar ── */}
            <div className="flex items-center justify-between px-5 py-3 bg-white/4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Traffic light — red dot closes */}
                <button
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors"
                  aria-label="Close demo"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/40 font-medium hidden sm:inline">MedSeva — Interactive Product Demo</span>
              </div>
              {/* Explicit close button top-right */}
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Close</span>
              </button>
            </div>

            {/* ── Body: sidebar + scene ── */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar — only visible on lg+ */}
              <TimelineSidebar
                activeId={activeId}
                doneIds={doneIds}
                activeLocalPct={localPct}
                onJump={jumpTo}
              />

              {/* Scene + controls */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Scene area */}
                <div
                  ref={accentRef}
                  className="flex-1 relative overflow-hidden"
                  style={{ background: `radial-gradient(ellipse 80% 55% at 50% 30%, ${currentFeature.accentColor}18 0%, transparent 70%), #0A0F1A` }}
                >
                  {/* Feature badge — top right */}
                  <div className="absolute top-4 right-4 z-10 pointer-events-none">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentFeature.color} shadow-lg text-white text-xs font-bold`}>
                      <currentFeature.icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{currentFeature.label}</span>
                    </div>
                  </div>

                  {/* Scene transition — opacity-only, no layout */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 overflow-hidden"
                      style={{ willChange: "opacity" }}
                    >
                      <DemoScene featureId={activeId} pct={localPct} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── Controls bar ── */}
                <div className="flex-shrink-0 bg-[#060A12] border-t border-white/8 px-4 py-3">
                  {/* Progress bar */}
                  <div
                    ref={progressBarRef}
                    className="relative h-1.5 rounded-full bg-white/10 cursor-pointer mb-3 group"
                    onClick={seekTo}
                    role="slider"
                    aria-label="Demo progress"
                    aria-valuemin={0}
                    aria-valuemax={TOTAL_DURATION}
                  >
                    {/* Segment markers — static, no re-render */}
                    {DEMO_FEATURES.slice(0, -1).map((f) => {
                      const mp = (FEATURE_STARTS[f.id] + f.duration) / TOTAL_DURATION * 100;
                      return <div key={f.id} className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${mp}%` }} />;
                    })}
                    {/* Fill — updated via ref */}
                    <div
                      ref={progressFillRef}
                      className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${currentFeature.color} pointer-events-none`}
                      style={{ width: "0%", transition: "background 0.3s" }}
                    />
                    {/* Thumb — updated via ref */}
                    <div
                      ref={progressThumbRef}
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ left: "0%" }}
                    />
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause/Restart */}
                    <button
                      onClick={() => { if (ended) restart(); else setPlaying(p => !p); }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br ${currentFeature.color} text-white shadow-md flex-shrink-0 active:scale-95 transition-transform`}
                      aria-label={ended ? "Restart" : playing ? "Pause" : "Play"}
                    >
                      {ended ? <RotateCcw className="w-4 h-4" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Restart */}
                    <button
                      onClick={restart}
                      className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0"
                      aria-label="Restart"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Mute */}
                    <button
                      onClick={() => setMuted(m => !m)}
                      className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0"
                      aria-label={muted ? "Unmute" : "Mute"}
                    >
                      {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Time display */}
                    <span className="text-white/40 text-xs font-mono tabular-nums flex-shrink-0">
                      {fmtTime(displayTime)} / {fmtTime(TOTAL_DURATION)}
                    </span>

                    {/* Current feature name — mobile only */}
                    <span className="lg:hidden flex-1 text-white/50 text-xs font-medium truncate">{currentFeature.label}</span>

                    {/* CTA */}
                    <a
                      href="/login"
                      className={`ml-auto hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r ${currentFeature.color} text-white text-xs font-bold shadow-md flex-shrink-0 transition-all`}
                    >
                      Start Free <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Mobile feature pill strip — hidden on lg+ */}
                  <div
                    className="lg:hidden flex gap-1.5 mt-3 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {DEMO_FEATURES.map((f) => {
                      const isActive = f.id === activeId;
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.id}
                          onClick={() => jumpTo(f.id as FeatureId)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                            isActive ? `bg-gradient-to-r ${f.color} text-white` : "bg-white/8 text-white/40"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
