"use client";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Award,
  Lock,
  Star,
  Cpu,
  HeartPulse,
  BadgeCheck,
  Globe,
} from "lucide-react";

const items = [
  { icon: <ShieldCheck className="w-4 h-4" />, text: "HIPAA Compliant" },
  { icon: <Award className="w-4 h-4" />,       text: "ISO 27001 Certified" },
  { icon: <Star className="w-4 h-4" />,         text: "4.9 / 5 on G2" },
  { icon: <HeartPulse className="w-4 h-4" />,   text: "Apollo Hospitals" },
  { icon: <Cpu className="w-4 h-4" />,          text: "AI-Powered Engine" },
  { icon: <BadgeCheck className="w-4 h-4" />,   text: "NABH Accredited" },
  { icon: <Globe className="w-4 h-4" />,        text: "Fortis Healthcare" },
  { icon: <Lock className="w-4 h-4" />,         text: "256-bit Encryption" },
  { icon: <Star className="w-4 h-4" />,         text: "99.9% Uptime SLA" },
  { icon: <HeartPulse className="w-4 h-4" />,   text: "Max Healthcare" },
  { icon: <ShieldCheck className="w-4 h-4" />,  text: "SOC 2 Type II" },
  { icon: <Award className="w-4 h-4" />,        text: "Narayana Health" },
];

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex gap-4 flex-shrink-0"
        animate={{ x: reverse ? ["0%", "50%"] : ["0%", "-50%"] }}
        transition={{
          duration: 28,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-full px-5 py-2.5 shadow-sm flex-shrink-0 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
          >
            <span className="text-blue-500 group-hover:text-blue-600 transition-colors">
              {item.icon}
            </span>
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap group-hover:text-slate-800 transition-colors">
              {item.text}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function MarqueeBand() {
  return (
    <section className="py-10 bg-white border-y border-slate-100 overflow-hidden">
      {/* Fade edges */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex flex-col gap-3">
          <MarqueeRow />
          <MarqueeRow reverse />
        </div>
      </div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mt-6"
      >
        Trusted by leading healthcare institutions across India
      </motion.p>
    </section>
  );
}
