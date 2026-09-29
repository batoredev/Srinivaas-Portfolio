/**
 * Single source of truth for both modes.
 *
 * Everything the cinematic and professional sites say comes from this file.
 * Items marked `sample: true` are illustrative placeholders (certifications,
 * testimonials, write-ups). They render with a small "sample" tag until you
 * replace them with real entries and delete the flag.
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
    "My most mature product is Perfect Study Space, a management platform used by around 2,000 students across multiple branches. It handles memberships, food passes, attendance, WhatsApp integration, cashback and referral analytics, with about 90 backend actions over 25+ tables. I've also built Harmony Living, a resident management system for a 72-unit apartment community, and a lead management system for Alpenglow Global, a travel agency. As part of a four-person team, I helped ship Cue Court Coffee, a sports facility booking app. For that project I handled production debugging of revenue reporting and a full production-readiness review.",
    "On the product side, I'm building Bites by Batore, a hyperlocal daily discovery app for Coimbatore. It runs on FastAPI, PostGIS and pgvector, Redis, and React Native. The app follows a strict no-scraping policy, and every extracted place goes through human review.",
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
    name: "Bites by Batore",
    status: "In development",
    summary:
      "A hyperlocal daily discovery app for Coimbatore. Strict no-scraping policy: every extracted place goes through human review before anyone sees it.",
    stack: ["FastAPI", "PostGIS", "pgvector", "Redis", "React Native"],
    log: [
      "policy.scraping ............ disabled (by design)",
      "postgis  » spatial index on places.geom",
      "pgvector » embedding place descriptions",
      "review   » human approval required per place",
      "redis    » caching today's picks",
      "expo     » building the React Native client",
    ],
  },
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

export type Project = {
  id: "pss" | "harmony" | "alpenglow" | "cuecourt";
  name: string;
  kind: string;
  role: string;
  headline: string;
  summary: string;
  highlights: string[];
  metrics: { value: number; prefix?: string; suffix?: string; label: string }[];
  stack: string[];
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
  },
  {
    id: "harmony",
    name: "Harmony Living",
    kind: "Resident management system",
    role: "Founder · sole developer",
    headline: "One system for a 72-unit apartment community.",
    summary:
      "A resident management system for a 72-unit apartment community, built end to end from schema to production.",
    highlights: ["Resident records", "Community operations", "Built schema → production"],
    metrics: [{ value: 72, label: "apartment units" }],
    stack: ["PostgreSQL", "Node", "React"],
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
  {
    id: "cuecourt",
    name: "Cue Court Coffee",
    kind: "Sports facility booking app",
    role: "Engineer · four-person team",
    headline: "Bookings for a sports facility, production-ready.",
    summary:
      "A sports facility booking app shipped by a four-person team. I handled production debugging of revenue reporting and a full production-readiness review.",
    highlights: [
      "Production debugging of revenue reporting",
      "Full production-readiness review",
      "Shipped with a team of four",
    ],
    metrics: [{ value: 4, label: "person team" }],
    stack: ["Bookings", "Revenue reporting", "Production review"],
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
      "Delivered Harmony Living (resident management, 72-unit community) and a lead management system for Alpenglow Global (travel).",
      "Building Bites by Batore, a hyperlocal discovery app on FastAPI, PostGIS, pgvector, Redis and React Native.",
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
  { lane: 0, kind: "feat", scope: "harmony", message: "resident management · 72 units", detail: "Harmony Living, apartment community platform." },
  { lane: 0, kind: "feat", scope: "alpenglow", message: "lead management system", detail: "Alpenglow Global, travel agency." },
  { lane: 2, kind: "fix", scope: "cue-court", message: "revenue reporting in production", detail: "Cue Court Coffee, four-person team.", branchStart: true },
  { lane: 2, kind: "chore", scope: "cue-court", message: "production-readiness review", detail: "Full review before launch." },
  { lane: 0, kind: "merge", message: "ship Cue Court Coffee", detail: "Sports facility booking app.", mergeFrom: 2 },
  { lane: 0, kind: "refactor", scope: "infra", message: "managed Supabase → self-hosted VPS", detail: "PostgreSQL 16, per-project schemas, Caddy, Cloudflare Tunnel." },
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
  { value: 72, prefix: "", suffix: "", label: "apartment units on Harmony Living", unit: "UNITS" },
  { value: 31, prefix: "", suffix: "", label: "agents in the Claude Code workflow", unit: "AGENTS" },
  { value: 4, prefix: "", suffix: "", label: "production systems shipped", unit: "SYSTEMS" },
];

export const certifications = [
  { name: "Database Management Systems", issuer: "NPTEL", year: "—", sample: true },
  { name: "Docker & Containers Fundamentals", issuer: "Add issuer", year: "—", sample: true },
  { name: "Cloud / DevOps certification", issuer: "Add issuer", year: "—", sample: true },
];

export type CaseStudy = {
  id: string;
  title: string;
  status: string;
  problem: string;
  approach: string[];
  outcome: string;
  surface: { label: string; value: string }[];
  blueprint: { nodes: { id: string; label: string; x: number; y: number }[]; edges: [string, string][] };
};

export const caseStudies: CaseStudy[] = [
  {
    id: "pss",
    title: "Perfect Study Space",
    status: "In production",
    problem:
      "A study space with multiple branches was running memberships, food, attendance and referrals across disconnected tools, so staff and owners never had one view of the business.",
    approach: [
      "Sat with the owner to map how each branch actually runs.",
      "Modelled it as 25+ tables with about 90 backend actions.",
      "Integrated WhatsApp and built cashback and referral analytics into the same console.",
    ],
    outcome: "One platform, used by around 2,000 students across branches.",
    surface: [
      { label: "Students", value: "~2,000" },
      { label: "Backend actions", value: "~90" },
      { label: "Tables", value: "25+" },
      { label: "Branches", value: "Multi" },
    ],
    blueprint: {
      nodes: [
        { id: "app", label: "Staff & student apps", x: 12, y: 22 },
        { id: "wa", label: "WhatsApp", x: 12, y: 72 },
        { id: "api", label: "~90 actions API", x: 44, y: 46 },
        { id: "db", label: "Postgres · 25+ tables", x: 78, y: 24 },
        { id: "an", label: "Cashback & referral analytics", x: 78, y: 74 },
      ],
      edges: [["app", "api"], ["wa", "api"], ["api", "db"], ["api", "an"], ["db", "an"]],
    },
  },
  {
    id: "bites",
    title: "Bites by Batore",
    status: "In development",
    problem:
      "Local discovery in Coimbatore is noisy, and the usual shortcut, scraping the open web, produces stale and untrustworthy listings.",
    approach: [
      "A strict no-scraping policy from day one.",
      "Every extracted place goes through human review before it is published.",
      "FastAPI with PostGIS for geo queries, pgvector for semantic search and Redis for daily picks, with a React Native client.",
    ],
    outcome: "In development, designed for trust first and scale second.",
    surface: [
      { label: "Scraping", value: "None" },
      { label: "Human review", value: "Every place" },
      { label: "Geo", value: "PostGIS" },
      { label: "Search", value: "pgvector" },
    ],
    blueprint: {
      nodes: [
        { id: "rn", label: "React Native app", x: 12, y: 46 },
        { id: "api", label: "FastAPI", x: 40, y: 46 },
        { id: "rev", label: "Human review queue", x: 40, y: 82 },
        { id: "pg", label: "PostGIS + pgvector", x: 76, y: 24 },
        { id: "redis", label: "Redis · daily picks", x: 76, y: 70 },
      ],
      edges: [["rn", "api"], ["api", "pg"], ["api", "redis"], ["rev", "pg"], ["api", "rev"]],
    },
  },
  {
    id: "infra",
    title: "Owning the infrastructure",
    status: "Migration in progress",
    problem:
      "Managed backends are quick to start with, but they cost control and create lock-in once several client products depend on them.",
    approach: [
      "One PostgreSQL 16 cluster with a schema per project.",
      "Node/Express services in containers, MinIO for object storage.",
      "Caddy for TLS and Cloudflare Tunnel so no inbound ports are open. Hardened from the ground up.",
    ],
    outcome: "In progress: moving Batore's projects off managed Supabase, one schema at a time.",
    surface: [
      { label: "Postgres", value: "16" },
      { label: "Schemas", value: "Per project" },
      { label: "Open ports", value: "0 inbound" },
      { label: "TLS", value: "Caddy" },
    ],
    blueprint: {
      nodes: [
        { id: "cf", label: "Cloudflare Tunnel", x: 10, y: 46 },
        { id: "caddy", label: "Caddy", x: 34, y: 46 },
        { id: "api", label: "Node/Express containers", x: 60, y: 22 },
        { id: "minio", label: "MinIO", x: 60, y: 76 },
        { id: "pg", label: "Postgres 16 · schema/project", x: 86, y: 46 },
      ],
      edges: [["cf", "caddy"], ["caddy", "api"], ["caddy", "minio"], ["api", "pg"], ["api", "minio"]],
    },
  },
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
      "A third, shorter line works well here, for example from someone at Cue Court Coffee about the production-readiness review.",
    name: "Collaborator",
    role: "Cue Court Coffee",
    sample: true,
  },
];

/**
 * The cinematic mode is told as a story: the lifecycle of a model named
 * Srinivaas, from boot to shutdown. Order here is the order on screen; each
 * chapter opens with a narrator line (typed, and spoken if sound is on).
 */
export const sections = [
  { id: "hero", label: "Hero", code: "00", chapter: "Boot", narration: "" },
  { id: "about", label: "About Me", code: "01", chapter: "Identity", narration: "Subject located. Before the systems, meet the person who builds them." },
  { id: "education", label: "Education", code: "02", chapter: "Training", narration: "Every model starts with training. This one is still running." },
  { id: "stack", label: "Tech Stack", code: "03", chapter: "Weights", narration: "Training leaves weights behind. These are the ones he reaches for." },
  { id: "certifications", label: "Certifications", code: "04", chapter: "Validation", narration: "Weights need checking. Here is what gets verified." },
  { id: "experience", label: "Experience", code: "05", chapter: "Deployment", narration: "Then came production, where software meets real businesses." },
  { id: "projects", label: "Featured Projects", code: "06", chapter: "Inference", narration: "In production, a model is judged by its outputs. These are his." },
  { id: "cases", label: "Case Studies", code: "07", chapter: "Interpretability", narration: "Outputs are easy to show. Here is how the decisions were made." },
  { id: "achievements", label: "Achievements", code: "08", chapter: "Evaluation", narration: "Every run ends with an evaluation. These numbers came back from production." },
  { id: "coding", label: "GitHub / Coding", code: "09", chapter: "Open weights", narration: "Don't take the model's word for it. Read the source." },
  { id: "writing", label: "Research & Writing", code: "10", chapter: "Papers", narration: "Some of the work is thinking out loud." },
  { id: "testimonials", label: "Testimonials", code: "11", chapter: "Human feedback", narration: "The strongest signal still comes from the humans in the loop." },
  { id: "building", label: "Currently Building", code: "12", chapter: "Next epoch", narration: "Training never really ends. This is what is running right now." },
  { id: "resume", label: "Resume", code: "13", chapter: "Model card", narration: "Everything so far, compressed into one page." },
  { id: "contact", label: "Contact", code: "14", chapter: "Handshake", narration: "Your turn. Send a prompt." },
  { id: "footer", label: "Footer", code: "15", chapter: "Shutdown", narration: "" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export const sectionMeta = (id: SectionId) => sections.find((s) => s.id === id)!;

/** Recruiter-friendly order for the professional résumé. */
export const professionalOrder: SectionId[] = [
  "about",
  "experience",
  "projects",
  "building",
  "stack",
  "achievements",
  "cases",
  "education",
  "certifications",
  "coding",
  "writing",
  "testimonials",
  "resume",
  "contact",
];
