import { Fragment, type ReactNode } from "react";
import {
  certifications,
  coding,
  currentlyBuilding,
  education,
  experience,
  professionalOrder,
  profile,
  projects,
  sectionMeta,
  skillGroups,
  testimonials,
  writing,
  type SectionId,
} from "@/data/content";
import { CopyEmail, PrintButton, Reveal, ScrollSpyNav } from "./client";
import { PrintResume } from "./PrintResume";

/*
 * Professional mode: the résumé-equivalent. Deliberately contains no link,
 * logo or control that leads to the cinematic site.
 */

const LABEL: Partial<Record<SectionId, string>> = {
  about: "About",
  stack: "Skills",
  coding: "GitHub",
  contact: "Contact & Résumé",
};
const label = (id: SectionId) => LABEL[id] ?? sectionMeta(id).label;

function Sample() {
  return (
    <span className="ml-2 inline-flex items-center rounded-sm border border-dashed border-amber-600/50 px-1.5 py-px align-middle text-[10px] font-medium uppercase tracking-wider text-amber-700">
      Sample
    </span>
  );
}

function Section({
  id,
  children,
  sampleOnly = false,
}: {
  id: SectionId;
  children: ReactNode;
  sampleOnly?: boolean;
}) {
  return (
    <section
      id={id}
      data-sample-only={sampleOnly || undefined}
      className="scroll-mt-10 border-t border-rule pt-10 first:border-0 first:pt-0"
    >
      <Reveal>
        <h2 className="mb-6 flex items-center gap-3 font-serif text-[23px] font-semibold tracking-tight text-ink">
          <span className="h-[2px] w-5 bg-accent" aria-hidden />
          {label(id)}
        </h2>
        {children}
      </Reveal>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((p) => (
        <li
          key={p}
          className="relative pl-4 text-[15px] leading-relaxed text-body"
        >
          <span
            className="absolute left-0 top-[0.72em] h-1 w-1 rounded-full bg-muted"
            aria-hidden
          />
          {p}
        </li>
      ))}
    </ul>
  );
}

const contactLinks = [
  { k: "Email", v: profile.email, href: `mailto:${profile.email}` },
  {
    k: "LinkedIn",
    v: "linkedin.com/in/srinivaas-vaibhav",
    href: profile.linkedin,
  },
  {
    k: "GitHub",
    v: profile.github.replace("https://", ""),
    href: profile.github,
  },
  {
    k: "Studio",
    v: profile.studioUrl.replace("https://", ""),
    href: profile.studioUrl,
  },
];

function Actions({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`no-print flex gap-2 ${compact ? "" : "flex-col"}`}>
      <a
        href={profile.resumePdf}
        download
        className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-accent"
      >
        Download PDF
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M8 2v9m0 0l-3.5-3.5M8 11l3.5-3.5M3 14h10" />
        </svg>
      </a>
      <PrintButton className="inline-flex items-center justify-center rounded-md border border-rule bg-card px-4 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted">
        Print
      </PrintButton>
    </div>
  );
}

const SECTIONS: Record<SectionId, () => ReactNode> = {
  hero: () => null,
  footer: () => null,

  about: () => (
    <Section id="about">
      <div className="space-y-4 text-[15.5px] leading-[1.75] text-body">
        {profile.about.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <h3 className="mt-8 text-[12px] font-semibold uppercase tracking-wider text-muted">
        Education
      </h3>
      {education.map((e) => (
        <article
          key={e.school}
          className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
        >
          <div>
            <p className="text-[16px] font-semibold text-ink">{e.program}</p>
            <p className="text-[15px] text-body">{e.school}</p>
          </div>
          <span className="shrink-0 text-[13px] text-muted">{e.period}</span>
        </article>
      ))}
    </Section>
  ),

  experience: () => (
    <Section id="experience">
      <div className="space-y-9">
        {experience.map((job) => (
          <article key={job.org} className="avoid-break">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-[17px] font-semibold text-ink">
                {job.title} <span className="font-normal text-muted">·</span>{" "}
                {job.org}
              </h3>
              <span className="shrink-0 text-[13px] tabular-nums text-muted">
                {job.period} · {job.location}
              </span>
            </div>
            <p className="mt-1.5 text-[15px] text-muted">{job.summary}</p>
            <Bullets items={job.points} />
          </article>
        ))}
      </div>
    </Section>
  ),

  projects: () => (
    <Section id="projects">
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <article
            key={p.id}
            className="avoid-break flex flex-col rounded-lg border border-rule bg-card p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(22,24,29,0.18)]"
          >
            <div className="text-[12px] font-medium uppercase tracking-wider text-accent">
              {p.kind}
            </div>
            <h3 className="mt-1.5 text-[17px] font-semibold text-ink">
              {p.name}
            </h3>
            <div className="text-[12.5px] text-muted">{p.role}</div>
            <p className="mt-3 text-[14.5px] leading-relaxed text-body">
              {p.summary}
            </p>
            <ul className="mt-3 space-y-1">
              {p.highlights.map((h) => (
                <li key={h} className="relative pl-4 text-[13.5px] text-body">
                  <span
                    className="absolute left-0 top-[0.65em] h-1 w-1 rounded-full bg-accent"
                    aria-hidden
                  />
                  {h}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  ),

  building: () => (
    <Section id="building">
      <div className="divide-y divide-rule">
        {currentlyBuilding.map((b) => (
          <article
            key={b.name}
            className="avoid-break py-4 first:pt-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-[16px] font-semibold text-ink">{b.name}</h3>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent">
                {b.status}
              </span>
            </div>
            <p className="mt-1.5 text-[15px] leading-relaxed text-body">
              {b.summary}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">
              {b.stack.join(" · ")}
            </p>
            {b.note && (
              <p className="mt-1 text-[13px] italic text-muted">{b.note}</p>
            )}
          </article>
        ))}
      </div>
    </Section>
  ),

  stack: () => (
    <Section id="stack">
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {skillGroups.map((g) => (
          <div key={g.label} className="avoid-break">
            <dt className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              {g.label}
            </dt>
            <dd className="mt-1 text-[15px] leading-relaxed text-ink">
              {g.items.join(", ")}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  ),

  certifications: () => (
    <Section
      id="certifications"
      sampleOnly={certifications.every((c) => c.sample)}
    >
      <ul className="divide-y divide-rule rounded-lg border border-rule bg-card">
        {certifications.map((c) => (
          <li
            key={c.name}
            data-sample={c.sample || undefined}
            className="flex items-center justify-between gap-4 px-5 py-3.5"
          >
            <span className="text-[15px] text-ink">
              {c.name}
              {c.sample && <Sample />}
            </span>
            <span className="text-[13px] text-muted">
              {c.issuer}
              {c.year !== "—" ? ` · ${c.year}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  ),

  coding: () => (
    <Section id="coding">
      <p className="text-[15.5px] leading-relaxed text-body">
        {coding.summary}
      </p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">
            Focus areas
          </h3>
          <Bullets items={coding.focus} />
        </div>
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">
            Languages
          </h3>
          <ul className="mt-3 space-y-1.5">
            {coding.languages.map((l) => (
              <li
                key={l.name}
                className="flex justify-between gap-4 text-[14.5px]"
              >
                <span className="font-medium text-ink">{l.name}</span>
                <span className="text-right text-muted">{l.usedFor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <a
        href={profile.github}
        target="_blank"
        rel="noreferrer"
        className="pro-link mt-5 inline-block text-[14.5px]"
      >
        {profile.github.replace("https://", "")} ↗
      </a>
    </Section>
  ),

  writing: () => (
    <Section id="writing" sampleOnly={writing.every((w) => w.sample)}>
      <div className="space-y-5">
        {writing.map((w) => (
          <article
            key={w.title}
            data-sample={w.sample || undefined}
            className="avoid-break"
          >
            <h3 className="text-[16px] font-semibold text-ink">
              {w.title}
              {w.sample && <Sample />}
            </h3>
            <p className="text-[13px] text-muted">{w.kind}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-body">
              {w.abstract}
            </p>
          </article>
        ))}
      </div>
    </Section>
  ),

  testimonials: () => (
    <Section id="testimonials" sampleOnly={testimonials.every((t) => t.sample)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {testimonials.map((t) => (
          <figure
            key={t.name + t.role}
            data-sample={t.sample || undefined}
            className="rounded-lg border border-rule bg-card p-5"
          >
            <blockquote className="font-serif text-[16px] leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-3 text-[13px] text-muted">
              <span className="font-medium text-body">{t.name}</span> · {t.role}
              {t.sample && <Sample />}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  ),

  contact: () => (
    <Section id="contact">
      <p className="text-[15.5px] leading-relaxed text-body">
        The fastest way to reach me is email. I&apos;m based in{" "}
        {profile.location} (IST, UTC+5:30).
      </p>
      <ul className="mt-5 divide-y divide-rule rounded-lg border border-rule bg-card">
        {contactLinks.map((c) => (
          <li
            key={c.k}
            className="flex items-center justify-between gap-4 px-5 py-3.5"
          >
            <span className="text-[13px] font-medium text-muted">{c.k}</span>
            <span className="flex items-center gap-3">
              <a
                href={c.href}
                className="pro-link text-[15px]"
                {...(c.k === "Email"
                  ? {}
                  : { target: "_blank", rel: "noreferrer" })}
              >
                {c.v}
              </a>
              {c.k === "Email" && (
                <CopyEmail
                  email={profile.email}
                  className="no-print text-[12px] font-medium text-muted hover:text-ink"
                />
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="no-print mt-5 flex flex-col gap-5 rounded-lg border border-rule bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15.5px] font-medium text-ink">
            This page is the résumé.
          </p>
          <p className="mt-1 text-[14px] text-muted">
            Download the PDF or print this page: both give a clean two-page
            résumé.
          </p>
        </div>
        <Actions compact />
      </div>
    </Section>
  ),
};

export function ProfessionalPage() {
  const navItems = professionalOrder.map((id) => ({ id, label: label(id) }));

  return (
    <>
      <PrintResume />
      <div className="no-print mx-auto flex max-w-[1180px] gap-14 px-5 sm:px-8 lg:px-10">
        {/* sidebar */}
        <aside className="no-print sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col justify-between py-14 lg:flex">
          <div>
            <p className="font-serif text-[20px] font-semibold leading-tight text-ink">
              {profile.name}
            </p>
            <p className="mt-1 text-[13px] text-muted">{profile.role}</p>
            <div className="mt-8">
              <ScrollSpyNav items={navItems} />
            </div>
          </div>
          <div className="space-y-4">
            <Actions />
            <p className="text-[12px] text-muted">Updated October 2026</p>
          </div>
        </aside>

        <main className="print-main min-w-0 max-w-[760px] flex-1 py-12 lg:py-16">
          <header className="mb-14">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent">
              {profile.role} · {profile.studio}
            </p>
            <h1 className="mt-3 font-serif text-[clamp(38px,6vw,58px)] font-semibold leading-[1.05] tracking-tight text-ink">
              {profile.name}
            </h1>
            <p className="mt-4 max-w-[640px] font-serif text-[20px] leading-snug text-body">
              {profile.tagline}
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
              <li className="text-muted">{profile.location}</li>
              {contactLinks.slice(0, 3).map((c) => (
                <li key={c.k}>
                  <a
                    href={c.href}
                    className="pro-link"
                    {...(c.k === "Email"
                      ? {}
                      : { target: "_blank", rel: "noreferrer" })}
                  >
                    {c.v}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-7 lg:hidden">
              <Actions compact />
            </div>
          </header>

          <div className="space-y-12">
            {professionalOrder.map((id) => (
              <Fragment key={id}>{SECTIONS[id]()}</Fragment>
            ))}
          </div>

          <footer className="mt-16 flex flex-col gap-2 border-t border-rule pt-6 text-[12.5px] text-muted sm:flex-row sm:justify-between">
            <span>
              © {new Date().getFullYear()} {profile.name} · {profile.city},
              India
            </span>
            <span>Updated October 2026</span>
          </footer>
        </main>
      </div>
    </>
  );
}
