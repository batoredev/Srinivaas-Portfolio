"use client";

import {
  achievements,
  caseStudies,
  certifications,
  currentlyBuilding,
  education,
  experience,
  githubHighlights,
  navItems,
  profile,
  projects,
  research,
  techStack,
  testimonials,
} from "@/data/content";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

function SectionLabel({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] tracking-[0.45em] text-[#7dffd4]/70 uppercase">
        {kicker}
      </p>
      <h2 className="mt-2 text-3xl md:text-5xl font-normal text-white tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function Scramble({ text }: { text: string }) {
  const glyphs = "アイウエオカキクケコΑΒΓΔΛΣΩ01<>/#";
  const [out, setOut] = useState(text);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(
        text
          .split("")
          .map((ch, idx) =>
            idx < i / 2 ? ch : glyphs[Math.floor(Math.random() * glyphs.length)],
          )
          .join(""),
      );
      if (i > text.length * 2) {
        setOut(text);
        clearInterval(id);
      }
    }, 28);
    return () => clearInterval(id);
  }, [text]);
  return <span>{out}</span>;
}

export function CinematicExperience() {
  const [cmd, setCmd] = useState("");
  const [log, setLog] = useState<string[]>([
    "JARVIS-LINK // BATORE CORE ONLINE",
    "neural lattice: stable",
    "awaiting handshake…",
  ]);

  const stackNodes = useMemo(
    () =>
      [
        ...techStack.languages,
        ...techStack.frontend,
        ...techStack.backend,
        ...techStack.data,
        ...techStack.infra,
        ...techStack.ai,
      ].slice(0, 16),
    [],
  );

  function onCommand(e: FormEvent) {
    e.preventDefault();
    const value = cmd.trim();
    if (!value) return;
    setLog((prev) => [
      ...prev,
      `> ${value}`,
      "queued. open professional dossier for a cleaner channel, or mail hello@batore.dev",
    ]);
    setCmd("");
  }

  return (
    <div className="cinematic-root neural-grid min-h-screen">
      <div className="scan-corners" />
      <nav className="fixed top-4 left-1/2 z-50 hidden w-[min(1100px,92vw)] -translate-x-1/2 items-center justify-between rounded-full border border-[#7dffd4]/20 bg-black/40 px-4 py-2 backdrop-blur md:flex">
        <span className="text-[10px] tracking-[0.4em] text-[#7dffd4]">
          BATORE // {profile.name.toUpperCase()}
        </span>
        <div className="flex max-w-[70%] flex-wrap justify-end gap-x-3 gap-y-1 text-[9px] tracking-widest text-[#7dffd4]/80">
          {navItems.slice(1, 8).map((item) => (
            <a key={item.id} href={`#${item.id}`} className="hover:text-white">
              {item.label.toUpperCase()}
            </a>
          ))}
        </div>
        <Link
          href="/professional"
          className="rounded-full border border-[#ffb86b]/50 px-3 py-1 text-[10px] tracking-widest text-[#ffb86b] hover:bg-[#ffb86b]/10"
        >
          PROFESSIONAL MODE
        </Link>
      </nav>

      <header
        id="hero"
        className="relative grid min-h-screen grid-cols-1 items-center lg:grid-cols-2"
      >
        <div className="absolute inset-0 lg:relative lg:h-screen">
          <HeroScene />
        </div>
        <div className="relative z-10 px-6 pb-20 pt-28 lg:px-16">
          <p className="text-[11px] tracking-[0.5em] text-[#7dffd4]/80">
            INTERFACE 04 · CINEMATIC UPLINK
          </p>
          <h1
            className="glitch-title mt-4 text-5xl leading-none text-white md:text-7xl"
            data-text={profile.name}
          >
            {profile.name}
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#c8fff0]/80">
            {profile.tagline}
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3 text-[10px] tracking-widest">
            {[
              ["STATUS", "ONLINE"],
              ["STUDIO", "BATORE"],
              ["LOC", "CJB"],
            ].map(([k, v]) => (
              <div key={k} className="holo-panel px-3 py-3">
                <div className="text-[#7dffd4]/50">{k}</div>
                <div className="mt-1 text-white">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#about"
              className="border border-[#7dffd4] px-5 py-2 text-[11px] tracking-[0.3em] text-[#7dffd4]"
            >
              INITIALIZE BRIEFING
            </a>
            <Link
              href="/professional"
              className="border border-white/20 bg-white/5 px-5 py-2 text-[11px] tracking-[0.3em] text-white"
            >
              OPEN PROFESSIONAL FILE
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-[min(1120px,92vw)] space-y-32 pb-28">
        <motion.section
          id="about"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-10"
        >
          <SectionLabel kicker="01 · IDENTITY MATRIX" title="About Me" />
          <div className="holo-panel p-6 md:p-10">
            <p className="text-xl text-white md:text-3xl">
              <Scramble text="I talk to the business owner, model the data, build the product, and run the servers it lives on." />
            </p>
            <div className="mt-8 space-y-4 text-sm leading-7 text-[#c8fff0]/75">
              {profile.about.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>
        </motion.section>

        <section id="building">
          <SectionLabel kicker="02 · LIVE PROCESSES" title="Currently Building" />
          <div className="holo-panel overflow-hidden bg-black/50 p-0">
            <div className="flex items-center gap-2 border-b border-[#7dffd4]/20 px-4 py-2 text-[10px] text-[#7dffd4]">
              <span className="h-2 w-2 rounded-full bg-[#ff5ec8]" />
              <span className="h-2 w-2 rounded-full bg-[#ffb86b]" />
              <span className="h-2 w-2 rounded-full bg-[#7dffd4]" />
              batore@core:~ compiling
            </div>
            <div className="space-y-6 p-6 font-mono text-sm">
              {currentlyBuilding.map((item, i) => (
                <div key={item.name} className="cursor-blink">
                  <p className="text-[#7dffd4]">
                    [{i + 1}] {item.name} — {item.status}
                  </p>
                  <p className="mt-1 text-[#c8fff0]/70">{item.summary}</p>
                  <p className="mt-1 text-[11px] text-[#ffb86b]">
                    {item.stack.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects">
          <SectionLabel kicker="03 · PROJECTED ASSETS" title="Featured Projects" />
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.name}
                className="holo-panel group p-6 transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(125,255,212,0.15)]"
              >
                <p className="text-[10px] tracking-[0.35em] text-[#ffb86b]">
                  {project.type}
                </p>
                <h3 className="mt-2 text-2xl text-white">{project.name}</h3>
                <p className="mt-1 text-[#7dffd4]">{project.metric}</p>
                <p className="mt-4 text-sm leading-6 text-[#c8fff0]/70">
                  {project.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[#7dffd4]/30 px-2 py-0.5 text-[10px] tracking-widest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience">
          <SectionLabel kicker="04 · TIMELINE BEAM" title="Experience" />
          <div className="laser-line space-y-8 pl-8">
            {experience.map((job) => (
              <article key={job.org} className="relative">
                <span className="absolute -left-8 top-1 h-4 w-4 rounded-full border border-[#7dffd4] bg-[#7dffd4] shadow-[0_0_16px_#7dffd4]" />
                <p className="text-[11px] tracking-[0.3em] text-[#7dffd4]">
                  {job.period}
                </p>
                <h3 className="text-2xl text-white">
                  {job.title} · {job.org}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-[#c8fff0]/75">
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="stack">
          <SectionLabel kicker="05 · SYNAPTIC MAP" title="Tech Stack" />
          <div className="relative h-[420px] overflow-hidden rounded-[24px] border border-[#7dffd4]/20">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 420">
              {stackNodes.map((_, i) => {
                const a = (i / stackNodes.length) * Math.PI * 2;
                const x1 = 400 + Math.cos(a) * 150;
                const y1 = 210 + Math.sin(a) * 110;
                return (
                  <line
                    key={i}
                    x1="400"
                    y1="210"
                    x2={x1}
                    y2={y1}
                    stroke="rgba(125,255,212,0.25)"
                  />
                );
              })}
              <circle cx="400" cy="210" r="18" fill="#7dffd4" />
            </svg>
            {stackNodes.map((node, i) => {
              const a = (i / stackNodes.length) * Math.PI * 2;
              const x = 50 + Math.cos(a) * 38;
              const y = 50 + Math.sin(a) * 32;
              return (
                <span
                  key={node}
                  className="absolute rounded-full border border-[#7dffd4]/40 bg-black/70 px-3 py-1 text-[10px] tracking-widest"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {node}
                </span>
              );
            })}
          </div>
        </section>

        <section id="achievements">
          <SectionLabel kicker="06 · HEX METRICS" title="Achievements" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((item) => (
              <div
                key={item.label}
                className="flex aspect-square flex-col items-center justify-center border border-[#7dffd4]/30 bg-[#7dffd4]/5 text-center"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }}
              >
                <div className="text-3xl text-white">{item.value}</div>
                <div className="mt-2 max-w-[70%] text-[10px] tracking-widest text-[#7dffd4]/80">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="certs">
          <SectionLabel kicker="07 · HOLO PLAQUES" title="Certifications" />
          <div className="grid gap-6 md:grid-cols-2" style={{ perspective: 900 }}>
            {certifications.map((cert) => (
              <article key={cert.name} className="cert-plaque holo-panel p-8">
                <p className="text-[10px] tracking-[0.4em] text-[#ffb86b]">
                  CREDENTIAL
                </p>
                <h3 className="mt-3 text-2xl text-white">{cert.name}</h3>
                <p className="mt-2 text-[#7dffd4]">{cert.issuer}</p>
                <p className="mt-4 text-sm text-[#c8fff0]/70">{cert.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="cases">
          <SectionLabel kicker="08 · SCHEMATIC REVIEW" title="Case Studies" />
          <div className="space-y-6">
            {caseStudies.map((study) => (
              <article key={study.title} className="schematic holo-panel p-6 md:p-8">
                <h3 className="text-2xl text-white">{study.title}</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    ["PROBLEM", study.problem],
                    ["APPROACH", study.approach],
                    ["OUTCOME", study.outcome],
                  ].map(([label, body]) => (
                    <div key={label}>
                      <p className="text-[10px] tracking-[0.35em] text-[#7dffd4]">
                        {label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#c8fff0]/75">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="github">
          <SectionLabel kicker="09 · PULSE GRID" title="GitHub / Coding" />
          <p className="mb-6 max-w-2xl text-sm leading-7 text-[#c8fff0]/75">
            {githubHighlights.summary}
          </p>
          <div className="grid grid-cols-20 gap-1 md:grid-cols-[repeat(25,minmax(0,1fr))]">
            {githubHighlights.cells.map((v, i) => (
              <span
                key={i}
                className="heatmap-cell aspect-square rounded-[2px]"
                style={{
                  background: `rgba(125,255,212,${0.08 + v * 0.2})`,
                  boxShadow: v > 2 ? "0 0 8px rgba(125,255,212,0.5)" : undefined,
                }}
              />
            ))}
          </div>
        </section>

        <section id="education">
          <SectionLabel kicker="10 · KNOWLEDGE ORBIT" title="Education" />
          <div className="relative mx-auto flex h-72 max-w-xl items-center justify-center">
            <div
              className="absolute h-56 w-56 rounded-full border border-[#7dffd4]/30"
              style={{ animation: "spin 18s linear infinite" }}
            />
            <div
              className="absolute h-40 w-40 rounded-full border border-[#ffb86b]/30"
              style={{ animation: "spin 12s linear infinite reverse" }}
            />
            {education.map((ed) => (
              <div key={ed.school} className="holo-panel relative z-10 p-6 text-center">
                <p className="text-2xl text-white">{ed.school}</p>
                <p className="mt-2 text-[#7dffd4]">{ed.program}</p>
                <p className="mt-1 text-sm text-[#c8fff0]/70">{ed.period}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="research">
          <SectionLabel kicker="11 · ARCHIVE" title="Research & Writing" />
          <div className="grid gap-5 md:grid-cols-2">
            {research.map((paper) => (
              <article key={paper.title} className="paper-stack holo-panel p-6">
                <p className="text-[10px] tracking-[0.3em] text-[#ffb86b]">
                  {paper.venue}
                </p>
                <h3 className="mt-2 text-xl text-white">{paper.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#c8fff0]/75">
                  {paper.summary}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="testimonials">
          <SectionLabel kicker="12 · VOICE PRINTS" title="Testimonials" />
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <article key={t.name} className="holo-panel p-6">
                <div className="mb-4 flex h-10 items-end gap-1">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 flex-1 origin-bottom bg-[#7dffd4]"
                      style={{
                        animation: `waveform ${0.8 + (i % 5) * 0.15}s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`,
                        height: "100%",
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm leading-7 text-white/90">“{t.quote}”</p>
                <p className="mt-4 text-[11px] tracking-[0.25em] text-[#7dffd4]">
                  {t.name} · {t.role}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="resume">
          <SectionLabel kicker="13 · DATA CORE" title="Resume" />
          <div className="holo-panel flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
            <div>
              <p className="text-2xl text-white">Operator dossier</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#c8fff0]/75">
                The professional version is the resume-equivalent briefing. It
                is a one-way door: cinematic effects stay here.
              </p>
            </div>
            <Link
              href="/professional"
              className="border border-[#ffb86b] px-6 py-3 text-[11px] tracking-[0.35em] text-[#ffb86b]"
            >
              DEPLOY PROFESSIONAL MODE
            </Link>
          </div>
        </section>

        <section id="contact">
          <SectionLabel kicker="14 · HANDSHAKE" title="Contact" />
          <div className="holo-panel p-6">
            <div className="space-y-1 text-sm text-[#7dffd4]">
              {log.map((line, i) => (
                <p key={`${line}-${i}`}>{line}</p>
              ))}
            </div>
            <form onSubmit={onCommand} className="mt-6 flex gap-3">
              <span className="text-[#7dffd4]">{">"}</span>
              <input
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                className="flex-1 border-0 bg-transparent text-white outline-none"
                placeholder="type message / intent"
              />
            </form>
            <a
              href={`mailto:${profile.email}`}
              className="mt-6 inline-block text-[11px] tracking-[0.3em] text-[#ffb86b]"
            >
              MAIL DIRECT · {profile.email}
            </a>
          </div>
        </section>
      </main>

      <footer id="footer" className="border-t border-[#7dffd4]/15 px-6 py-6 text-[10px] tracking-[0.3em] text-[#7dffd4]/60">
        <div className="mx-auto flex w-[min(1120px,92vw)] flex-col justify-between gap-3 md:flex-row">
          <span>SYS.OK · BATORE CORE · {new Date().getFullYear()}</span>
          <span>NEURAL UPLINK IDLE · HOLOGRAM STABLE</span>
          <Link href="/professional" className="text-[#ffb86b]">
            LEAVE CINEMATIC → PROFESSIONAL
          </Link>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
