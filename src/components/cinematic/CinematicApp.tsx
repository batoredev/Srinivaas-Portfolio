"use client";

import dynamic from "next/dynamic";
import { ReactLenis, useLenis } from "lenis/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Fragment, useEffect, useState, type ComponentType } from "react";
import { sections, type SectionId } from "@/data/content";
import { setStore, useStore } from "@/lib/store";
import { BootSequence } from "./hud/BootSequence";
import { Handoff } from "./hud/Handoff";
import { Hud, SectionRail } from "./hud/Hud";
import { Reticle } from "./hud/Reticle";
import { RetrainFx } from "./hud/Retrain";
import { ArModal } from "./ar/ArModal";
import { registerLenis } from "./scroll";
import { Chapter } from "./ui/Chapter";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Building } from "./sections/Building";
import { Projects } from "./sections/Projects";
import { Experience } from "./sections/Experience";
import { Stack } from "./sections/Stack";
import { Certifications } from "./sections/Certifications";
import { Coding } from "./sections/Coding";
import { Writing } from "./sections/Writing";
import { Testimonials } from "./sections/Testimonials";
import { Contact } from "./sections/Contact";
import { Footer } from "./sections/Footer";
import { Prologue } from "./sections/Prologue";

const CoreWorld = dynamic(() => import("./three/CoreWorld"), { ssr: false });

const SECTION: Record<SectionId, ComponentType> = {
  hero: Hero,
  about: About,
  stack: Stack,
  certifications: Certifications,
  experience: Experience,
  projects: Projects,
  coding: Coding,
  writing: Writing,
  building: Building,
  testimonials: Testimonials,
  contact: Contact,
  footer: Footer,
};

function LenisBridge() {
  const lenis = useLenis();
  const engaged = useStore((s) => s.engaged);
  useEffect(() => {
    registerLenis(lenis ?? null);
    return () => registerLenis(null);
  }, [lenis]);
  useEffect(() => {
    if (!lenis) return;
    if (engaged) lenis.start();
    else lenis.stop();
  }, [lenis, engaged]);
  return null;
}

/**
 * Guided glide: if a visitor lands and doesn't touch anything, the page drifts
 * slowly through the prologue on its own. Any wheel, touch, key or click
 * hands control straight back. Once per session, never with reduced motion.
 */
function GuidedGlide() {
  const lenis = useLenis();
  const engaged = useStore((s) => s.engaged);
  const [gliding, setGliding] = useState(false);
  useEffect(() => {
    if (!lenis || !engaged) return;
    let done = false;
    try {
      done = sessionStorage.getItem("sv_glided") === "1";
    } catch {
      /* private mode */
    }
    if (done || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let active = false;
    const stop = () => {
      if (active) lenis.scrollTo(window.scrollY, { immediate: true });
      active = false;
      setGliding(false);
      clearTimeout(timer);
      remove();
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    const remove = () => events.forEach((e) => window.removeEventListener(e, stop));
    events.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    const timer = setTimeout(() => {
      const end = document.getElementById("prologue");
      if (!end || window.scrollY > 10) return stop();
      try {
        sessionStorage.setItem("sv_glided", "1");
      } catch {
        /* private mode */
      }
      active = true;
      setGliding(true);
      const target = end.offsetTop + end.offsetHeight - window.innerHeight;
      lenis.scrollTo(target, { duration: 24, easing: (t) => t, onComplete: stop });
    }, 6000);
    return () => {
      clearTimeout(timer);
      remove();
    };
  }, [lenis, engaged]);
  return (
    <AnimatePresence>
      {gliding && (
        <motion.div
          className="pointer-events-none fixed bottom-14 left-1/2 z-[72] -translate-x-1/2 border border-holo/20 bg-void/70 px-4 py-2 font-mono text-[10.5px] tracking-[0.25em] text-holo-soft backdrop-blur-md"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          AUTO-GLIDE · SCROLL TO TAKE CONTROL
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useActiveSection() {
  useEffect(() => {
    // chapter cards count too: the HUD switches as soon as the narrator opens a chapter
    const els = [
      document.getElementById("prologue"),
      ...sections.flatMap((s) => [document.getElementById(`chapter-${s.id}`), document.getElementById(s.id)]),
    ].filter(Boolean) as HTMLElement[];
    const visited = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            if (e.target.id === "prologue") {
              setStore({ active: "hero", prologue: true });
              continue;
            }
            const id = e.target.id.replace(/^chapter-/, "") as SectionId;
            visited.add(id);
            setStore({ active: id, prologue: false, visited: visited.size });
          }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export function CinematicApp() {
  const engaged = useStore((s) => s.engaged);
  const [skipBoot, setSkipBoot] = useState<boolean | null>(null);
  const [bootDone, setBootDone] = useState(false);

  useActiveSection();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    let seen = false;
    try {
      seen = sessionStorage.getItem("sv_engaged") === "1";
    } catch {
      /* private mode */
    }
    // Reading sessionStorage is only possible after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSkipBoot(seen);
    if (seen) {
      window.scrollTo(0, 0);
      setStore({ engaged: true });
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = engaged ? "" : "hidden";
  }, [engaged]);

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true }}>
        <LenisBridge />
        <GuidedGlide />
        <div className="atmos" />
        <CoreWorld />
        <div className="atmos-glow" />
        <div className="atmos-grid" />
        <main id="cine-root" className="relative z-[1] origin-center">
          {sections.map(({ id }) => {
            const Section = SECTION[id];
            // every chapter but the first and the last opens with a narrator card
            return (
              <Fragment key={id}>
                {id !== "hero" && id !== "footer" && <Chapter id={id} />}
                <Section />
                {id === "hero" && <Prologue />}
              </Fragment>
            );
          })}
        </main>
        <div data-chrome>
          <Hud />
          <SectionRail />
        </div>
        <RetrainFx />
        <ArModal />
        <Reticle />
        <Handoff />
        {skipBoot === false && !bootDone && <BootSequence onDone={() => setBootDone(true)} />}
        {skipBoot === null && <div className="fixed inset-0 z-[80] bg-void" />}
        <div className="atmos-vignette" />
        <div className="atmos-scan" />
        <div className="atmos-noise" />
      </ReactLenis>
    </MotionConfig>
  );
}
