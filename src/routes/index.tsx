import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "../components/landing/ThemeProvider";

/* ── Lazy-loaded sections & utilities ───────────────────────────────── */
const LenisProvider      = lazy(() => import("../components/landing/LenisProvider"));
const PagePreloader      = lazy(() => import("../components/landing/PagePreloader"));
const CursorGlow         = lazy(() => import("../components/landing/CursorGlow"));
const FloatingActions    = lazy(() => import("../components/landing/ScrollToTop"));
const LiveActivityFeed   = lazy(() => import("../components/landing/LiveActivityFeed"));
const AARAWidget         = lazy(() => import("../components/landing/AARAWidget"));

const Navbar             = lazy(() => import("../components/landing/Navbar"));
const Hero               = lazy(() => import("../components/landing/Hero"));
const MarqueeBand        = lazy(() => import("../components/landing/MarqueeBand"));
const Stats              = lazy(() => import("../components/landing/Stats"));
const Features           = lazy(() => import("../components/landing/Features"));
const Timeline           = lazy(() => import("../components/landing/Timeline"));
const AIShowcase         = lazy(() => import("../components/landing/AIShowcase"));
const PlatformShowcase   = lazy(() => import("../components/landing/IntegrationsSection"));
const DashboardPreview   = lazy(() => import("../components/landing/DashboardPreview"));
const Testimonials       = lazy(() => import("../components/landing/Testimonials"));
const PressBar           = lazy(() => import("../components/landing/PressBar"));
const FAQ                = lazy(() => import("../components/landing/FAQ"));
const CTA                = lazy(() => import("../components/landing/CTA"));
const Footer             = lazy(() => import("../components/landing/Footer"));

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "MedSeva — AI Healthcare Companion for Smarter Patient Care" },
      { name: "description", content: "MedSeva connects patients, doctors, and caregivers through AI-powered health monitoring, medication reminders, smart reports, and continuous healthcare support." },
      { property: "og:title",       content: "MedSeva — AI Healthcare Companion" },
      { property: "og:description", content: "Discover MedSeva: an AI-powered platform for continuous patient care, intelligent reports, and secure medical collaboration." },
      { property: "og:type",        content: "website" },
      { name: "theme-color",        content: "#2563EB" },
    ],
  }),
  component: LandingPage,
} as any));

function SectionLoader() {
  return (
    <div className="w-full py-20 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function LandingPage() {
  return (
    <ThemeProvider>
      <div className="bg-[#F8FAFC] dark:bg-[#0A0F1A] text-[#0F172A] dark:text-slate-100 antialiased overflow-x-hidden transition-colors duration-300">

        {/* ── Global utilities (no UI) ─────────────────────── */}
        <Suspense fallback={null}><PagePreloader /></Suspense>
        <Suspense fallback={null}><LenisProvider /></Suspense>
        <Suspense fallback={null}><CursorGlow /></Suspense>
        <Suspense fallback={null}><LiveActivityFeed /></Suspense>

        {/* ── Floating UI ──────────────────────────────────── */}
        <Suspense fallback={null}><FloatingActions /></Suspense>
        <Suspense fallback={null}><AARAWidget /></Suspense>

        {/* ── Navigation ──────────────────────────────────── */}
        <Suspense fallback={null}><Navbar /></Suspense>

        <main>
          <Suspense fallback={<SectionLoader />}><Hero /></Suspense>
          <Suspense fallback={null}><MarqueeBand /></Suspense>
          <Suspense fallback={<SectionLoader />}><Stats /></Suspense>
          <Suspense fallback={<SectionLoader />}><Features /></Suspense>
          <Suspense fallback={<SectionLoader />}><Timeline /></Suspense>
          <Suspense fallback={<SectionLoader />}><AIShowcase /></Suspense>

          {/* "Everything You Need" platform showcase — replaces old integrations */}
          <Suspense fallback={<SectionLoader />}><PlatformShowcase /></Suspense>

          <Suspense fallback={<SectionLoader />}><DashboardPreview /></Suspense>
          <Suspense fallback={<SectionLoader />}><Testimonials /></Suspense>
          <Suspense fallback={<SectionLoader />}><PressBar /></Suspense>
          <Suspense fallback={<SectionLoader />}><FAQ /></Suspense>
          <Suspense fallback={<SectionLoader />}><CTA /></Suspense>
        </main>

        <Suspense fallback={null}><Footer /></Suspense>
      </div>
    </ThemeProvider>
  );
}
