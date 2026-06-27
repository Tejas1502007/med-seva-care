"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Bell, FileText, UserCheck, Stethoscope } from "lucide-react";

const FEED = [
  { icon: <Stethoscope className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-600",  msg: "Dr. Sharma reviewed a patient report",   loc: "Mumbai"   },
  { icon: <Activity   className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-500",     msg: "Emergency alert resolved in 4 minutes",  loc: "Delhi"    },
  { icon: <Bell       className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-600",   msg: "Medication reminder sent to 12 patients", loc: "Bangalore" },
  { icon: <FileText   className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-600", msg: "AI report generated for Rohan M.",      loc: "Pune"     },
  { icon: <UserCheck  className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-600", msg: "New patient onboarded by Dr. Kapoor",    loc: "Chennai"  },
  { icon: <Activity   className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-600",   msg: "Vitals logged — all within normal range", loc: "Hyderabad"},
];

// Deterministic intervals (seconds) for each toast
const INTERVALS = [0, 3500, 7000, 10500, 14000, 17500];

export default function LiveActivityFeed() {
  const [current, setCurrent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let idx = 0;

    function show() {
      idx = (idx + 1) % FEED.length;
      setCurrent(idx);
      setVisible(true);
      setTimeout(() => setVisible(false), 3000); // hide after 3 s
    }

    // First show after 4 s, then every ~5 s
    const first = setTimeout(() => {
      show();
      const interval = setInterval(show, 5000);
      return () => clearInterval(interval);
    }, 4000);

    return () => clearTimeout(first);
  }, []);

  const item = current !== null ? FEED[current] : null;

  return (
    <div className="fixed bottom-24 left-5 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && item && (
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/8 max-w-[280px]"
          >
            {/* Icon badge */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-full ${item.color} flex items-center justify-center`}>
              {item.icon}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                {item.msg}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Live · {item.loc}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
