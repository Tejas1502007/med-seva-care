"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Zap, LayoutDashboard, HelpCircle, Mail } from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { label: "Home",      href: "#hero",        icon: <Home          className="w-5 h-5" /> },
  { label: "Features",  href: "#features",    icon: <Zap           className="w-5 h-5" /> },
  { label: "Dashboard", href: "#dashboard",   icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "FAQ",       href: "#faq",         icon: <HelpCircle    className="w-5 h-5" /> },
  { label: "Contact",   href: "#contact",     icon: <Mail          className="w-5 h-5" /> },
];

export default function MobileBottomNav() {
  const [active, setActive] = useState("hero");
  const [visible, setVisible] = useState(false);

  /* Only show after scrolling past the navbar */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Track active section */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { threshold: 0.35 }
    );
    document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleClick = (href: string) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    /* Only visible on mobile/tablet, hidden on lg+ */
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="mobile-nav"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Mobile bottom navigation"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden"
        >
          <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/60 rounded-full px-2 py-2 shadow-2xl shadow-slate-900/15">
            {NAV.map((item) => {
              const isActive = active === item.href.replace("#", "");
              return (
                <motion.button
                  key={item.label}
                  onClick={() => handleClick(item.href)}
                  whileTap={{ scale: 0.88 }}
                  className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg shadow-blue-500/30"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10 text-[9px] font-semibold tracking-wide leading-none">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
