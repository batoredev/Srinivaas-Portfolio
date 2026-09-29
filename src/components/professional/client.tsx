"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades content in once as it enters the viewport (no-op for reduced motion). */
export function Reveal({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "li" | "article" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}

export function PrintButton({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {children}
    </button>
  );
}

export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void navigator.clipboard?.writeText(email);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      aria-label={`Copy ${email}`}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/** Sidebar navigation that highlights the section in view. */
export function ScrollSpyNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label="Résumé sections">
      <ul className="space-y-0.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "true" : undefined}
              className={`group flex items-center gap-3 py-1 text-[13.5px] transition-colors ${active === i.id ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              <span className={`h-px transition-all duration-300 ${active === i.id ? "w-6 bg-accent" : "w-3 bg-rule group-hover:w-5 group-hover:bg-muted"}`} />
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
