"use client";
import { motion } from "framer-motion";
import { Brain, ScanLine, BarChart3, ShieldAlert, Sparkles, FileText } from "lucide-react";

const aiCards = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI Assistant (AARA)",
    description: "Answer questions, guide care decisions, and explain medical status in plain language 24/7.",
    gradient: "from-blue-600/20 via-blue-500/10 to-transparent",
    glow: "rgba(37,99,235,0.15)",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    tag: "Live",
    tagColor: "bg-blue-500/20 text-blue-300",
  },
  {
    icon: <ScanLine className="w-6 h-6" />,
    title: "OCR Prescription Scanner",
    description: "Instantly extract medication details, dosages, and instructions from prescriptions and images.",
    gradient: "from-teal-600/20 via-teal-500/10 to-transparent",
    glow: "rgba(20,184,166,0.15)",
    border: "border-teal-500/20",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-400",
    tag: "New",
    tagColor: "bg-teal-500/20 text-teal-300",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Predictive Analytics",
    description: "Forecast high-risk clinical events before they become emergencies using time-series ML models.",
    gradient: "from-purple-600/20 via-purple-500/10 to-transparent",
    glow: "rgba(124,58,237,0.15)",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    tag: "Beta",
    tagColor: "bg-purple-500/20 text-purple-300",
  },
  {
    icon: <ShieldAlert className="w-6 h-6" />,
    title: "Risk Detection",
    description: "Detect subtle patterns that signal complications early — hours or days ahead of manual review.",
    gradient: "from-red-600/20 via-red-500/10 to-transparent",
    glow: "rgba(239,68,68,0.15)",
    border: "border-red-500/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    tag: "Core",
    tagColor: "bg-red-500/20 text-red-300",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Smart Recommendations",
    description: "Personalised care advice and lifestyle guidance tailored to each patient's unique health journey.",
    gradient: "from-amber-600/20 via-amber-500/10 to-transparent",
    glow: "rgba(245,158,11,0.15)",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    tag: "Smart",
    tagColor: "bg-amber-500/20 text-amber-300",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Medical Report Generator",
    description: "Auto-build comprehensive patient summaries from vital trends, logs, and AI insights instantly.",
    gradient: "from-cyan-600/20 via-cyan-500/10 to-transparent",
    glow: "rgba(6,182,212,0.15)",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    tag: "Auto",
    tagColor: "bg-cyan-500/20 text-cyan-300",
  },
];

export default function AIShowcase() {
  return (
    <section id="ai" className="py-24 bg-[#0A0F1A] relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">AI Capabilities</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            Advanced AI built for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              modern care teams
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Six intelligent modules that work together to deliver proactive, personalised, data-driven healthcare.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {aiCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div
                className={`relative h-full rounded-3xl border ${card.border} bg-white/[0.03] backdrop-blur-sm p-7 overflow-hidden transition-all duration-300 hover:bg-white/[0.06]`}
                style={{ boxShadow: `0 0 40px ${card.glow}` }}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-60 rounded-3xl`} />

                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`p-3 rounded-2xl ${card.iconBg}`}>
                      <span className={card.iconColor}>{card.icon}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>

                  {/* Animated bar */}
                  <div className="mt-5 h-0.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + 0.4, duration: 1.2, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${card.gradient.replace("/20", "").replace("/10", "")}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
