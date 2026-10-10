"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { coding, currentlyBuilding, profile, projects, skillGroups } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { useSeen } from "@/lib/hooks";
import { setStore } from "@/lib/store";
import { scrollToSection } from "../scroll";
import { SectionTitle } from "../ui/SectionTitle";

const SkylineCanvas = dynamic(() => import("../three/Skyline"), { ssr: false });

type Line = { kind: "in" | "out" | "err" | "ok"; body: ReactNode };

const GH_USER = profile.github.split("/").filter(Boolean).pop() ?? "";

function neofetch(): Line[] {
  return [
    {
      kind: "out",
      body: (
        <div className="grid grid-cols-[auto_1fr] gap-x-5 py-1">
          <pre className="leading-[1.2] text-amber">{`  ╱‾‾‾‾╲\n ╱  SV  ╲\n ╲      ╱\n  ╲____╱`}</pre>
          <div>
            <div>
              <span className="text-amber">srinivaas</span>
              <span className="text-fog">@</span>
              <span className="text-holo">batore</span>
            </div>
            <div className="text-fog">─────────────────</div>
            <div>
              <span className="text-holo">role</span> {profile.role}
            </div>
            <div>
              <span className="text-holo">base</span> {profile.location}
            </div>
            <div>
              <span className="text-holo">shell</span> end-to-end (schema → server)
            </div>
            <div>
              <span className="text-holo">uptime</span> building since day one
            </div>
          </div>
        </div>
      ),
    },
    { kind: "ok", body: "Type `help` to explore. Try `sudo hire srinivaas`." },
  ];
}

export function Coding() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [hover, setHover] = useState<string | null>(null);
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -20% 0px");
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (!seen || booted.current) return;
    booted.current = true;
    setLines([{ kind: "in", body: "neofetch" }, ...neofetch()]);
  }, [seen]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const print = (...l: Line[]) => setLines((prev) => [...prev, ...l]);

  const run = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    hudAudio.tick();
    setHistory((h) => [cmd, ...h].slice(0, 30));
    setHIdx(-1);
    print({ kind: "in", body: cmd });
    const c = cmd.toLowerCase();
    if (c === "help") {
      print({
        kind: "out",
        body: (
          <div className="grid grid-cols-[150px_1fr] gap-y-0.5">
            {[
              ["whoami", "who is behind the interface"],
              ["ls projects", "shipped systems"],
              ["ls building", "what is running now"],
              ["cat stack", "tools by layer"],
              ["repos", "live public repos from GitHub"],
              ["github", "open the GitHub profile"],
              ["contact", "ways to reach him"],
              ["sudo hire srinivaas", "you know what this does"],
              ["professional", "switch to professional mode"],
              ["clear", "clear the terminal"],
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <span className="text-amber">{k}</span>
                <span className="text-ice/70">{v}</span>
              </div>
            ))}
          </div>
        ),
      });
    } else if (c === "whoami") {
      print({ kind: "out", body: `${profile.name} · ${profile.role}, ${profile.studio} (${profile.city}). ${profile.tagline.split(". ")[1]}` });
    } else if (c === "ls projects" || c === "ls") {
      print(...projects.map((p) => ({ kind: "out" as const, body: <span><span className="text-holo">{p.id.padEnd(10, " ")}</span> {p.name} <span className="text-fog">· {p.kind}</span></span> })));
    } else if (c === "ls building") {
      print(...currentlyBuilding.map((b) => ({ kind: "out" as const, body: <span><span className="text-mint">●</span> {b.name} <span className="text-fog">· {b.status}</span></span> })));
    } else if (c === "cat stack") {
      print(...skillGroups.map((g) => ({ kind: "out" as const, body: <span><span className="text-amber">{g.label}:</span> {g.items.join(", ")}</span> })));
    } else if (c === "repos") {
      print({ kind: "ok", body: `fetching api.github.com/users/${GH_USER}/repos …` });
      try {
        const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=6`);
        if (!res.ok) throw new Error(String(res.status));
        const repos: { name: string; description: string | null; language: string | null; html_url: string }[] = await res.json();
        if (!repos.length) print({ kind: "out", body: "No public repositories yet. Most client work is private." });
        else
          print(
            ...repos.map((r) => ({
              kind: "out" as const,
              body: (
                <a href={r.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                  <span className="text-holo">{r.name}</span> <span className="text-fog">{r.language ? `[${r.language}]` : ""} {r.description ?? ""}</span>
                </a>
              ),
            })),
          );
      } catch {
        print({ kind: "err", body: "GitHub API unreachable right now. Try `github` to open the profile." });
      }
    } else if (c === "github") {
      window.open(profile.github, "_blank", "noopener,noreferrer");
      print({ kind: "ok", body: `opened ${profile.github}` });
    } else if (c === "contact") {
      print({ kind: "out", body: <span>email <span className="text-holo">{profile.email}</span> · linkedin <span className="text-holo">{profile.linkedin.replace("https://www.", "")}</span></span> });
    } else if (c.startsWith("sudo hire")) {
      print({ kind: "ok", body: "[sudo] permission granted. Routing you to the handshake…" });
      setTimeout(() => scrollToSection("contact"), 900);
    } else if (c === "sudo" || c.startsWith("sudo ")) {
      print({ kind: "err", body: "Nice try. Only one sudo command works here." });
    } else if (c === "professional") {
      setStore({ handoff: true });
    } else if (c === "clear") {
      setLines([]);
    } else if (c === "rm -rf /" || c.startsWith("rm ")) {
      print({ kind: "err", body: "Refusing. These servers are self-hosted and I like them." });
    } else {
      print({ kind: "err", body: `command not found: ${cmd}. Type \`help\`.` });
    }
  };

  return (
    <section id="coding" data-section="coding" className="section">
      <div className="container-hud">
        <SectionTitle id="coding" title="GitHub / Coding" wordplay="Read the diff." effect="prompt" />
        <p className="mt-6 max-w-[680px] text-[16px] leading-relaxed text-ice/70">{coding.summary}</p>

        <div ref={ref} className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* terminal */}
          <div className="panel flex h-[440px] flex-col" onClick={() => inputRef.current?.focus()}>
            <div className="flex items-center justify-between border-b border-holo/15 px-4 py-2.5">
              <span className="font-mono text-[11px] text-ice/80">srinivaas@batore: ~</span>
              <span className="hud-label">interactive · type help</span>
            </div>
            <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed" data-lenis-prevent>
              {lines.map((l, i) => (
                <div key={i} className={l.kind === "err" ? "text-alert" : l.kind === "ok" ? "text-mint" : "text-ice/85"}>
                  {l.kind === "in" ? (
                    <span>
                      <span className="text-mint">➜</span> <span className="text-holo">~</span> <span className="text-ice">{l.body}</span>
                    </span>
                  ) : (
                    l.body
                  )}
                </div>
              ))}
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(input);
                  setInput("");
                }}
              >
                <span className="text-mint">➜</span>
                <span className="text-holo">~</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" && history.length) {
                      e.preventDefault();
                      const n = Math.min(history.length - 1, hIdx + 1);
                      setHIdx(n);
                      setInput(history[n]);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      const n = hIdx - 1;
                      setHIdx(n);
                      setInput(n >= 0 ? history[n] : "");
                    }
                  }}
                  aria-label="Terminal input"
                  className="flex-1 bg-transparent text-ice caret-amber outline-none"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="help"
                />
              </form>
            </div>
          </div>

          {/* skyline */}
          <div className="panel relative h-[440px] overflow-hidden">
            <SkylineCanvas onHover={setHover} />
            <div className="pointer-events-none absolute left-4 top-3">
              <div className="hud-label">Activity skyline · 26 weeks</div>
              <div className="mt-1 font-mono text-[10px] text-fog">illustrative pattern · most work lives in private repos</div>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[11px] text-amber">{hover ?? "hover a tower"}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="panel p-6 lg:col-span-2">
            <div className="hud-label">Languages · where they earn their keep</div>
            <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {coding.languages.map((l) => (
                <li key={l.name} className="flex items-baseline justify-between gap-4 border-b border-holo/10 pb-2">
                  <span className="font-display text-[16px] font-semibold uppercase tracking-wide text-ice">{l.name}</span>
                  <span className="text-right text-[13px] text-fog">{l.usedFor}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel flex flex-col justify-between p-6">
            <div>
              <div className="hud-label">Focus</div>
              <ul className="mt-4 space-y-2">
                {coding.focus.map((f) => (
                  <li key={f} className="flex gap-3 text-[13.5px] text-ice/80">
                    <span className="mt-2 h-1 w-3 shrink-0 bg-amber" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <a href={profile.github} target="_blank" rel="noreferrer" className="btn-ghost mt-6 justify-center" data-lock="Open GitHub">
              github.com/{GH_USER} ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
