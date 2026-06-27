"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HeadphonesIcon } from "lucide-react";

const faqs = [
  {
    q: "Can I use MedSeva for multiple chronic conditions?",
    a: "Yes. MedSeva supports diabetes, hypertension, cardiac care, respiratory conditions, and more. Each condition has tailored monitoring protocols, targeted alerts, and personalised care plan templates.",
  },
  {
    q: "How is patient data kept secure and private?",
    a: "All medical records are AES-256 encrypted at rest and in transit. Role-based access control ensures only authorised care team members can view sensitive information, and comprehensive audit logs track every access event.",
  },
  {
    q: "Can patients invite their own doctors and caregivers?",
    a: "Absolutely. Patients control their care network. They can invite physicians, specialists, family members, and professional caregivers, then define exactly what each person can view and edit.",
  },
  {
    q: "Is the AI assistant (AARA) available 24/7?",
    a: "Yes. AARA is available round-the-clock to answer health questions, summarise medical reports, explain prescriptions in plain language, and surface the most important next steps for any care situation.",
  },
  {
    q: "What devices and integrations does MedSeva support?",
    a: "MedSeva works on iOS, Android, and web browsers. It integrates with wearables like Apple Watch, Fitbit, and Garmin, as well as common EHR systems and pharmacy management platforms.",
  },
  {
    q: "Is there a free trial available?",
    a: "Yes. MedSeva offers a 30-day free trial with full access to all features — no credit card required. After the trial, you can choose between individual, clinic, and enterprise plans.",
  },
];

/* ── Inline SVG: AI healthcare assistant illustration ──────────────────── */
function SupportIllustration() {
  return (
    <svg
      viewBox="0 0 320 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-full"
    >
      {/* ── Background card ── */}
      <rect x="20" y="20" width="280" height="240" rx="24" fill="#EFF6FF" />

      {/* ── Decorative circles ── */}
      <circle cx="290" cy="30"  r="28" fill="#DBEAFE" opacity="0.6" />
      <circle cx="30"  cy="250" r="20" fill="#BFDBFE" opacity="0.5" />
      <circle cx="160" cy="14"  r="14" fill="#93C5FD" opacity="0.4" />

      {/* ── Doctor avatar body ── */}
      {/* coat */}
      <rect x="108" y="152" width="104" height="88" rx="20" fill="#2563EB" />
      {/* lapels */}
      <path d="M160 152 L140 180 L160 172 L180 180 Z" fill="#1D4ED8" />
      {/* stethoscope */}
      <path d="M142 170 Q128 190 134 208 Q140 220 152 220" stroke="#BFDBFE" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="152" cy="222" r="5" fill="#93C5FD" />
      {/* neck */}
      <rect x="148" y="132" width="24" height="24" rx="6" fill="#FDE68A" />
      {/* head */}
      <ellipse cx="160" cy="120" rx="32" ry="34" fill="#FDE68A" />
      {/* hair */}
      <path d="M128 110 Q128 84 160 84 Q192 84 192 110" fill="#1E3A5F" />
      {/* eyes */}
      <ellipse cx="149" cy="116" rx="4" ry="5" fill="#1E3A5F" />
      <ellipse cx="171" cy="116" rx="4" ry="5" fill="#1E3A5F" />
      <circle cx="150" cy="115" r="1.5" fill="white" />
      <circle cx="172" cy="115" r="1.5" fill="white" />
      {/* smile */}
      <path d="M151 126 Q160 133 169 126" stroke="#1E3A5F" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* arms */}
      <rect x="74"  y="158" width="36" height="20" rx="10" fill="#2563EB" transform="rotate(-20 74 158)" />
      <rect x="208" y="158" width="36" height="20" rx="10" fill="#2563EB" transform="rotate(20 208 158)" />

      {/* ── Chat bubbles ── */}
      {/* left bubble */}
      <rect x="32" y="68" width="108" height="40" rx="14" fill="white" />
      <path d="M52 108 L44 120 L64 108" fill="white" />
      <rect x="42" y="79"  width="60" height="7" rx="3.5" fill="#BFDBFE" />
      <rect x="42" y="91"  width="40" height="7" rx="3.5" fill="#DBEAFE" />

      {/* right bubble */}
      <rect x="180" y="52" width="108" height="52" rx="14" fill="#2563EB" />
      <path d="M256 104 L268 116 L248 104" fill="#2563EB" />
      <rect x="192" y="64" width="84" height="7" rx="3.5" fill="#93C5FD" />
      <rect x="192" y="76" width="64" height="7" rx="3.5" fill="#BFDBFE" />
      <rect x="192" y="88" width="44" height="7" rx="3.5" fill="#93C5FD" />

      {/* ── AI badge ── */}
      <rect x="112" y="38" width="96" height="28" rx="14" fill="#2563EB" />
      <circle cx="130" cy="52" r="8" fill="#60A5FA" />
      <text x="129" y="56" textAnchor="middle" fontSize="9" fill="white" fontWeight="800">AI</text>
      <rect x="144" y="46" width="52" height="6" rx="3" fill="#93C5FD" />
      <rect x="144" y="56" width="36" height="5" rx="2.5" fill="#BFDBFE" />

      {/* ── Floating stat chip ── */}
      <rect x="214" y="172" width="82" height="28" rx="14" fill="white" />
      <circle cx="228" cy="186" r="7" fill="#D1FAE5" />
      <text x="228" y="190" textAnchor="middle" fontSize="8" fill="#059669">✓</text>
      <rect x="241" y="181" width="44" height="5"  rx="2.5" fill="#D1FAE5" />
      <rect x="241" y="189" width="30" height="5"  rx="2.5" fill="#A7F3D0" />

      {/* ── 24/7 badge ── */}
      <rect x="32" y="172" width="68" height="28" rx="14" fill="#2563EB" />
      <text x="66" y="190" textAnchor="middle" fontSize="11" fill="white" fontWeight="800">24 / 7</text>
    </svg>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 items-start">

          {/* ── Left column ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28 flex flex-col gap-8"
          >
            {/* Heading — unchanged */}
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-[#0F172A] leading-tight mb-5">
                Common questions{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  answered
                </span>
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Can't find what you're looking for?{" "}
                <a href="#contact" className="text-blue-600 font-semibold hover:underline">
                  Contact our team
                </a>{" "}
                and we'll get back to you within one business day.
              </p>
            </div>

            {/* ── Illustration ── */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full max-w-xs mx-auto lg:mx-0"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-blue-500/10 border border-blue-100/60">
                <SupportIllustration />
              </div>
            </motion.div>

            {/* ── Support callout ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5"
            >
              <p className="text-sm font-bold text-slate-800 mb-1">
                Still have questions?
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Our healthcare experts are available 24/7 to help you get the most from MedSeva.
              </p>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-200"
              >
                <HeadphonesIcon className="w-3.5 h-3.5" />
                Contact Support
              </motion.a>
            </motion.div>
          </motion.div>

          {/* ── Accordion — unchanged ────────────────────────────── */}
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  open === i
                    ? "border-blue-200 shadow-lg shadow-blue-500/5 bg-blue-50/30"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={open === i}
                >
                  <span
                    className={`font-semibold text-sm leading-relaxed transition-colors ${
                      open === i ? "text-blue-700" : "text-slate-900"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      open === i
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {open === i ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-blue-100 pt-4">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
