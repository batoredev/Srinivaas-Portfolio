/**
 * Single source of truth for both modes.
 *
 * Everything the cinematic and professional sites say comes from this file.
 * Items marked `sample: true` are illustrative placeholders (certifications,
 * testimonials, write-ups). Their sections stay hidden in both modes until at
 * least one real entry exists; add one and the chapter appears on its own.
 */

export const profile = {
  name: "Srinivaas Vaibhav",
  firstName: "Srinivaas",
  lastName: "Vaibhav",
  initials: "SV",
  role: "Founder & Full-Stack Developer",
  studio: "Batore",
  studioUrl: "https://batore.pages.dev",
  location: "Coimbatore, Tamil Nadu, India",
  city: "Coimbatore",
  timezone: "Asia/Kolkata",
  email: "batore.dev@gmail.com",
  linkedin: "https://www.linkedin.com/in/srinivaas-vaibhav/",
  github: "https://github.com/batoredev",
  resumePdf: "/Srinivaas-Vaibhav-Resume.pdf",
  tagline:
    "Founder & developer at Batore. I build software that local businesses actually run on.",
  shortBio:
    "I'm Srinivaas, founder and sole developer of Batore, a software studio based in Coimbatore. I design and build custom management systems for local businesses and ship my own consumer products, taking each one from database schema to production infrastructure. I'm also pursuing an Integrated M.Tech in CS/IT at VIT.",
  about: [
    "I'm Srinivaas, a full-stack developer and the founder of Batore, a software solutions studio in Coimbatore, Tamil Nadu. I work end to end. I talk to the business owner, model the data, build the product, and run the servers it lives on.",
    "My most mature product is Perfect Study Space, a management platform used by around 2,000 students across multiple branches. It handles memberships, food passes, attendance, WhatsApp integration, cashback and referral analytics, with about 90 backend actions over 25+ tables. I've also built a lead management system for Alpenglow Global, a travel agency.",
    "On the product side, I'm building Bites by Batore, a hyperlocal daily discovery app for Coimbatore on FastAPI, PostGIS, pgvector, Redis and React Native, where every extracted place goes through human review and nothing is scraped. I also built OurGlass, the studio's AI personal assistant: you talk to it naturally and it turns the conversation into commitments, people, projects and reminders, with no forms to fill.",
    "I care about owning the infrastructure as well as the code. I'm moving Batore's projects off managed Supabase onto a self-hosted VPS stack: PostgreSQL 16 with per-project schemas, Node/Express containers, MinIO, Caddy and Cloudflare Tunnel, all hardened from the ground up. I also build developer tooling around AI-assisted engineering. That includes BatoreCode, a self-hosted AI coding environment with multi-provider failover, and a 31-agent Claude Code \"operating system\" that gives every Batore project the same build, review and ship workflow.",
    "Alongside all this, I'm completing an Integrated M.Tech in CS/IT at VIT.",
  ],
  /** The four verbs of the end-to-end loop, used by both modes. */
  loop: [
    { verb: "Talk", detail: "to the business owner" },
    { verb: "Model", detail: "the data" },
    { verb: "Build", detail: "the product" },
    { verb: "Run", detail: "the servers it lives on" },
  ],
};

export type Building = {
  name: string;
  status: string;
  summary: string;
  stack: string[];
  log: string[];
  note?: string;
};

export const currentlyBuilding: Building[] = [
  {
    name: "Self-hosted Batore stack",
    status: "Migration in progress",
    summary:
      "Moving every Batore project off managed Supabase onto a hardened VPS: one PostgreSQL 16 cluster with per-project schemas, containerised APIs, object storage and zero open inbound ports.",
    stack: ["PostgreSQL 16", "Node/Express", "Docker", "MinIO", "Caddy", "Cloudflare Tunnel"],
    log: [
      "postgres » CREATE SCHEMA per project",
      "docker   » node/express containers up",
      "minio    » buckets migrated from managed storage",
      "caddy    » automatic TLS, reverse proxy",
      "cloudflared » tunnel established, no open ports",
      "hardening » firewall, least-privilege roles",
    ],
  },
  {
    name: "BatoreCode",
    status: "Internal tooling",
    summary:
      "A self-hosted AI coding environment with multi-provider failover, so the studio's engineering never stalls on one model vendor.",
    stack: ["Self-hosted", "Multi-provider LLMs", "Failover routing"],
    log: [
      "router   » provider A healthy",
      "router   » provider B standing by",
      "failover » automatic on timeout / 5xx",
      "session  » workspace mounted",
    ],
  },
  {
    name: "Agent OS",
    status: "Experimental",
    summary:
      "A 31-agent Claude Code \"operating system\" that gives every Batore project the same build, review and ship workflow.",
    stack: ["Claude Code", "31 agents", "Build · Review · Ship"],
    log: [
      "agents   » 31 registered",
      "pipeline » build → review → ship",
      "status   » not yet battle-tested in production",
    ],
    note: "Kept modest on purpose: it hasn't been battle-tested in production yet.",
  },
];

/** Architecture drawing revealed by the X-ray lens in the cinematic Projects section. */
export type Blueprint = {
  nodes: { id: string; label: string; x: number; y: number }[];
  edges: [string, string][];
};

export type Project = {
  id: "pss" | "alpenglow" | "bites" | "ourglass";
  name: string;
  kind: string;
  role: string;
  headline: string;
  summary: string;
  highlights: string[];
  metrics: { value: number; prefix?: string; suffix?: string; label: string }[];
  stack: string[];
  blueprint?: Blueprint;
};

export const projects: Project[] = [
  {
    id: "pss",
    name: "Perfect Study Space",
    kind: "Multi-branch management platform",
    role: "Founder · sole developer",
    headline: "The operating console for a multi-branch study space.",
    summary:
      "A management platform used by around 2,000 students across multiple branches. Memberships, food passes, attendance, WhatsApp integration, cashback and referral analytics in one system.",
    highlights: [
      "Memberships, food passes and attendance",
      "WhatsApp integration",
      "Cashback & referral analytics",
      "~90 backend actions over 25+ tables",
    ],
    metrics: [
      { value: 2000, prefix: "~", label: "students" },
      { value: 90, prefix: "~", label: "backend actions" },
      { value: 25, suffix: "+", label: "tables" },
    ],
    stack: ["PostgreSQL", "Node", "React", "WhatsApp API"],
    blueprint: {
      nodes: [
        { id: "app", label: "Staff & student apps", x: 18, y: 22 },
        { id: "wa", label: "WhatsApp", x: 14, y: 72 },
        { id: "api", label: "~90 actions API", x: 46, y: 47 },
        { id: "db", label: "Postgres · 25+ tables", x: 78, y: 24 },
        { id: "an", label: "Referral analytics", x: 80, y: 72 },
      ],
      edges: [["app", "api"], ["wa", "api"], ["api", "db"], ["api", "an"], ["db", "an"]],
    },
  },
  {
    id: "bites",
    name: "Bites by Batore",
    kind: "Hyperlocal discovery app",
    role: "Founder · in development",
    headline: "Coimbatore's daily picks, checked by a human.",
    summary:
      "A hyperlocal daily discovery app for Coimbatore. Strict no-scraping policy: every extracted place goes through human review before anyone sees it.",
    highlights: [
      "No scraping, by design",
      "Human review for every place",
      "PostGIS geo queries and pgvector search",
      "Redis-cached daily picks, React Native client",
    ],
    metrics: [
      { value: 100, suffix: "%", label: "places human-reviewed" },
      { value: 0, label: "scraped listings" },
    ],
    stack: ["FastAPI", "PostGIS", "pgvector", "Redis", "React Native"],
    blueprint: {
      nodes: [
        { id: "rn", label: "React Native app", x: 16, y: 46 },
        { id: "api", label: "FastAPI", x: 44, y: 46 },
        { id: "rev", label: "Human review queue", x: 44, y: 82 },
        { id: "pg", label: "PostGIS + pgvector", x: 78, y: 24 },
        { id: "redis", label: "Redis · daily picks", x: 78, y: 70 },
      ],
      edges: [["rn", "api"], ["api", "pg"], ["api", "redis"], ["rev", "pg"], ["api", "rev"]],
    },
  },
  {
    id: "ourglass",
    name: "OurGlass",
    kind: "AI personal assistant",
    role: "Founder · internal tool",
    headline: "Talk naturally. It keeps track.",
    summary:
      "Batore's AI personal assistant. You talk to it the way you'd talk to a person, and it turns the conversation into structured commitments, people, projects and reminders, with no forms or task lists to maintain.",
    highlights: [
      "Conversation in, commitments and reminders out",
      "Claude → Gemini → local Qwen fallback chain",
      "Postgres 17 + pgvector for state and memory",
      "Every turn can be undone; it asks instead of guessing",
    ],
    metrics: [
      { value: 0, label: "forms to fill" },
      { value: 3, label: "AI providers" },
      { value: 99, label: "eval fixtures" },
    ],
    stack: ["Next.js 16", "TypeScript", "Postgres 17", "pgvector", "Claude · Gemini · Qwen"],
    blueprint: {
      nodes: [
        { id: "chat", label: "Conversation", x: 14, y: 46 },
        { id: "orc", label: "Orchestrator · tools", x: 44, y: 46 },
        { id: "ai", label: "Claude → Gemini → Qwen", x: 44, y: 14 },
        { id: "db", label: "Postgres + pgvector", x: 80, y: 30 },
        { id: "rem", label: "Reminder poller", x: 78, y: 76 },
      ],
      edges: [["chat", "orc"], ["orc", "ai"], ["orc", "db"], ["db", "rem"], ["rem", "chat"]],
    },
  },
  {
    id: "alpenglow",
    name: "Alpenglow Global",
    kind: "Lead management system",
    role: "Founder · sole developer",
    headline: "Lead management for a travel agency.",
    summary:
      "A lead management system for Alpenglow Global, a travel agency: capturing enquiries and keeping every follow-up in one place.",
    highlights: ["Lead capture", "Follow-up workflow", "Travel agency operations"],
    metrics: [{ value: 1, label: "travel agency" }],
    stack: ["PostgreSQL", "Node", "React"],
  },
];

export const experience = [
  {
    org: "Batore",
    title: "Founder & Full-Stack Developer",
    period: "Present",
    location: "Coimbatore, India",
    summary:
      "Software solutions studio. I design, build and run custom management systems for local businesses and ship the studio's own products.",
    points: [
      "Built Perfect Study Space end to end: a multi-branch platform used by ~2,000 students, with ~90 backend actions over 25+ tables.",
      "Delivered a lead management system for Alpenglow Global, a travel agency.",
      "Building Bites by Batore, a hyperlocal discovery app on FastAPI, PostGIS, pgvector, Redis and React Native.",
      "Built OurGlass, the studio's AI personal assistant: conversation in, commitments and reminders out, with a Claude → Gemini → local fallback chain.",
      "Migrating studio projects from managed Supabase to a hardened self-hosted VPS stack (PostgreSQL 16, Docker, MinIO, Caddy, Cloudflare Tunnel).",
      "Built BatoreCode, a self-hosted AI coding environment with multi-provider failover, and a 31-agent Claude Code workflow.",
    ],
  },
  {
    org: "Cue Court Coffee",
    title: "Engineer · Four-person team",
    period: "Shipped",
    location: "Coimbatore, India",
    summary: "Sports facility booking app.",
    points: [
      "Debugged revenue reporting in production.",
      "Ran a full production-readiness review before launch.",
    ],
  },
];

/** Commit graph for the cinematic Experience section (git log --graph). */
export type Commit = {
  lane: 0 | 1 | 2;
  message: string;
  scope?: string;
  detail: string;
  kind: "init" | "feat" | "fix" | "chore" | "refactor" | "merge" | "wip";
  branchStart?: boolean;
  mergeFrom?: 1 | 2;
  tag?: string;
};

export const commits: Commit[] = [
  { lane: 0, kind: "init", message: "init Batore", detail: "Software studio, Coimbatore. Founder & sole developer.", tag: "v0.1" },
  { lane: 1, kind: "feat", scope: "pss", message: "memberships, food passes, attendance", detail: "Multi-branch operations for a study space.", branchStart: true },
  { lane: 1, kind: "feat", scope: "pss", message: "WhatsApp + cashback & referral analytics", detail: "~90 backend actions over 25+ tables." },
  { lane: 0, kind: "merge", message: "ship Perfect Study Space", detail: "Used by ~2,000 students across branches.", mergeFrom: 1, tag: "prod" },
  { lane: 0, kind: "feat", scope: "alpenglow", message: "lead management system", detail: "Alpenglow Global, travel agency." },
  { lane: 2, kind: "fix", scope: "cue-court", message: "revenue reporting in production", detail: "Cue Court Coffee, four-person team.", branchStart: true },
  { lane: 2, kind: "chore", scope: "cue-court", message: "production-readiness review", detail: "Full review before launch." },
  { lane: 0, kind: "merge", message: "ship Cue Court Coffee", detail: "Sports facility booking app.", mergeFrom: 2 },
  { lane: 0, kind: "refactor", scope: "infra", message: "managed Supabase → self-hosted VPS", detail: "PostgreSQL 16, per-project schemas, Caddy, Cloudflare Tunnel." },
  { lane: 0, kind: "feat", scope: "ourglass", message: "AI personal assistant", detail: "OurGlass: talk naturally, it keeps track." },
  { lane: 0, kind: "wip", scope: "bites", message: "hyperlocal discovery for Coimbatore", detail: "Bites by Batore, in development.", tag: "HEAD" },
];

/** Tech stack as a feed-forward network: each layer feeds the next. */
export const stackLayers = [
  { name: "Languages", role: "input", nodes: ["TypeScript", "JavaScript", "Python", "SQL"] },
  { name: "Frameworks", role: "hidden", nodes: ["React", "Next.js", "React Native", "Node / Express", "FastAPI"] },
  { name: "Data", role: "hidden", nodes: ["PostgreSQL 16", "PostGIS", "pgvector", "Redis", "MinIO"] },
  { name: "Infra", role: "hidden", nodes: ["Docker", "Caddy", "Cloudflare Tunnel", "Linux VPS"] },
  { name: "Ships", role: "output", nodes: ["Web platforms", "Mobile apps", "AI tooling", "Infrastructure"] },
] as const;

export const skillGroups = [
  { label: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL"] },
  { label: "Frontend & mobile", items: ["React", "Next.js", "React Native"] },
  { label: "Backend", items: ["Node.js / Express", "FastAPI", "REST APIs", "WhatsApp integration"] },
  { label: "Data", items: ["PostgreSQL 16", "PostGIS", "pgvector", "Redis", "Schema design"] },
  { label: "Infrastructure", items: ["Docker", "Linux VPS", "Caddy", "MinIO", "Cloudflare Tunnel", "Server hardening"] },
  { label: "AI engineering", items: ["Claude Code agents", "Multi-provider LLM failover", "Vector search"] },
];

export const achievements = [
  { value: 2000, prefix: "~", suffix: "", label: "students on Perfect Study Space", unit: "USERS" },
  { value: 90, prefix: "~", suffix: "", label: "backend actions in one product", unit: "ACTIONS" },
  { value: 25, prefix: "", suffix: "+", label: "tables in a production schema", unit: "TABLES" },
  { value: 31, prefix: "", suffix: "", label: "agents in the Claude Code workflow", unit: "AGENTS" },
];

export const certifications = [
  { name: "Database Management Systems", issuer: "NPTEL", year: "—", sample: true },
  { name: "Docker & Containers Fundamentals", issuer: "Add issuer", year: "—", sample: true },
  { name: "Cloud / DevOps certification", issuer: "Add issuer", year: "—", sample: true },
];

export const coding = {
  summary:
    "Most of my production work lives in private client repositories, so the public graph tells only part of the story. What it does show: a bias for shipping end to end, from schema migrations to server configs.",
  focus: [
    "Full-stack product engineering (TypeScript, Python)",
    "PostgreSQL schema design, PostGIS and pgvector",
    "Self-hosted infrastructure and hardening",
    "AI-assisted engineering workflows",
  ],
  languages: [
    { name: "TypeScript", usedFor: "web platforms, APIs, tooling" },
    { name: "Python", usedFor: "FastAPI services, data pipelines" },
    { name: "SQL", usedFor: "schemas, migrations, analytics" },
    { name: "JavaScript", usedFor: "React Native, Node services" },
    { name: "Shell", usedFor: "servers, deploys, hardening" },
  ],
};

export const education = [
  {
    school: "Vellore Institute of Technology (VIT)",
    short: "VIT",
    program: "Integrated M.Tech, Computer Science / Information Technology",
    period: "In progress",
    note: "Studying alongside running Batore.",
  },
];

export const writing = [
  {
    title: "No scraping: building local discovery on human review",
    kind: "Engineering note",
    abstract:
      "Why Bites by Batore refuses to scrape, and how a human review step on every extracted place trades raw scale for trust in a hyperlocal product.",
    tags: ["product", "data quality", "PostGIS"],
    sample: true,
  },
  {
    title: "One Postgres, many products: per-project schemas on a self-hosted VPS",
    kind: "Infrastructure write-up",
    abstract:
      "Notes from moving a studio's projects off managed Supabase: PostgreSQL 16 with a schema per project, MinIO, Caddy and Cloudflare Tunnel, hardened from the ground up.",
    tags: ["postgres", "self-hosting", "security"],
    sample: true,
  },
  {
    title: "A 31-agent workflow for AI-assisted engineering",
    kind: "Working notes",
    abstract:
      "Designing a Claude Code \"operating system\" so every project gets the same build, review and ship loop, and what still has to be proven in production.",
    tags: ["AI agents", "developer tooling"],
    sample: true,
  },
];

export const testimonials = [
  {
    quote:
      "Replace this with a real quote from a business owner you've built for, with their permission. One or two sentences on what changed for them works best.",
    name: "Client name",
    role: "Business owner · Coimbatore",
    sample: true,
  },
  {
    quote:
      "A second voice: an operations lead or teammate talking about reliability, reporting, or how the team actually uses the software every day.",
    name: "Teammate or client",
    role: "Operations lead",
    sample: true,
  },
  {
    quote:
      "A third, shorter line works well here, for example from a teammate about reliability or a production-readiness review.",
    name: "Collaborator",
    role: "Teammate",
    sample: true,
  },
];

const hasReal = (items: readonly { sample?: boolean }[]) => items.some((i) => !i.sample);

/**
 * The cinematic mode is told as a story: the lifecycle of a model named
 * Srinivaas, from boot to shutdown. Order here is the order on screen; each
 * chapter opens with a narrator line (typed, and spoken if sound is on).
 * Chapters with a `when` condition only appear once they have a real
 * (non-sample) entry, and chapter numbers close up around them.
 */
const storyline = [
  { id: "hero", label: "Hero", chapter: "Boot", narration: "" },
  { id: "about", label: "About Me", chapter: "Identity", narration: "Meet the person behind the systems." },
  { id: "stack", label: "Tech Stack", chapter: "Weights", narration: "The tools he reaches for." },
  { id: "certifications", label: "Certifications", chapter: "Validation", narration: "Weights need checking.", when: hasReal(certifications) },
  { id: "experience", label: "Experience", chapter: "Deployment", narration: "Then came production." },
  { id: "projects", label: "Featured Projects", chapter: "Inference", narration: "Judge a model by its outputs." },
  { id: "coding", label: "GitHub / Coding", chapter: "Open weights", narration: "Don't trust it. Read the source." },
  { id: "writing", label: "Research & Writing", chapter: "Papers", narration: "Some of the work is thinking out loud.", when: hasReal(writing) },
  { id: "building", label: "Currently Building", chapter: "Next epoch", narration: "Training never ends. Here's what's running." },
  { id: "testimonials", label: "Testimonials", chapter: "Human feedback", narration: "The humans in the loop.", when: hasReal(testimonials) },
  { id: "contact", label: "Contact", chapter: "Handshake", narration: "Your turn. Send a prompt." },
  { id: "footer", label: "Footer", chapter: "Shutdown", narration: "" },
] as const;

export type SectionId = (typeof storyline)[number]["id"];

export type Section = { id: SectionId; label: string; chapter: string; narration: string; code: string };

export const sections: Section[] = storyline
  .filter((s) => !("when" in s) || s.when)
  .map((s, i) => ({ id: s.id, label: s.label, chapter: s.chapter, narration: s.narration, code: String(i).padStart(2, "0") }));

const fallback = (id: SectionId): Section => {
  const s = storyline.find((x) => x.id === id)!;
  return { id: s.id, label: s.label, chapter: s.chapter, narration: s.narration, code: "--" };
};

export const sectionMeta = (id: SectionId) => sections.find((s) => s.id === id) ?? fallback(id);

/** Recruiter-friendly order for the professional résumé. */
export const professionalOrder: SectionId[] = (
  ["about", "experience", "projects", "building", "stack", "certifications", "coding", "writing", "testimonials", "contact"] as const
).filter((id) => sections.some((s) => s.id === id));
