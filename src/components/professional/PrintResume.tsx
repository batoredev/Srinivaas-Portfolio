import { certifications, currentlyBuilding, education, experience, profile, projects, skillGroups } from "@/data/content";

/**
 * Paper-only résumé (hidden on screen). Used by Print and by
 * scripts/generate-resume-pdf.mjs. Sample placeholders are never included.
 */
function H({ children }: { children: string }) {
  return (
    <h2 className="mb-[5pt] mt-[13pt] border-b border-[#d9d6ce] pb-[3pt] font-serif text-[11.5pt] font-semibold uppercase tracking-[0.08em] text-[#1f4b6e]">
      {children}
    </h2>
  );
}

export function PrintResume() {
  const certs = certifications.filter((c) => !c.sample);
  const links = [profile.email, profile.linkedin.replace("https://www.", ""), profile.github.replace("https://", ""), profile.studioUrl.replace("https://", "")];

  return (
    <article className="print-only text-[9.6pt] leading-[1.42] text-[#23262c]">
      <header className="flex items-end justify-between gap-6 border-b-2 border-[#16181d] pb-[8pt]">
        <div>
          <h1 className="font-serif text-[23pt] font-semibold leading-none text-[#16181d]">{profile.name}</h1>
          <p className="mt-[4pt] text-[10.5pt] font-medium text-[#1f4b6e]">
            {profile.role} · {profile.studio}
          </p>
          <p className="text-[9pt] text-[#5b5f68]">{profile.location}</p>
        </div>
        <ul className="text-right text-[8.8pt] leading-[1.5] text-[#3b3f47]">
          {links.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </header>

      <H>Summary</H>
      <p>
        {profile.about[0]} Most mature product: Perfect Study Space, used by around 2,000 students across multiple branches. Currently building
        Bites by Batore and moving the studio onto self-hosted infrastructure, alongside an Integrated M.Tech in CS/IT at VIT.
      </p>

      <H>Experience</H>
      {experience.map((job) => (
        <div key={job.org} className="avoid-break mb-[7pt]">
          <div className="flex justify-between gap-4">
            <p className="font-semibold text-[#16181d]">
              {job.title} — {job.org}
              <span className="font-normal text-[#5b5f68]">, {job.location}</span>
            </p>
            <p className="shrink-0 text-[#5b5f68]">{job.period}</p>
          </div>
          <ul className="mt-[2pt] list-disc pl-[12pt] marker:text-[#8a8e96]">
            {job.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ))}

      <H>Selected projects</H>
      <ul className="space-y-[4pt]">
        {projects.map((p) => (
          <li key={p.id} className="avoid-break">
            <span className="font-semibold text-[#16181d]">{p.name}</span>
            <span className="text-[#5b5f68]"> — {p.kind} · {p.role}. </span>
            {p.summary}
          </li>
        ))}
      </ul>

      <H>Currently building</H>
      <ul className="space-y-[4pt]">
        {currentlyBuilding.map((b) => (
          <li key={b.name} className="avoid-break">
            <span className="font-semibold text-[#16181d]">{b.name}</span>
            <span className="text-[#5b5f68]"> ({b.status.toLowerCase()}). </span>
            {b.summary} <span className="text-[#5b5f68]">{b.stack.join(", ")}.</span>
          </li>
        ))}
      </ul>

      <H>Skills</H>
      <dl className="grid grid-cols-[112pt_1fr] gap-x-[8pt] gap-y-[2pt]">
        {skillGroups.map((g) => (
          <div key={g.label} className="contents">
            <dt className="font-semibold text-[#16181d]">{g.label}</dt>
            <dd>{g.items.join(", ")}</dd>
          </div>
        ))}
      </dl>

      <H>Education</H>
      {education.map((e) => (
        <div key={e.school} className="flex justify-between gap-4">
          <p>
            <span className="font-semibold text-[#16181d]">{e.program}</span> — {e.school}
          </p>
          <p className="shrink-0 text-[#5b5f68]">{e.period}</p>
        </div>
      ))}

      {certs.length > 0 && (
        <>
          <H>Certifications</H>
          <ul>
            {certs.map((c) => (
              <li key={c.name}>
                <span className="font-semibold text-[#16181d]">{c.name}</span> — {c.issuer}
                {c.year !== "—" ? `, ${c.year}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
