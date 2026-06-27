"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import VideoModal from "./VideoModal";

/**
 * VideoDemoButton — premium interactive product demo trigger.
 * Replaces the old "Watch Demo" placeholder with a fullscreen interactive tour.
 */
export default function VideoDemoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center gap-2.5 px-7 py-3.5 bg-white border border-slate-200 text-slate-800 font-semibold rounded-full shadow-sm hover:border-blue-300 hover:shadow-lg hover:text-blue-700 transition-all duration-300 text-sm group overflow-hidden ${className}`}
      >
        {/* Subtle shimmer sweep on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
        />

        {/* Play icon with pulse ring */}
        <div className="relative w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 group-hover:from-blue-700 group-hover:to-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-500/30 transition-all duration-200 flex-shrink-0">
          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping opacity-0 group-hover:opacity-100" />
        </div>

        <span className="relative z-10">Watch Demo</span>

        {/* AI badge */}
        <span className="relative z-10 flex items-center gap-1 text-[10px] font-bold bg-blue-50 group-hover:bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 transition-colors">
          <Sparkles className="w-2.5 h-2.5" />
          Interactive
        </span>
      </motion.button>

      <VideoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
