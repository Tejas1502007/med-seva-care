"use client";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Bot,
  Receipt,
  BarChart3,
  Pill,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Patient Management",
    description:
      "Store, organize, and access patient records securely from one centralized platform with full audit trails.",
    gradient: "from-blue-500 to-blue-600",
    iconColor: "text-blue-600 dark:text-blue-400",
    glow: "hover:shadow-blue-500/10",
    hoverBorder: "hover:border-blue-200 dark:hover:border-blue-700/60",
    tag: "Core",
    tagColor: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Appointment Scheduling",
    description:
      "Smart scheduling with automated reminders, conflict detection, and reduced no-shows across your clinic.",
    gradient: "from-teal-500 to-teal-600",
    iconColor: "text-teal-600 dark:text-teal-400",
    glow: "hover:shadow-teal-500/10",
    hoverBorder: "hover:border-teal-200 dark:hover:border-teal-700/60",
    tag: "Smart",
    tagColor: "bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI Assistant",
    description:
      "Generate clinical summaries, AI-powered care recommendations, and intelligent healthcare insights instantly.",
    gradient: "from-violet-500 to-violet-600",
    iconColor: "text-violet-600 dark:text-violet-400",
    glow: "hover:shadow-violet-500/10",
    hoverBorder: "hover:border-violet-200 dark:hover:border-violet-700/60",
    tag: "AI",
    tagColor: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    title: "Billing & Invoicing",
    description:
      "Create invoices, manage payments, insurance records, and financial reports effortlessly in one place.",
    gradient: "from-amber-500 to-orange-500",
    iconColor: "text-amber-600 dark:text-amber-400",
    glow: "hover:shadow-amber-500/10",
    hoverBorder: "hover:border-amber-200 dark:hover:border-amber-700/60",
    tag: "Finance",
    tagColor: "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Reports & Analytics",
    description:
      "Visual dashboards that help clinics make data-driven decisions with real-time insights and trend forecasting.",
    gradient: "from-cyan-500 to-cyan-600",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    glow: "hover:shadow-cyan-500/10",
    hoverBorder: "hover:border-cyan-200 dark:hover:border-cyan-700/60",
    tag: "Analytics",
    tagColor: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    icon: <Pill className="w-6 h-6" />,
    title: "Prescription Management",
    description:
      "Generate, manage, and securely share digital prescriptions with patients and pharmacies instantly.",
    gradient: "from-rose-500 to-rose-600",
    iconColor: "text-rose-600 dark:text-rose-400",
    glow: "hover:shadow-rose-500/10",
    hoverBorder: "hover:border-rose-200 dark:hover:border-rose-700/60",
    tag: "Rx",
    tagColor: "bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

export default function PlatformShowcase() {
  return (
    <section
      id="platform"
      className="py-28 bg-white dark:bg-[#0D1320] relative overflow-hidden"
    >
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-500/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-teal-500/4 rounded-full blur-3xl" />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.055]"
        style={{
          backgroundImage: "radial-gradient(circle, #94A3B8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
            Everything You Need
          </span>

          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0F172A] dark:text-white leading-[1.1] tracking-tight mb-5">
            Everything You Need{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              in One Platform
            </span>
          </h2>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            MedSeva brings together every essential healthcare tool into one
            intelligent platform. Manage patients, appointments, AI insights,
            prescriptions, billing, and analytics from a single dashboard.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
              className="group relative"
            >
              <div
                className={`relative h-full bg-white dark:bg-slate-900/80 border border-slate-100/80 dark:border-slate-800 ${f.hoverBorder} rounded-[22px] p-7 shadow-sm hover:shadow-2xl ${f.glow} transition-all duration-300 overflow-hidden flex flex-col gap-5`}
              >
                {/* Gradient wash on hover */}
                <div className={`absolute inset-0 rounded-[22px] bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />

                {/* Icon + tag */}
                <div className="flex items-start justify-between">
                  <motion.div
                    whileHover={{ rotate: 8, scale: 1.12 }}
                    transition={{ duration: 0.25 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    {f.icon}
                  </motion.div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${f.tagColor}`}>
                    {f.tag}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white leading-snug">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                    {f.description}
                  </p>
                </div>

                {/* Learn more on hover */}
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${f.iconColor} opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0`}>
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
