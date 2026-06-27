"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  User,
  Heart,
  Network,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

const tabs = [
  {
    key: "doctor",
    label: "Doctor",
    icon: <Stethoscope className="w-4 h-4" />,
    content: {
      header: "Doctor Dashboard",
      subtitle: "24 patients active",
      badge: "Live",
      badgeColor: "bg-green-100 text-green-700",
      stats: [
        { label: "New Alerts",    value: "6",      color: "text-red-600"   },
        { label: "Avg Response",  value: "12 min", color: "text-blue-600"  },
        { label: "Reviews Due",   value: "8",      color: "text-amber-600" },
        { label: "Stable Pts",    value: "18",     color: "text-green-600" },
      ],
      highlight: {
        title: "Priority Action",
        text: "Medication review required for 8 patients",
        gradient: "from-blue-600 to-teal-500",
      },
    },
  },
  {
    key: "patient",
    label: "Patient",
    icon: <User className="w-4 h-4" />,
    content: {
      header: "Patient Dashboard",
      subtitle: "Today's health status",
      badge: "Stable",
      badgeColor: "bg-teal-100 text-teal-700",
      stats: [
        { label: "Heart Rate",  value: "78 bpm", color: "text-red-500"    },
        { label: "Steps Today", value: "6,204",  color: "text-blue-600"   },
        { label: "Meds Due",    value: "3",      color: "text-purple-600" },
        { label: "Next Appt",   value: "Jul 28", color: "text-teal-600"   },
      ],
      highlight: {
        title: "Care Plan Update",
        text: "Review stress report and follow your medication schedule",
        gradient: "from-teal-600 to-cyan-500",
      },
    },
  },
  {
    key: "caregiver",
    label: "Caregiver",
    icon: <Heart className="w-4 h-4" />,
    content: {
      header: "Caregiver Dashboard",
      subtitle: "3 patients on watchlist",
      badge: "Active",
      badgeColor: "bg-purple-100 text-purple-700",
      stats: [
        { label: "Med Alerts", value: "2",     color: "text-red-500"    },
        { label: "Care Tasks", value: "5",     color: "text-blue-600"   },
        { label: "Reports",    value: "3 new", color: "text-teal-600"   },
        { label: "Messages",   value: "7",     color: "text-purple-600" },
      ],
      highlight: {
        title: "Family Summary",
        text: "Review shared care notes and schedule family follow-up",
        gradient: "from-purple-600 to-pink-500",
      },
    },
  },
];

/* ── Info-panel items with Lucide icons (no emojis) ──────────────────────── */
const infoPanelItems = [
  {
    icon: <Network className="w-5 h-5" />,
    iconGradient: "from-blue-500 to-blue-600",
    title: "Unified care coordination",
    desc: "All stakeholders — doctors, patients, and caregivers — work within a single connected workspace with shared, real-time health data.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    iconGradient: "from-indigo-500 to-blue-600",
    title: "Role-based access control",
    desc: "Each user only sees what they need. Medical privacy and compliance are built into every data flow.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    iconGradient: "from-teal-500 to-cyan-500",
    title: "Seamless collaboration",
    desc: "Share reports, leave notes, and manage care transitions without switching tools or losing context.",
  },
];

export default function DashboardPreview() {
  const [active, setActive] = useState("doctor");
  const current = tabs.find((t) => t.key === active)!;

  return (
    <section id="dashboard" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header — unchanged */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Interactive Preview
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F172A] leading-tight">
            Dashboards built for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              every role
            </span>
          </h2>
          <p className="mt-4 text-slate-600">
            Switch between views to experience how MedSeva serves every member
            of the care team.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          {/* ── Tab Panel — unchanged ────────────────────────────── */}
          <div className="bg-[#F8FAFC] rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex gap-2 mb-6 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active === tab.key
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {current.content.header}
                    </p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {current.content.subtitle}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${current.content.badgeColor}`}>
                    {current.content.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {current.content.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
                    >
                      <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div
                  className={`rounded-2xl bg-gradient-to-r ${current.content.highlight.gradient} p-5 text-white`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                    {current.content.highlight.title}
                  </p>
                  <p className="font-semibold text-sm leading-relaxed">
                    {current.content.highlight.text}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Info Panel — emojis replaced with Lucide icons ────── */}
          <div className="space-y-5">
            {infoPanelItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex gap-4 p-5 bg-[#F8FAFC] rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200"
              >
                {/* Icon with blue gradient background */}
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${item.iconGradient} flex items-center justify-center text-white shadow-sm`}
                >
                  {item.icon}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
