"use client";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function DarkModeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <motion.button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        dark ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
        <Sun className="w-3.5 h-3.5" />
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none">
        <Moon className="w-3.5 h-3.5" />
      </span>

      {/* Thumb */}
      <motion.span
        layout
        animate={{ x: dark ? 28 : 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`absolute top-1 w-5 h-5 rounded-full shadow-md flex items-center justify-center ${
          dark ? "bg-white" : "bg-white"
        }`}
        style={{ left: 0 }}
      >
        {dark ? (
          <Moon className="w-3 h-3 text-blue-600" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </motion.span>
    </motion.button>
  );
}
