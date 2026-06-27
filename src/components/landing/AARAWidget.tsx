"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Minimize2, Maximize2, Sparkles } from "lucide-react";

/* ── Canned AARA responses keyed by keyword ──────────────────────────── */
const RESPONSES: Record<string, string> = {
  default:
    "I'm AARA, MedSeva's AI health assistant. I can help you understand your health reports, medications, symptoms, and more. What would you like to know?",
  hello: "Hello! 👋 I'm AARA. How can I help you with your health today?",
  hi:    "Hi there! I'm AARA, your AI healthcare companion. Ask me anything about your health, medications, or reports.",
  medication:
    "I can help with medication reminders, dosage information, and drug interactions. You have 3 medications scheduled today. Would you like the full schedule?",
  report:
    "Your latest AI health report shows a wellness score of 9.1/10. Blood pressure and heart rate are within normal range. I noticed a slight rise in stress markers — would you like tips to manage that?",
  appointment:
    "Your next appointment is with Dr. Priya Sharma on July 28 at 10:00 AM. I can send you a reminder 1 hour before. Shall I?",
  emergency:
    "If this is a medical emergency, please call 112 immediately. I'm also alerting your care team now. Stay calm — help is on the way.",
  heart:
    "Your current heart rate is 78 bpm — that's within the healthy range of 60–100 bpm. Your average over the past 7 days is 76 bpm. Keep it up! 💙",
  diabetes:
    "For diabetes management, MedSeva tracks your blood sugar logs, medication adherence, and flags patterns early. Your last HbA1c trend shows improvement over the past 3 months!",
  pain:
    "I'm sorry to hear you're in pain. Can you tell me more — where is the pain, and on a scale of 1–10, how severe is it? I'll log this and notify your doctor if needed.",
  bp:
    "Your last blood pressure reading was 118/76 mmHg — that's excellent! I'm monitoring for any spikes and will alert you and Dr. Sharma if anything changes.",
  sleep:
    "Your average sleep this week is 6.8 hours. The recommended amount is 7–9 hours. Want me to set a sleep reminder at 10 PM tonight?",
  stress:
    "I've noticed slightly elevated stress markers in your recent data. Deep breathing exercises, a 10-minute walk, and consistent sleep can help. Want me to add a stress-check reminder?",
  diet:
    "Based on your care plan, a low-sodium, high-fibre diet is recommended. I can send you daily meal suggestions tailored to your conditions. Would you like that?",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const key of Object.keys(RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return RESPONSES[key];
  }
  return RESPONSES.default;
}

interface Message {
  role: "user" | "aara";
  text: string;
  ts: string;
}

function ts() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const SUGGESTIONS = ["Check my heart rate", "Show my medications", "Next appointment", "View health report"];

export default function AARAWidget() {
  const [open, setOpen]     = useState(false);
  const [mini, setMini]     = useState(false);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs]     = useState<Message[]>([
    { role: "aara", text: RESPONSES.default, ts: ts() },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text: text.trim(), ts: ts() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "aara", text: getResponse(text), ts: ts() }]);
    }, 900 + Math.random() * 600);
  };

  return (
    <>
      {/* ── Trigger bubble ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-5 lg:bottom-24 lg:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/35 hover:shadow-blue-500/50 transition-shadow duration-200"
            aria-label="Open AARA AI assistant"
          >
            <Bot className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88, y: 32, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed right-5 lg:right-6 z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden transition-all duration-300 ${
              mini
                ? "bottom-24 w-72 h-14"
                : "bottom-24 w-[340px] sm:w-[380px] h-[520px]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-700 to-blue-600 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm flex items-center gap-1.5">
                    AARA
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                  </p>
                  {!mini && (
                    <p className="text-blue-200 text-[10px]">AI Health Assistant · Online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMini((v) => !v)}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                  aria-label={mini ? "Expand" : "Minimise"}
                >
                  {mini ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body — hidden when minimised */}
            {!mini && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
                  {msgs.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                        <p className={`text-[10px] mt-1 ${m.role === "user" ? "text-blue-200 text-right" : "text-slate-400"}`}>
                          {m.ts}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                        {[0, 0.2, 0.4].map((d) => (
                          <motion.span
                            key={d}
                            className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick suggestions */}
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-700/40 rounded-full px-3 py-1 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form
                  onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AARA anything…"
                    className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2.5 outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-colors"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    disabled={!input.trim()}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
