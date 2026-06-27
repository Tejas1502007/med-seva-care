"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Pause, Play } from "lucide-react";

const testimonials = [
  {
    quote: "MedSeva transformed how I monitor my chronic patients. The AI alerts have caught critical changes hours before I would have spotted them manually.",
    name: "Dr. Priya Sharma",
    role: "Cardiologist",
    initials: "PS",
    rating: 5,
    color: "from-blue-500 to-blue-600",
  },
  {
    quote: "I feel supported around the clock. My medication schedule is so much easier, and I actually understand my health now thanks to AARA.",
    name: "Amit Patel",
    role: "Patient",
    initials: "AP",
    rating: 5,
    color: "from-teal-500 to-teal-600",
  },
  {
    quote: "The AI insights save our entire team hours each week. Every care conversation is better informed when we walk in with MedSeva reports.",
    name: "Dr. Neha Kapoor",
    role: "General Physician",
    initials: "NK",
    rating: 5,
    color: "from-purple-500 to-purple-600",
  },
  {
    quote: "As a caregiver, having real-time visibility into my mother's health gives me peace of mind. I can respond immediately when something changes.",
    name: "Sunita Rao",
    role: "Family Caregiver",
    initials: "SR",
    rating: 5,
    color: "from-pink-500 to-pink-600",
  },
  {
    quote: "The OCR prescription scanner is a game changer. No more manual data entry — just snap a photo and everything is logged instantly.",
    name: "Dr. Vikram Singh",
    role: "Internal Medicine",
    initials: "VS",
    rating: 5,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    quote: "Risk detection flagged a potential deterioration 18 hours early. We adjusted the care plan and avoided an emergency admission. Remarkable.",
    name: "Dr. Anjali Mehta",
    role: "ICU Specialist",
    initials: "AM",
    rating: 5,
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const cardWidth = 360 + 20; // card width + gap

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.5;

    const animate = () => {
      if (!paused) {
        offsetRef.current += speed;
        const totalWidth = testimonials.length * cardWidth;
        if (offsetRef.current >= totalWidth) offsetRef.current = 0;
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [paused]);

  return (
    <section id="testimonials" className="py-24 bg-[#F8FAFC] overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#0F172A] leading-tight">
              Trusted by doctors{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                and patients
              </span>
            </h2>
          </div>
          <button
            onClick={() => setPaused((v) => !v)}
            className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? "Resume" : "Pause"}
          </button>
        </motion.div>
      </div>

      {/* Scroll Track */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="flex gap-5 will-change-transform"
          style={{ width: `${testimonials.length * 2 * cardWidth}px` }}
        >
          {[...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[360px] bg-white border border-slate-100 rounded-3xl p-7 shadow-sm hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
