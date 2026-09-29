"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { profile } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { SectionTitle } from "../ui/SectionTitle";

const HandCanvas = dynamic(() => import("../three/RoboticHand"), { ssr: false });

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group block border-b border-holo/20 pb-2 transition-colors focus-within:border-amber">
      <span className="font-mono text-[10.5px] tracking-[0.25em] text-holo/60 group-focus-within:text-amber">&gt; {label}</span>
      {children}
    </label>
  );
}

export function Contact() {
  const [contact, setContact] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    hudAudio.confirm();
    const subject = `Hello from ${form.name || "your portfolio"}`;
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ""}`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const channels: { k: string; v: string; href: string }[] = [
    { k: "LinkedIn", v: "in/srinivaas-vaibhav", href: profile.linkedin },
    { k: "GitHub", v: profile.github.replace("https://", ""), href: profile.github },
    { k: "Studio", v: profile.studioUrl.replace("https://", ""), href: profile.studioUrl },
  ];

  return (
    <section id="contact" data-section="contact" className="section overflow-hidden">
      <div className="container-hud">
        <SectionTitle id="contact" title="Contact" wordplay="Make first contact." effect="lock" />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <p className="text-[17px] leading-relaxed text-ice/80">
              Building something a business will run on? Hiring an engineer who owns it end to end? Send a transmission. It lands in my inbox.
            </p>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form key="form" onSubmit={submit} className="mt-10 space-y-7" exit={{ opacity: 0, y: -20 }}>
                  <Field label="NAME">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-2 w-full bg-transparent font-display text-[20px] text-ice outline-none placeholder:text-ice/20"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="EMAIL">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-2 w-full bg-transparent font-display text-[20px] text-ice outline-none placeholder:text-ice/20"
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="MESSAGE">
                    <textarea
                      required
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="mt-2 w-full resize-none bg-transparent text-[16px] leading-relaxed text-ice outline-none placeholder:text-ice/20"
                      placeholder="What are we building?"
                    />
                  </Field>
                  <button type="submit" className="btn-holo" data-lock="Transmit">
                    Transmit ▸
                  </button>
                </motion.form>
              ) : (
                <motion.div key="sent" className="panel mt-10 p-7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="relative mb-5 h-16 overflow-hidden">
                    <motion.span
                      className="absolute bottom-0 left-1/2 w-[3px] -translate-x-1/2 bg-gradient-to-t from-amber to-transparent shadow-[0_0_20px_#ffb547]"
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="hud-label !text-mint">● Transmission handed to your mail client</div>
                  <p className="mt-3 text-[15px] text-ice/80">
                    If nothing opened, write to <span className="text-amber">{profile.email}</span> directly.
                  </p>
                  <button type="button" className="mt-5 font-mono text-[11px] tracking-[0.2em] text-holo hover:text-ice" onClick={() => setSent(false)}>
                    ◂ NEW TRANSMISSION
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-holo/10 pb-3">
                <span className="hud-label">Email</span>
                <span className="flex items-center gap-3">
                  <a href={`mailto:${profile.email}`} className="text-[15px] text-ice hover:text-amber">
                    {profile.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(profile.email);
                      hudAudio.tick();
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    }}
                    className="font-mono text-[10px] tracking-[0.2em] text-holo hover:text-ice"
                    data-lock="Copy email"
                  >
                    {copied ? "COPIED ✓" : "COPY"}
                  </button>
                </span>
              </div>
              {channels.map((c) => (
                <a key={c.k} href={c.href} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 border-b border-holo/10 pb-3">
                  <span className="hud-label">{c.k}</span>
                  <span className="text-[15px] text-ice transition-colors group-hover:text-amber">{c.v} ↗</span>
                </a>
              ))}
            </div>
          </div>

          <div className="relative h-[420px] sm:h-[520px] lg:col-span-7 lg:h-[640px]">
            <HandCanvas
              onContact={() => {
                hudAudio.confirm();
                setContact(true);
              }}
            />
            <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 sm:left-6">
              <span className={contact ? "live-dot" : "h-[7px] w-[7px] rounded-full bg-amber animate-pulse-dot"} />
              <span className={`hud-label ${contact ? "!text-mint" : ""}`}>
                {contact ? "Contact established" : "Reach out · touch the fingertip"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
