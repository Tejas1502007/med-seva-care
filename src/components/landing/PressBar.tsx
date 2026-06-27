"use client";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Cpu,
  Clock,
  Eye,
  CheckCircle2,
  BadgeCheck,
  Zap,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════════ */

const STANDARDS = [
  {
    icon: <Lock className="w-6 h-6" />,
    title: "End-to-End Encryption",
    description:
      "All patient data encrypted with AES-256 at rest and in transit. Zero plaintext storage.",
    gradient: "from-blue-500 to-blue-600",
    glow: "rgba(37,99,235,0.12)",
    border: "hover:border-blue-200 dark:hover:border-blue-700/60",
    tag: "Security",
    tagColor:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "HIPAA Ready",
    description:
      "Built to meet HIPAA compliance standards for protected health information handling.",
    gradient: "from-teal-500 to-teal-600",
    glow: "rgba(20,184,166,0.12)",
    border: "hover:border-teal-200 dark:hover:border-teal-700/60",
    tag: "Compliance",
    tagColor:
      "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "AI Powered",
    description:
      "Advanced ML models for risk detection, predictive analytics, and clinical summarisation.",
    gradient: "from-violet-500 to-violet-600",
    glow: "rgba(124,58,237,0.12)",
    border: "hover:border-violet-200 dark:hover:border-violet-700/60",
    tag: "Intelligence",
    tagColor:
      "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "99.9% Uptime SLA",
    description:
      "Enterprise-grade infrastructure with redundant failover, auto-scaling, and 24/7 monitoring.",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.12)",
    border: "hover:border-amber-200 dark:hover:border-amber-700/60",
    tag: "Reliability",
    tagColor:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Privacy First",
    description:
      "Role-based access control, full audit trails, and patient-controlled data sharing.",
    gradient: "from-cyan-500 to-cyan-600",
    glow: "rgba(6,182,212,0.12)",
    border: "hover:border-cyan-200 dark:hover:border-cyan-700/60",
    tag: "Privacy",
    tagColor:
      "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Secure Cloud Infrastructure",
    description:
      "Hosted on ISO 27001-aligned infrastructure with automated backups and disaster recovery.",
    gradient: "from-rose-500 to-rose-600",
    glow: "rgba(244,63,94,0.12)",
    border: "hover:border-rose-200 dark:hover:border-rose-700/60",
    tag: "Infrastructure",
    tagColor:
      "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

const TRUST_BADGES = [
  {
    icon: <Lock className="w-4 h-4" />,
    label: "HIPAA Ready",
    desc: "Protected health information handled to HIPAA standards",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-800/60",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    label: "Secure Cloud Platform",
    desc: "ISO 27001-aligned, encrypted at every layer",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    border: "border-teal-100 dark:border-teal-800/60",
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    label: "AI Powered Healthcare",
    desc: "ML-driven insights built for modern clinical teams",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    border: "border-violet-100 dark:border-violet-800/60",
  },
];

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function PressBar() {

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#EFF6FF] via-white to-white dark:from-[#0D1628] dark:via-[#0D1320] dark:to-[#0D1320]">

      {/* ── Ambient background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glow behind heading */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/8 dark:bg-blue-500/10 rounded-full blur-3xl" />
        {/* Corner dot patterns */}
        <div
          className="absolute top-0 left-0 w-48 h-48 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #94A3B8 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #94A3B8 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* Floating circles */}
        <motion.div
          animate={{ y: [-10, 10, -10], x: [-6, 6, -6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 right-[12%] w-20 h-20 rounded-full border border-blue-200/40 dark:border-blue-700/30 bg-blue-50/40 dark:bg-blue-900/10"
        />
        <motion.div
          animate={{ y: [10, -10, 10], x: [6, -6, 6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-24 left-[8%] w-14 h-14 rounded-full border border-teal-200/40 dark:border-teal-700/30 bg-teal-50/40 dark:bg-teal-900/10"
        />
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 right-[5%] w-10 h-10 rounded-full bg-violet-100/50 dark:bg-violet-900/20"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* ── Section heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold uppercase tracking-[0.18em] px-4 py-2 rounded-full mb-5">
            <BadgeCheck className="w-3.5 h-3.5" />
            Built with Industry Standards
          </span>

          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0F172A] dark:text-white leading-[1.1] tracking-tight mb-4">
            Trusted by Healthcare Leaders &amp;{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Industry Recognition
            </span>
          </h2>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Recognized for transforming healthcare through AI-powered patient
            management, smart automation, and seamless clinical workflows.
          </p>
        </motion.div>

        {/* ── Standards cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {STANDARDS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.22 } }}
              className="group relative"
            >
              <div
                className={`relative h-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-100/80 dark:border-slate-800 ${s.border} rounded-[20px] p-6 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col gap-4`}
                style={{
                  boxShadow: undefined,
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 0 1px ${s.glow}, 0 20px 40px ${s.glow}`,
                  }}
                />

                {/* Gradient wash */}
                <div
                  className={`absolute inset-0 rounded-[20px] bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`}
                />

                {/* Top row */}
                <div className="flex items-start justify-between relative">
                  <motion.div
                    whileHover={{ rotate: 8, scale: 1.12 }}
                    transition={{ duration: 0.22 }}
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-md`}
                  >
                    {s.icon}
                  </motion.div>

                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5 relative flex-1">
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {/* Tag + badge row */}
                <div className="flex items-center justify-between relative">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${s.tagColor}`}>
                    {s.tag}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-1 rounded-full">
                    Standard 2025
                  </span>
                </div>

                {/* Bottom accent line */}
                <div
                  className={`absolute bottom-0 left-5 right-5 h-[2px] rounded-full bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Trust badge pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {TRUST_BADGES.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.45 }}
              whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.18 } }}
              className={`flex items-center gap-3 ${b.bg} border ${b.border} rounded-full px-5 py-3 shadow-sm cursor-default`}
            >
              <div className={`${b.color} flex-shrink-0`}>{b.icon}</div>
              <div>
                <p className={`text-sm font-bold ${b.color} leading-none`}>
                  {b.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {b.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
