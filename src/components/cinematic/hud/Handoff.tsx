"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { hudAudio } from "@/lib/audio";
import { goProfessional, lockToProfessional } from "@/lib/mode";
import { setStore, useStore } from "@/lib/store";

/**
 * CRT power-down, then a paper-white iris, then the one-way hop to
 * /professional (location.replace: the cinematic entry leaves history).
 */
export function powerDownToProfessional() {
  hudAudio.powerDown();
  lockToProfessional();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = "position:fixed;inset:0;z-index:200;pointer-events:all;background:transparent;";
  document.body.appendChild(overlay);

  if (reduced) {
    overlay.style.background = "#f7f6f2";
    goProfessional();
    return;
  }

  const line = document.createElement("div");
  line.style.cssText =
    "position:absolute;left:0;right:0;top:50%;height:100vh;transform:translateY(-50%);background:#020409;opacity:0;";
  overlay.appendChild(line);
  const flash = document.createElement("div");
  flash.style.cssText =
    "position:absolute;left:50%;top:50%;width:100vw;height:2px;transform:translate(-50%,-50%) scaleX(1);background:#e2fbff;box-shadow:0 0 40px #4fe3ff,0 0 120px #4fe3ff;opacity:0;";
  overlay.appendChild(flash);
  const paper = document.createElement("div");
  paper.style.cssText =
    "position:absolute;left:50%;top:50%;width:12px;height:12px;border-radius:999px;transform:translate(-50%,-50%) scale(0);background:#f7f6f2;";
  overlay.appendChild(paper);
  const note = document.createElement("div");
  note.textContent = "Opening professional mode";
  note.style.cssText =
    "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:500 13px/1 system-ui,sans-serif;letter-spacing:.08em;color:#44403c;opacity:0;";
  overlay.appendChild(note);

  const root = document.getElementById("cine-root");
  const chrome = document.querySelectorAll<HTMLElement>("[data-chrome]");
  const opts = { fill: "forwards" as const, easing: "cubic-bezier(.7,0,.2,1)" };
  root?.animate(
    [
      { transform: "scale(1,1)", filter: "brightness(1)" },
      { transform: "scale(1,0.004)", filter: "brightness(3)" },
    ],
    { duration: 380, ...opts },
  );
  chrome.forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }));
  line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, ...opts });
  flash.animate(
    [
      { opacity: 0, transform: "translate(-50%,-50%) scaleX(1)" },
      { opacity: 1, transform: "translate(-50%,-50%) scaleX(1)", offset: 0.45 },
      { opacity: 1, transform: "translate(-50%,-50%) scaleX(0.002)" },
    ],
    { duration: 700, delay: 250, ...opts },
  );
  paper.animate(
    [{ transform: "translate(-50%,-50%) scale(0)" }, { transform: "translate(-50%,-50%) scale(260)" }],
    { duration: 650, delay: 900, ...opts },
  );
  note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 1350, fill: "forwards" });
  setTimeout(goProfessional, 1500);
}

export function Handoff() {
  const open = useStore((s) => s.handoff);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setStore({ handoff: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-void/70 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setStore({ handoff: false })}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="handoff-title"
            className="panel w-full max-w-[520px] p-7 sm:p-9"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 bg-amber shadow-[0_0_10px_#ffb547]" />
              <span className="hud-label !text-amber">Mode transfer · one-way door</span>
            </div>
            <h3 id="handoff-title" className="mt-5 font-display text-3xl font-semibold uppercase tracking-tight text-ice">
              Switch to professional mode?
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-ice/75">
              Professional mode is the clean, printable résumé: the same facts, without the effects. The cinematic interface shuts down
              behind you, and professional mode has no way back to it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                autoFocus
                className="btn-holo justify-center"
                data-lock="Confirm"
                onClick={() => {
                  hudAudio.confirm();
                  setStore({ handoff: false });
                  powerDownToProfessional();
                }}
              >
                Switch now ▸
              </button>
              <button type="button" className="btn-ghost justify-center" data-lock="Stay" onClick={() => setStore({ handoff: false })}>
                Stay in cinematic
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
