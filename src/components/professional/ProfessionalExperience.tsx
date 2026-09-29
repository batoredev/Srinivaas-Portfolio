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

function Heading({ children }: { children: string }) {
  return (
    <h2 className="pro-serif mt-14 border-b border-stone-300 pb-2 text-xl font-semibold tracking-tight text-stone-900">
      {children}
    </h2>
  );
}

export function ProfessionalExperience() {
  return (
    <div className="professional-root min-h-screen">
      <div className="no-print mx-auto flex w-[min(860px,92vw)] items-center justify-between pt-6 text-sm text-stone-500">
        <span>Srinivaas · Batore</span>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded border border-stone-300 px-3 py-1 text-stone-700"
        >
          Print / Save PDF
        </button>
      </div>

      <article className="mx-auto w-[min(860px,92vw)] py-10">
        <header className="border-b border-stone-300 pb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-teal-900">
            {profile.role} · {profile.studio}
          </p>
          <h1 className="pro-serif mt-2 text-4xl text-stone-900 md:text-5xl">
            {profile.fullName}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-stone-600">
            {profile.tagline}
          </p>
          <p className="mt-4 text-sm text-stone-500">
            {profile.location}
            <span className="mx-2">·</span>
            <a className="underline decoration-stone-300" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </p>
        </header>

        <nav className="no-print mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-teal-900">
          {navItems
            .filter((item) => item.id !== "hero")
            .map((item) => (
              <a key={item.id} href={`#pro-${item.id}`} className="hover:underline">
                {item.label}
              </a>
            ))}
        </nav>

        <section id="pro-about">
          <Heading>About Me</Heading>
          <p className="mt-4 text-[15px] leading-7 text-stone-700">{profile.shortBio}</p>
          <div className="mt-4 space-y-3 text-[15px] leading-7 text-stone-700">
            {profile.about.slice(1).map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        </section>

        <section id="pro-building">
          <Heading>Currently Building</Heading>
          <ul className="mt-4 space-y-4">
            {currentlyBuilding.map((item) => (
              <li key={item.name}>
                <p className="font-medium text-stone-900">
                  {item.name}{" "}
                  <span className="font-normal text-stone-500">· {item.status}</span>
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{item.summary}</p>
                <p className="mt-1 text-xs text-stone-500">{item.stack.join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="pro-projects">
          <Heading>Featured Projects</Heading>
          <ul className="mt-4 space-y-5">
            {projects.map((project) => (
              <li key={project.name}>
                <p className="font-medium text-stone-900">
                  {project.name}{" "}
                  <span className="font-normal text-stone-500">
                    · {project.type} · {project.metric}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{project.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="pro-experience">
          <Heading>Experience</Heading>
          {experience.map((job) => (
            <div key={job.org} className="mt-4">
              <p className="font-medium text-stone-900">
                {job.title}, {job.org}{" "}
                <span className="font-normal text-stone-500">· {job.period}</span>
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone-600">
                {job.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="pro-stack">
          <Heading>Tech Stack</Heading>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            {Object.entries(techStack).map(([key, values]) => (
              <div key={key}>
                <dt className="capitalize text-stone-500">{key}</dt>
                <dd className="mt-1 text-stone-800">{values.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="pro-achievements">
          <Heading>Achievements</Heading>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {achievements.map((item) => (
              <li key={item.label} className="border border-stone-200 bg-white/50 px-4 py-3">
                <p className="text-lg text-stone-900">{item.value}</p>
                <p className="text-sm text-stone-600">{item.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="pro-certs">
          <Heading>Certifications</Heading>
          {certifications.map((cert) => (
            <p key={cert.name} className="mt-4 text-sm leading-6 text-stone-700">
              <span className="font-medium text-stone-900">{cert.name}</span> · {cert.issuer}.{" "}
              {cert.note}
            </p>
          ))}
        </section>

        <section id="pro-cases">
          <Heading>Case Studies</Heading>
          {caseStudies.map((study) => (
            <div key={study.title} className="mt-5">
              <p className="font-medium text-stone-900">{study.title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                <span className="font-medium text-stone-800">Problem. </span>
                {study.problem}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                <span className="font-medium text-stone-800">Approach. </span>
                {study.approach}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                <span className="font-medium text-stone-800">Outcome. </span>
                {study.outcome}
              </p>
            </div>
          ))}
        </section>

        <section id="pro-github">
          <Heading>GitHub / Coding</Heading>
          <p className="mt-4 text-sm leading-6 text-stone-600">{githubHighlights.summary}</p>
        </section>

        <section id="pro-education">
          <Heading>Education</Heading>
          {education.map((ed) => (
            <p key={ed.school} className="mt-4 text-sm leading-6 text-stone-700">
              <span className="font-medium text-stone-900">{ed.program}</span>, {ed.school} ·{" "}
              {ed.period}. {ed.note}
            </p>
          ))}
        </section>

        <section id="pro-research">
          <Heading>Research & Writing</Heading>
          {research.map((paper) => (
            <div key={paper.title} className="mt-4">
              <p className="font-medium text-stone-900">{paper.title}</p>
              <p className="text-xs text-stone-500">{paper.venue}</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">{paper.summary}</p>
            </div>
          ))}
        </section>

        <section id="pro-testimonials">
          <Heading>Testimonials</Heading>
          {testimonials.map((t) => (
            <blockquote key={t.name} className="mt-4 border-l-2 border-teal-900 pl-4">
              <p className="text-sm leading-7 text-stone-700">“{t.quote}”</p>
              <footer className="mt-2 text-xs text-stone-500">
                {t.name}, {t.role}
              </footer>
            </blockquote>
          ))}
        </section>

        <section id="pro-resume">
          <Heading>Resume</Heading>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            This page is the resume-equivalent document. Use Print / Save PDF in the
            header to export a clean copy for interviewers.
          </p>
        </section>

        <section id="pro-contact">
          <Heading>Contact</Heading>
          <p className="mt-4 text-sm leading-7 text-stone-700">
            Email{" "}
            <a className="underline" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            . Based in {profile.location}.
          </p>
        </section>

        <footer className="mt-16 border-t border-stone-300 py-8 text-xs text-stone-500">
          {profile.studio}, {profile.location}. © {new Date().getFullYear()} {profile.name}.
        </footer>
      </article>
    </div>
  );
}
