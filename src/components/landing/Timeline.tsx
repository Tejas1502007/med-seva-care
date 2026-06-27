"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Link2, HeartPulse, Brain, ClipboardCheck, RefreshCw } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="w-5 h-5" />,
    title: "Register",
    desc: "Create your health profile with medical history and conditions in minutes.",
    color: "from-blue-500 to-blue-600",
    glow: "#2563EB",
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "Connect Doctor",
    desc: "Invite your physician and caregivers to your secure health network.",
    color: "from-indigo-500 to-indigo-600",
    glow: "#4F46E5",
  },
  {
    icon: <HeartPulse className="w-5 h-5" />,
    title: "Track Health",
    desc: "Log vitals, medications, and symptoms from any device, anytime.",
    color: "from-teal-500 to-teal-600",
    glow: "#0D9488",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "AI Analysis",
    desc: "Our AI engine detects patterns and predicts health risks proactively.",
    color: "from-purple-500 to-purple-600",
    glow: "#7C3AED",
  },
  {
    icon: <ClipboardCheck className="w-5 h-5" />,
    title: "Doctor Review",
    desc: "Physicians review AI summaries and update your personalised care plan.",
    color: "from-cyan-500 to-cyan-600",
    glow: "#0891B2",
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    title: "Continuous Care",
    desc: "A live feedback loop ensures you always receive the best possible care.",
    color: "from-green-500 to-green-600",
    glow: "#16A34A",
  },
];

export default function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how" className="py-24 bg-[#0F172A] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            From registration to{" "}
            <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              continuous care
            </span>
          </h2>
        </motion.div>

        <div ref={ref} className="relative">
          {/* Connecting line — desktop */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative group"
              >
                {/* Step node */}
                <div className="flex lg:flex-col lg:items-center gap-4 lg:gap-0">
                  {/* Icon circle */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg relative z-10`}
                      style={{ boxShadow: `0 0 20px ${step.glow}30` }}
                    >
                      {step.icon}
                    </motion.div>

                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-300">{i + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:mt-5 lg:text-center">
                    <h3 className="text-white font-bold text-sm mb-1.5">{step.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </div>

                {/* Connector arrow (mobile/tablet) */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
