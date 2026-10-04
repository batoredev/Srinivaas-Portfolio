"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { sections, type SectionId } from "@/data/content";
import { setStore, useStore } from "@/lib/store";
import { BootSequence } from "./hud/BootSequence";
import { Handoff } from "./hud/Handoff";
import { Hud, SectionRail } from "./hud/Hud";
import { Reticle } from "./hud/Reticle";
import { registerLenis } from "./scroll";
import { Chapter } from "./ui/Chapter";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Building } from "./sections/Building";
import { Projects } from "./sections/Projects";
import { Experience } from "./sections/Experience";
import { Stack } from "./sections/Stack";
import { Achievements } from "./sections/Achievements";
import { Certifications } from "./sections/Certifications";
import { CaseStudies } from "./sections/CaseStudies";
import { Coding } from "./sections/Coding";
import { Education } from "./sections/Education";
import { Writing } from "./sections/Writing";
import { Testimonials } from "./sections/Testimonials";
import { Resume } from "./sections/Resume";
import { Contact } from "./sections/Contact";
import { Footer } from "./sections/Footer";

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

function useActiveSection() {
  useEffect(() => {
    // chapter cards count too: the HUD switches as soon as the narrator opens a chapter
    const els = sections
      .flatMap((s) => [document.getElementById(`chapter-${s.id}`), document.getElementById(s.id)])
      .filter(Boolean) as HTMLElement[];
    const visited = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            const id = e.target.id.replace(/^chapter-/, "") as SectionId;
            visited.add(id);
            setStore({ active: id, visited: visited.size });
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
        <div className="atmos" />
        <div className="atmos-grid" />
        <main id="cine-root" className="relative z-[1] origin-center">
          <Hero />
          <Chapter id="about" />
          <About />
          <Chapter id="education" />
          <Education />
          <Chapter id="stack" />
          <Stack />
          <Chapter id="certifications" />
          <Certifications />
          <Chapter id="experience" />
          <Experience />
          <Chapter id="projects" />
          <Projects />
          <Chapter id="cases" />
          <CaseStudies />
          <Chapter id="achievements" />
          <Achievements />
          <Chapter id="coding" />
          <Coding />
          <Chapter id="writing" />
          <Writing />
          <Chapter id="testimonials" />
          <Testimonials />
          <Chapter id="building" />
          <Building />
          <Chapter id="resume" />
          <Resume />
          <Chapter id="contact" />
          <Contact />
          <Footer />
        </main>
        <div data-chrome>
          <Hud />
          <SectionRail />
        </div>
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
