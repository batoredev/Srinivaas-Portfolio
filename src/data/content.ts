export const profile = {
  name: "Srinivaas",
  fullName: "Srinivaas",
  role: "Founder & Developer",
  studio: "Batore",
  location: "Coimbatore, Tamil Nadu",
  tagline:
    "Founder & developer at Batore. I build software that local businesses actually run on.",
  shortBio:
    "I'm Srinivaas, founder and sole developer of Batore, a software studio based in Coimbatore. I design and build custom management systems for local businesses and ship my own consumer products, taking each one from database schema to production infrastructure. I'm also pursuing an Integrated M.Tech in CS/IT at VIT.",
  about: [
    "I'm Srinivaas, a full-stack developer and the founder of Batore, a software solutions studio in Coimbatore, Tamil Nadu. I work end to end. I talk to the business owner, model the data, build the product, and run the servers it lives on.",
    "My most mature product is Perfect Study Space, a management platform used by around 2,000 students across multiple branches. It handles memberships, food passes, attendance, WhatsApp integration, cashback and referral analytics, with about 90 backend actions over 25+ tables. I've also built Harmony Living, a resident management system for a 72-unit apartment community, and a lead management system for Alpenglow Global, a travel agency. As part of a four-person team, I helped ship Cue Court Coffee, a sports facility booking app. For that project I handled production debugging of revenue reporting and a full production-readiness review.",
    "On the product side, I'm building Bites by Batore, a hyperlocal daily discovery app for Coimbatore. It runs on FastAPI, PostGIS and pgvector, Redis, and React Native. The app follows a strict no-scraping policy, and every extracted place goes through human review.",
    "I care about owning the infrastructure as well as the code. I'm moving Batore's projects off managed Supabase onto a self-hosted VPS stack: PostgreSQL 16 with per-project schemas, Node/Express containers, MinIO, Caddy and Cloudflare Tunnel, all hardened from the ground up. I also build developer tooling around AI-assisted engineering. That includes BatoreCode, a self-hosted AI coding environment with multi-provider failover, and a 31-agent Claude Code operating system that gives every Batore project the same build, review and ship workflow.",
    "Alongside all this, I'm completing an Integrated M.Tech in CS/IT at VIT.",
  ],
  email: "hello@batore.dev",
  github: "https://github.com/srinivaas",
  linkedin: "https://linkedin.com/in/srinivaas",
  resumeHref: "/resume.pdf",
};

export const currentlyBuilding = [
  {
    name: "Bites by Batore",
    status: "In development",
    stack: ["FastAPI", "PostGIS", "pgvector", "Redis", "React Native"],
    summary:
      "Hyperlocal daily discovery for Coimbatore. No scraping. Every extracted place goes through human review.",
  },
  {
    name: "Batore self-hosted stack",
    status: "Migration in progress",
    stack: ["PostgreSQL 16", "Node/Express", "MinIO", "Caddy", "Cloudflare Tunnel"],
    summary:
      "Moving studio products off managed Supabase onto a hardened VPS with per-project schemas.",
  },
  {
    name: "BatoreCode",
    status: "Internal tooling",
    stack: ["Multi-provider LLM", "Failover routing", "Self-hosted"],
    summary:
      "Self-hosted AI coding environment with provider failover for Batore's engineering workflow.",
  },
];

export const projects = [
  {
    name: "Perfect Study Space",
    type: "Production product",
    metric: "~2,000 students",
    summary:
      "Multi-branch study-space management: memberships, food passes, attendance, WhatsApp, cashback and referral analytics. ~90 backend actions over 25+ tables.",
    tags: ["Operations", "Analytics", "WhatsApp"],
  },
  {
    name: "Harmony Living",
    type: "Resident platform",
    metric: "72-unit community",
    summary:
      "Resident management system for an apartment community — built end to end from schema to production.",
    tags: ["Housing", "Ops"],
  },
  {
    name: "Alpenglow Global LMS",
    type: "Lead system",
    metric: "Travel agency",
    summary:
      "Lead management for a travel agency: intake, follow-up, and operator workflow.",
    tags: ["CRM", "Travel"],
  },
  {
    name: "Cue Court Coffee",
    type: "Team shipping",
    metric: "Sports booking",
    summary:
      "Sports facility booking app. Production debugging of revenue reporting and a full production-readiness review.",
    tags: ["Bookings", "Revenue"],
  },
];

export const experience = [
  {
    org: "Batore",
    title: "Founder & Sole Developer",
    period: "Present",
    points: [
      "Design and ship custom management systems for local businesses in Coimbatore.",
      "Own schema, product, and production infrastructure for each engagement.",
      "Build consumer products and internal AI-assisted engineering tooling.",
    ],
  },
  {
    org: "Cue Court Coffee",
    title: "Engineer (4-person team)",
    period: "Shipped",
    points: [
      "Production debugging of revenue reporting.",
      "Production-readiness review before launch.",
    ],
  },
];

export const techStack = {
  languages: ["TypeScript", "Python", "SQL", "JavaScript"],
  frontend: ["React", "Next.js", "React Native"],
  backend: ["Node/Express", "FastAPI"],
  data: ["PostgreSQL 16", "PostGIS", "pgvector", "Redis"],
  infra: ["Docker", "Caddy", "MinIO", "Cloudflare Tunnel", "VPS"],
  ai: ["Multi-provider LLMs", "pgvector retrieval", "Agent workflows"],
};

export const achievements = [
  {
    label: "Students on Perfect Study Space",
    value: "2,000+",
  },
  {
    label: "Backend actions in core product",
    value: "~90",
  },
  {
    label: "Data tables in production schema",
    value: "25+",
  },
  {
    label: "Apartment units on Harmony Living",
    value: "72",
  },
];

export const certifications = [
  {
    name: "Integrated M.Tech — CS/IT",
    issuer: "VIT",
    note: "In progress — academic program, listed here as credential in flight.",
  },
];

export const caseStudies = [
  {
    title: "Perfect Study Space",
    problem:
      "A multi-branch study space needed memberships, food, attendance, and referrals in one operator console.",
    approach:
      "Modeled 25+ tables and ~90 backend actions. Integrated WhatsApp and cashback/referral analytics so staff can run the floor without spreadsheets.",
    outcome:
      "Platform used by around 2,000 students across branches.",
  },
  {
    title: "Bites by Batore",
    problem:
      "Hyperlocal discovery in Coimbatore is noisy if you scrape the open web.",
    approach:
      "FastAPI + PostGIS + pgvector + Redis + React Native. Strict no-scraping policy. Human review on every extracted place.",
    outcome:
      "Product currently in build — designed for trust first, scale second.",
  },
];

export const githubHighlights = {
  heading: "GitHub / Coding",
  summary:
    "Most of the work is production systems for real operators, not public demos. The public surface will grow as Batore products open-source tooling around the self-hosted stack.",
  cells: [
    0, 1, 0, 2, 3, 1, 0, 4, 2, 1, 0, 3, 4, 2, 1, 0, 2, 3, 4, 1, 0, 2, 1, 3, 4,
    2, 0, 1, 3, 2, 4, 1, 0, 2, 3, 1, 4, 2, 0, 3, 1, 2, 4, 0, 1, 3, 2, 4, 1, 0,
    3, 2, 1, 4, 0, 2, 3, 1, 4, 2, 0, 1, 3, 4, 2, 1, 0, 3, 2, 4, 1, 0, 2, 3, 4,
    1, 2, 0, 3, 1, 4, 2, 0, 1, 3, 2, 4, 0, 1, 2, 3, 4, 1, 0, 2, 3, 1, 4, 2, 0,
  ],
};

export const education = [
  {
    school: "VIT",
    program: "Integrated M.Tech in CS/IT",
    period: "In progress",
    note: "Computer Science / Information Technology.",
  },
];

export const research = [
  {
    title: "Human-reviewed local discovery",
    venue: "Bites by Batore — product notes",
    summary:
      "Why a no-scraping policy and human review beat brittle crawlers for hyperlocal place data.",
  },
  {
    title: "Self-hosted multi-tenant Postgres",
    venue: "Batore infrastructure",
    summary:
      "Per-project schemas on PostgreSQL 16 as a replacement for managed-backend lock-in.",
  },
];

export const testimonials = [
  {
    quote:
      "Swap this quote with a real operator once you have permission. Until then this slot shows how the layout reads.",
    name: "Studio client",
    role: "Business owner — Coimbatore",
  },
  {
    quote:
      "A second voice. Prefer a sentence about reliability, reporting, or how the floor actually uses the software.",
    name: "Operations lead",
    role: "Partner project",
  },
];

export const navItems = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "About Me" },
  { id: "building", label: "Currently Building" },
  { id: "projects", label: "Featured Projects" },
  { id: "experience", label: "Experience" },
  { id: "stack", label: "Tech Stack" },
  { id: "achievements", label: "Achievements" },
  { id: "certs", label: "Certifications" },
  { id: "cases", label: "Case Studies" },
  { id: "github", label: "GitHub / Coding" },
  { id: "education", label: "Education" },
  { id: "research", label: "Research & Writing" },
  { id: "testimonials", label: "Testimonials" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
];
