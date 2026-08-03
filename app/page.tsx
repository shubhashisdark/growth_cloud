"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-10 transition-colors duration-300 border-b ${
        scrolled
          ? "bg-[rgba(7,10,20,0.92)] border-white/[0.08]"
          : "bg-[rgba(7,10,20,0.6)] border-transparent"
      }`}
      style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] font-extrabold text-[#0B0F1A]"
          style={{
            background: "linear-gradient(135deg, #38BDF8, #818CF8)",
            fontFamily: "var(--font-geist-sans), sans-serif",
          }}
        >
          G
        </div>
        <span
          className="text-[22px] font-bold tracking-[-0.02em] text-[#F1F5F9]"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        >
          Growth Cloud
        </span>
      </div>

      <div className="flex items-center gap-8">
        <a href="#" className="text-sm font-semibold text-[#F1F5F9]">
          Platform
        </a>
        <a href="#" className="text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
          Solutions
        </a>
        <a href="#" className="text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
          Developers
        </a>
        <a href="#" className="text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
          Pricing
        </a>
        <Button asChild variant="outline" className="h-10 px-6 text-sm font-semibold rounded-lg border-white/[0.14] text-[#F1F5F9] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9]">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild className="h-10 px-6 text-sm font-semibold rounded-lg text-[#0B0F1A] bg-[#38BDF8] hover:bg-[#38BDF8]/90" style={{ boxShadow: "0 0 24px rgba(56,189,248,0.18)" }}>
          <Link href="/signup">Get started</Link>
        </Button>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-[192px] pb-[100px] px-10 text-center"
      style={{
        background: "#070A14",
      }}
    >
      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[40px] bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.2)] text-[#38BDF8] font-mono text-xs tracking-[0.04em] mb-8">
          <span className="w-1.5 h-1.5 bg-[#34D399] rounded-full" style={{ boxShadow: "0 0 8px #34D399" }} />
          Now with AI Marketing Assistant
        </div>
      </motion.div>

      <motion.h1
        className="max-w-[900px] mx-auto mb-6 text-[72px] font-extrabold leading-[1.05] tracking-[-0.03em]"
        style={{
          background: "linear-gradient(180deg, #F8FAFC 0%, #94A3B8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "var(--font-geist-sans), sans-serif",
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
      >
        One platform.
        <br />
        Every marketing channel.
      </motion.h1>

      <motion.p
        className="max-w-[600px] mx-auto text-xl text-[#94A3B8] leading-relaxed mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      >
        Capture leads, run campaigns, build automations, and unlock AI-powered insights — all in one unified workspace. No integrations needed.
      </motion.p>

      <motion.div
        className="flex gap-4 justify-center mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      >
        <Button asChild className="h-12 px-8 text-[15px] font-semibold rounded-lg text-[#0B0F1A] bg-[#38BDF8] hover:bg-[#38BDF8]/90" style={{ boxShadow: "0 0 24px rgba(56,189,248,0.18)" }}>
          <Link href="/signup">Start free trial</Link>
        </Button>
        <Button
          variant="outline"
          className="h-12 px-8 text-[15px] font-semibold rounded-lg border-white/[0.14] text-[#F1F5F9] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9]"
        >
          View documentation
        </Button>
      </motion.div>

      <motion.div
        className="max-w-[1100px] mx-auto rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{
          background: "#111827",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
      >
        <div className="h-10 bg-[#0D1321] flex items-center px-4 gap-2 border-b border-white/[0.08]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex h-[500px]">
          <div className="w-[220px] bg-[#0D1321] p-6 pr-4 border-r border-white/[0.08]">
            <div className="h-8 rounded-md mb-2 bg-white/[0.04]" style={{ background: "rgba(56,189,248,0.12)" }} />
            <div className="h-8 rounded-md mb-2 bg-white/[0.04]" />
            <div className="h-8 rounded-md mb-2 bg-white/[0.04]" />
            <div className="h-8 rounded-md mb-2 bg-white/[0.04]" />
            <div className="h-8 rounded-md mb-2 bg-white/[0.04]" />
            <div className="mt-6">
              <div className="h-8 rounded-md mb-2 bg-white/[0.04]" />
              <div className="h-8 rounded-md mb-2 bg-white/[0.04]" />
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="flex gap-6 mb-6">
              <div className="flex-1 h-[140px] bg-[#1A1F2E] rounded-xl border border-white/[0.08] p-5" />
              <div className="flex-1 h-[140px] bg-[#1A1F2E] rounded-xl border border-white/[0.08] p-5" />
              <div className="flex-1 h-[140px] bg-[#1A1F2E] rounded-xl border border-white/[0.08] p-5" />
            </div>
            <div className="h-[200px] bg-[#1A1F2E] rounded-xl border border-white/[0.08] flex items-end p-5 gap-3">
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "45%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "65%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "75%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "55%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "90%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "65%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "80%" }} />
              <div className="flex-1 rounded-t bg-[linear-gradient(180deg,#38BDF8,rgba(56,189,248,0.2))]" style={{ height: "50%" }} />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="py-20 px-10 border-t border-white/[0.08] text-center">
      <motion.p
        className="text-sm text-[#64748B] uppercase tracking-[0.12em] font-semibold mb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        Trusted by high-growth teams worldwide
      </motion.p>
      <motion.div
        className="flex justify-center gap-12 items-center opacity-50"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 0.5, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
      >
        {["Lumina", "Northwind", "Acme Co", "OmniLabs", "Fiber", "Vault"].map((name) => (
          <span
            key={name}
            className="text-xl font-bold text-[#94A3B8] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            {name}
          </span>
        ))}
      </motion.div>
    </section>
  );
}

function FeaturesBento() {
  const features = [
    {
      id: "01",
      title: "Lead Capture & Scoring",
      description:
        "Capture visitors from any channel and automatically score them based on behavior, engagement, and firmographic data. Identify your hottest prospects before they go cold.",
      large: true,
      visual: (
        <div className="mt-6 h-[120px] bg-[#1A1F2E] rounded-[10px] border border-white/[0.08] relative">
          <div className="h-1.5 rounded-[3px] bg-white/[0.06] mx-4 mt-2.5" />
          <div className="h-1.5 rounded-[3px] bg-white/[0.06] mx-4 mt-2.5 w-[60%]" />
          <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/[0.06] rounded">
            <div
              className="h-full rounded"
              style={{ width: "72%", background: "linear-gradient(90deg, #38BDF8, #818CF8)" }}
            />
          </div>
        </div>
      ),
    },
    {
      id: "02",
      title: "Email Campaigns",
      description: "Design, personalize, and send campaigns at scale with built-in deliverability monitoring.",
      large: false,
    },
    {
      id: "03",
      title: "Workflow Automation",
      description: "Visual builder for journeys, triggers, delays, and actions that adapt to real-time behavior.",
      large: false,
    },
    {
      id: "04",
      title: "Dynamic Segments",
      description: "Auto-updating segments based on events, scores, and custom rules. No manual lists.",
      large: false,
    },
    {
      id: "05",
      title: "AI Marketing Assistant",
      description:
        "Generate email copy, summarize leads, predict campaign performance, and build audience segments with natural language. Your marketer co-pilot, always on.",
      large: true,
      visual: (
        <div className="mt-6 h-[120px] bg-[#1A1F2E] rounded-[10px] border border-white/[0.08] flex items-center justify-center gap-2 flex-wrap px-4">
          {["Write subject line", "Score leads", "Build segment"].map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.2)] rounded-[20px] text-xs text-[#38BDF8]"
            >
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "06",
      title: "Attribution & Analytics",
      description: "First-touch, last-touch, and multi-touch attribution models with real-time dashboards.",
      large: false,
    },
    {
      id: "07",
      title: "Webhooks & APIs",
      description: "Build custom integrations with our event-driven architecture. SDKs, REST, and webhooks out of the box.",
      large: false,
    },
    {
      id: "08",
      title: "Multi-tenant Workspaces",
      description: "Invite your team, assign roles, and manage multiple brands from a single account.",
      large: false,
    },
  ];

  return (
    <section className="py-[100px] px-10 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto">
        <motion.p
          className="text-xs text-[#38BDF8] uppercase tracking-[0.1em] font-mono mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Platform Overview
        </motion.p>
        <motion.h2
          className="text-5xl font-bold tracking-[-0.02em] leading-[1.15] mb-16 max-w-[600px]"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          Replace your entire marketing stack.
        </motion.h2>

        <div className="grid grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.id}
              className={`bg-[#111827] border border-white/[0.08] rounded-2xl p-8 relative overflow-hidden ${
                f.large ? "col-span-2" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <div className="w-11 h-11 rounded-[10px] bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.2)] flex items-center justify-center mb-5 text-[#38BDF8] text-lg font-bold font-mono">
                {f.id}
              </div>
              <h3
                className="text-xl font-semibold mb-2.5"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                {f.title}
              </h3>
              <p className="text-[15px] text-[#94A3B8] leading-relaxed">{f.description}</p>
              {f.visual}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote:
        'We replaced five tools with Growth Cloud. Our lead-to-SQL time dropped by 60% in the first quarter. The AI assistant writes better subject lines than our copywriter.',
      initials: "SK",
      name: "Sarah Kim",
      role: "VP Marketing, Lumina",
    },
    {
      quote:
        "The workflow builder is incredible. We built a nurture sequence in 20 minutes that used to take our dev team two weeks to wire up in our old stack.",
      initials: "MR",
      name: "Marcus Reid",
      role: "Growth Lead, OmniLabs",
    },
    {
      quote:
        "Real-time lead scoring changed everything for sales. They finally trust our MQLs because the data is based on actual behavior, not form fills alone.",
      initials: "JL",
      name: "Julia L.",
      role: "RevOps, Northwind",
    },
  ];

  return (
    <section className="py-[100px] px-10 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto">
        <motion.h2
          className="text-center text-[40px] font-bold tracking-[-0.02em] mb-16"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Loved by marketing teams.
        </motion.h2>
        <div className="grid grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-[#111827] border border-white/[0.08] rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <p className="text-base leading-relaxed text-[#94A3B8] mb-6">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0B0F1A]"
                  style={{ background: "linear-gradient(135deg, #38BDF8, #818CF8)", fontFamily: "var(--font-geist-sans), sans-serif" }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-[13px] text-[#64748B] mt-0.5">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-[120px] px-10 text-center border-t border-white/[0.08]">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)",
        }}
      />
      <motion.h2
        className="relative text-[52px] font-extrabold tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Ready to unify your growth stack?
      </motion.h2>
      <motion.p
        className="relative text-lg text-[#94A3B8] mb-9"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
      >
        Start your free 14-day trial. No credit card required.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Button
          className="relative h-[52px] px-10 text-base font-semibold rounded-lg text-[#0B0F1A] bg-[#38BDF8] hover:bg-[#38BDF8]/90"
          style={{ boxShadow: "0 0 24px rgba(56,189,248,0.18)" }}
        >
          Create your workspace
        </Button>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-10 border-t border-white/[0.08] flex justify-between items-center text-[13px] text-[#64748B]">
      <div>Growth Cloud Inc.</div>
      <div className="flex gap-6">
        <a href="#" className="hover:text-[#94A3B8] transition-colors">
          Privacy
        </a>
        <a href="#" className="hover:text-[#94A3B8] transition-colors">
          Terms
        </a>
        <a href="#" className="hover:text-[#94A3B8] transition-colors">
          Status
        </a>
        <a href="#" className="hover:text-[#94A3B8] transition-colors">
          Docs
        </a>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="bg-[#070A14] min-h-screen text-[#F1F5F9]">
      <Navbar />
      <HeroSection />
      <SocialProof />
      <FeaturesBento />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
