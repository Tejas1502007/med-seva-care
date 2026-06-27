"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MessageCircle } from "lucide-react";

/**
 * FloatingActions
 * Two floating circular buttons stacked bottom-right:
 *   1. Live Support / Chat (always visible after scroll)
 *   2. Scroll to Top      (visible after 400 px scroll)
 *
 * Replaces the old ScrollToTop component.
 * MobileBottomNav has been removed, so these sit at bottom-right unobstructed.
 */
export default function FloatingActions() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* Scroll to the AARA chat section / open the widget.
     In practice this just jumps to #contact; the AARA widget
     handles its own open state independently. */
  const openSupport = () => {
    const btn = document.querySelector<HTMLButtonElement>(
      '[aria-label="Open AARA AI assistant"]'
    );
    btn?.click();
  };

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-3 items-center">
      {/* Live Support button — always shown after scroll */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            key="support"
            initial={{ opacity: 0, scale: 0.6, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.93 }}
            onClick={openSupport}
            aria-label="Open live support"
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xl shadow-slate-900/10 hover:shadow-blue-500/20 hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 backdrop-blur-sm"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll-to-top button */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.6, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 16 }}
            transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.93 }}
            onClick={scrollTop}
            aria-label="Scroll to top"
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow duration-200"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
