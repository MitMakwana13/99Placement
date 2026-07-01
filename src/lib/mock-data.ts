export const pipelineStages = [
  { key: "sourced", label: "Candidate Sourcing", count: 248, color: "var(--pastel-yellow)" },
  { key: "screened", label: "99 Screening", count: 162, color: "var(--pastel-peach)" },
  { key: "assessed", label: "99 Assessment", count: 98, color: "var(--pastel-pink)" },
  { key: "shortlisted", label: "Shortlisted", count: 54, color: "var(--pastel-lavender)" },
  { key: "client", label: "Client Interview", count: 28, color: "var(--pastel-blue)" },
  { key: "offer", label: "Offer Management", count: 12, color: "var(--pastel-green)" },
  { key: "joined", label: "Joined", count: 7, color: "oklch(0.7 0.13 150)" },
] as const;

export type StageKey = (typeof pipelineStages)[number]["key"];

export const kpis = [
  { label: "Open requirements", value: 34, delta: "+4 this week", tone: "pastel-yellow" as const },
  { label: "Candidates in pipeline", value: 609, delta: "+86 this week", tone: "pastel-pink" as const },
  { label: "Interviews this week", value: 22, delta: "8 today", tone: "pastel-blue" as const },
  { label: "Offers pending", value: 9, delta: "3 awaiting accept", tone: "pastel-green" as const },
  { label: "Avg time-to-fill", value: "21d", delta: "-3d vs last mo", tone: "pastel-lavender" as const },
];

export const activityFeed = [
  { id: "1", who: "Priya Menon", what: "cleared screening for Senior React Developer", when: "2m ago", tone: "pastel-green" },
  { id: "2", who: "Arjun Rao", what: "offer extended — Data Engineer, Acme Corp", when: "18m ago", tone: "pastel-yellow" },
  { id: "3", who: "Sara Kim", what: "scheduled for client interview tomorrow 11:00", when: "1h ago", tone: "pastel-blue" },
  { id: "4", who: "Mohammed Iqbal", what: "scored 86% on assessment — Reasoning strong", when: "3h ago", tone: "pastel-pink" },
  { id: "5", who: "Liu Wei", what: "joined as Platform Engineer at Northwind", when: "yesterday", tone: "pastel-lavender" },
];

export const urgentActions = [
  { id: "u1", label: "Notice period ends in 3 days — Priya Menon", kind: "Notice", tone: "pastel-pink" },
  { id: "u2", label: "Interview unscheduled — 4 shortlisted candidates", kind: "Schedule", tone: "pastel-yellow" },
  { id: "u3", label: "Assessment pending review — 6 submissions", kind: "Review", tone: "pastel-blue" },
  { id: "u4", label: "Offer awaiting client signature — Arjun Rao", kind: "Offer", tone: "pastel-green" },
];

export const todayAgenda = [
  { time: "09:30", title: "Screening — Sara Kim", where: "Zoom · Senior React", tone: "pastel-yellow" },
  { time: "11:00", title: "Client interview — Arjun Rao", where: "Acme HQ · Data Eng", tone: "pastel-blue" },
  { time: "13:30", title: "Daily pipeline standup", where: "Team room · 6 people", tone: "pastel-pink" },
  { time: "15:00", title: "Assessment debrief — batch 12", where: "Meet · 4 candidates", tone: "pastel-green" },
  { time: "17:00", title: "Offer call — Mohammed Iqbal", where: "Phone · Platform Eng", tone: "pastel-lavender" },
];

export type Requirement = {
  id: string;
  client: string;
  initial: string;
  role: string;
  location: string;
  urgency: "Critical" | "High" | "Normal";
  deadlineDays: number;
  band: string;
  jd: string;
  stages: Record<StageKey, number>;
};

export const requirements: Requirement[] = [
  {
    id: "REQ-2041",
    client: "Acme Corp",
    initial: "A",
    role: "Senior Data Engineer",
    location: "Bangalore · Hybrid",
    urgency: "Critical",
    deadlineDays: 4,
    band: "₹28–36 LPA",
    jd: "Own ingestion pipelines on Snowflake + dbt. 5+ yrs, Airflow, Python.",
    stages: { sourced: 42, screened: 24, assessed: 14, shortlisted: 6, client: 3, offer: 1, joined: 0 },
  },
  {
    id: "REQ-2038",
    client: "Northwind",
    initial: "N",
    role: "Platform Engineer",
    location: "Remote · India",
    urgency: "High",
    deadlineDays: 9,
    band: "₹22–30 LPA",
    jd: "Kubernetes, Terraform, AWS. On-call rotation. 4+ yrs.",
    stages: { sourced: 31, screened: 18, assessed: 11, shortlisted: 5, client: 2, offer: 1, joined: 1 },
  },
  {
    id: "REQ-2035",
    client: "Globex",
    initial: "G",
    role: "Senior React Developer",
    location: "Pune · Onsite",
    urgency: "Normal",
    deadlineDays: 18,
    band: "₹18–24 LPA",
    jd: "React 19, TypeScript, design systems. Mentoring juniors.",
    stages: { sourced: 56, screened: 33, assessed: 18, shortlisted: 9, client: 5, offer: 2, joined: 1 },
  },
  {
    id: "REQ-2030",
    client: "Initech",
    initial: "I",
    role: "Product Designer",
    location: "Mumbai · Hybrid",
    urgency: "High",
    deadlineDays: 7,
    band: "₹16–22 LPA",
    jd: "B2B SaaS, Figma, design tokens, prototyping.",
    stages: { sourced: 28, screened: 16, assessed: 9, shortlisted: 4, client: 2, offer: 1, joined: 0 },
  },
  {
    id: "REQ-2028",
    client: "Stark Industries",
    initial: "S",
    role: "ML Engineer",
    location: "Hyderabad · Hybrid",
    urgency: "Critical",
    deadlineDays: 2,
    band: "₹32–44 LPA",
    jd: "LLM fine-tuning, vector DBs, prod inference at scale.",
    stages: { sourced: 38, screened: 22, assessed: 12, shortlisted: 7, client: 4, offer: 2, joined: 1 },
  },
  {
    id: "REQ-2025",
    client: "Wayne Enterprises",
    initial: "W",
    role: "QA Automation Lead",
    location: "Chennai · Hybrid",
    urgency: "Normal",
    deadlineDays: 21,
    band: "₹20–28 LPA",
    jd: "Playwright, CI/CD, team lead, 7+ yrs.",
    stages: { sourced: 23, screened: 14, assessed: 8, shortlisted: 3, client: 1, offer: 0, joined: 0 },
  },
];

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  role: string;
  experience: number;
  location: string;
  skills: string[];
  source: "Referral" | "Portal" | "Social" | "Internal";
  stage: StageKey;
  noticeDays: number;
  expectedCtc: number;
  email: string;
  phone: string;
  summary: string;
  history: { req: string; stage: string; date: string }[];
};

export const candidates: Candidate[] = [
  {
    id: "C-1001", name: "Priya Menon", initials: "PM", role: "Senior React Developer", experience: 6,
    location: "Bangalore", skills: ["React", "TypeScript", "GraphQL", "Design Systems"],
    source: "Referral", stage: "client", noticeDays: 30, expectedCtc: 24,
    email: "priya.menon@mail.com", phone: "+91 98xxx 11220",
    summary: "Frontend lead at fintech, shipped design-system v2 across 8 squads. Strong on accessibility.",
    history: [
      { req: "REQ-2035 · Globex", stage: "Shortlisted", date: "Jun 22" },
      { req: "REQ-2035 · Globex", stage: "Client interview", date: "Jun 28" },
    ],
  },
  {
    id: "C-1002", name: "Arjun Rao", initials: "AR", role: "Senior Data Engineer", experience: 8,
    location: "Bangalore", skills: ["Python", "Airflow", "Snowflake", "dbt", "AWS"],
    source: "Portal", stage: "offer", noticeDays: 60, expectedCtc: 34,
    email: "arjun.rao@mail.com", phone: "+91 98xxx 33441",
    summary: "Built petabyte-scale lakehouse. Ex-Razorpay, ex-Swiggy. Mentors 6.",
    history: [{ req: "REQ-2041 · Acme", stage: "Offer", date: "Jun 29" }],
  },
  {
    id: "C-1003", name: "Sara Kim", initials: "SK", role: "Senior React Developer", experience: 5,
    location: "Remote", skills: ["React", "Next.js", "Tailwind", "tRPC"],
    source: "Social", stage: "screened", noticeDays: 15, expectedCtc: 21,
    email: "sara.kim@mail.com", phone: "+91 96xxx 87211",
    summary: "Indie consultant turned platform engineer. Strong DX intuition.",
    history: [{ req: "REQ-2035 · Globex", stage: "Screened", date: "Jun 27" }],
  },
  {
    id: "C-1004", name: "Mohammed Iqbal", initials: "MI", role: "ML Engineer", experience: 7,
    location: "Hyderabad", skills: ["PyTorch", "LLMs", "RAG", "Triton"],
    source: "Referral", stage: "assessed", noticeDays: 45, expectedCtc: 38,
    email: "m.iqbal@mail.com", phone: "+91 95xxx 22119",
    summary: "Shipped 3 production LLM systems. Strong systems background.",
    history: [{ req: "REQ-2028 · Stark", stage: "Assessed · 86%", date: "Jun 30" }],
  },
  {
    id: "C-1005", name: "Liu Wei", initials: "LW", role: "Platform Engineer", experience: 6,
    location: "Remote", skills: ["Kubernetes", "Terraform", "Go", "AWS"],
    source: "Internal", stage: "joined", noticeDays: 0, expectedCtc: 28,
    email: "liu.wei@mail.com", phone: "+86 13x xxxx 9981",
    summary: "Cloud-native generalist, ex-Atlassian SRE.",
    history: [{ req: "REQ-2038 · Northwind", stage: "Joined", date: "Jun 26" }],
  },
  {
    id: "C-1006", name: "Anita Desai", initials: "AD", role: "Product Designer", experience: 5,
    location: "Mumbai", skills: ["Figma", "Design Systems", "Prototyping", "Research"],
    source: "Portal", stage: "shortlisted", noticeDays: 30, expectedCtc: 19,
    email: "anita.d@mail.com", phone: "+91 97xxx 55001",
    summary: "B2B SaaS specialist, owned design ops at scale.",
    history: [{ req: "REQ-2030 · Initech", stage: "Shortlisted", date: "Jun 29" }],
  },
  {
    id: "C-1007", name: "Rahul Verma", initials: "RV", role: "QA Automation Lead", experience: 9,
    location: "Chennai", skills: ["Playwright", "Cypress", "CI/CD", "Leadership"],
    source: "Referral", stage: "sourced", noticeDays: 60, expectedCtc: 25,
    email: "rahul.v@mail.com", phone: "+91 99xxx 88001",
    summary: "Built QA from 2 → 14 engineers. Strong process orientation.",
    history: [{ req: "REQ-2025 · Wayne", stage: "Sourced", date: "Jun 30" }],
  },
  {
    id: "C-1008", name: "Neha Sharma", initials: "NS", role: "Senior Data Engineer", experience: 6,
    location: "Pune", skills: ["Python", "Spark", "Kafka", "GCP"],
    source: "Social", stage: "shortlisted", noticeDays: 30, expectedCtc: 30,
    email: "neha.sharma@mail.com", phone: "+91 98xxx 44002",
    summary: "Streaming + batch expert. Wrote internal Spark cookbook.",
    history: [{ req: "REQ-2041 · Acme", stage: "Shortlisted", date: "Jun 28" }],
  },
  {
    id: "C-1009", name: "Tyler Young", initials: "TY", role: "ML Engineer", experience: 4,
    location: "Remote", skills: ["PyTorch", "HuggingFace", "MLOps"],
    source: "Portal", stage: "screened", noticeDays: 30, expectedCtc: 26,
    email: "tyler.y@mail.com", phone: "+1 415 xxx 0921",
    summary: "Research lab turned applied ML. Strong evaluation rigor.",
    history: [{ req: "REQ-2028 · Stark", stage: "Screened", date: "Jun 29" }],
  },
  {
    id: "C-1010", name: "Amy White", initials: "AW", role: "Product Designer", experience: 7,
    location: "Bangalore", skills: ["Figma", "Brand", "Motion", "Tokens"],
    source: "Referral", stage: "assessed", noticeDays: 45, expectedCtc: 22,
    email: "amy.white@mail.com", phone: "+91 91xxx 77001",
    summary: "Brand + product hybrid. Recent: design tokens migration.",
    history: [{ req: "REQ-2030 · Initech", stage: "Assessed", date: "Jun 30" }],
  },
];

export const screeningCriteria = [
  "Communication",
  "Education",
  "Experience",
  "Technical knowledge",
  "Salary expectation",
  "Notice period",
  "Attitude",
  "Suitability",
] as const;

export const assessmentCategories = [
  "Aptitude",
  "GK",
  "Current Affairs",
  "Reasoning",
  "English",
  "Computer",
] as const;

export const assessmentScores = [
  { name: "Mohammed Iqbal", scores: [88, 72, 70, 92, 84, 90], shortlisted: true },
  { name: "Priya Menon", scores: [82, 78, 74, 80, 90, 86], shortlisted: true },
  { name: "Sara Kim", scores: [76, 70, 68, 84, 88, 82], shortlisted: false },
  { name: "Arjun Rao", scores: [90, 80, 78, 88, 82, 94], shortlisted: true },
  { name: "Anita Desai", scores: [72, 74, 70, 78, 86, 76], shortlisted: false },
  { name: "Tyler Young", scores: [80, 68, 72, 86, 82, 84], shortlisted: false },
];

export const offers = [
  { name: "Arjun Rao", role: "Senior Data Engineer", expected: 34, offered: 32, final: 33, status: "Sent" as const, docs: 2, totalDocs: 5 },
  { name: "Mohammed Iqbal", role: "ML Engineer", expected: 38, offered: 36, final: 36, status: "Accepted" as const, docs: 4, totalDocs: 5 },
  { name: "Priya Menon", role: "Senior React Developer", expected: 24, offered: 22, final: 23, status: "Documentation" as const, docs: 5, totalDocs: 5 },
  { name: "Liu Wei", role: "Platform Engineer", expected: 28, offered: 28, final: 28, status: "Accepted" as const, docs: 5, totalDocs: 5 },
  { name: "Neha Sharma", role: "Senior Data Engineer", expected: 30, offered: 28, final: 0, status: "Drafted" as const, docs: 0, totalDocs: 5 },
];

export const joiners = [
  { name: "Priya Menon", role: "Senior React Developer", noticeTotal: 30, noticeLeft: 3, checkins: { d30: true, d60: false, d90: false } },
  { name: "Arjun Rao", role: "Senior Data Engineer", noticeTotal: 60, noticeLeft: 22, checkins: { d30: false, d60: false, d90: false } },
  { name: "Liu Wei", role: "Platform Engineer", noticeTotal: 0, noticeLeft: 0, checkins: { d30: true, d60: true, d90: false } },
  { name: "Mohammed Iqbal", role: "ML Engineer", noticeTotal: 45, noticeLeft: 18, checkins: { d30: false, d60: false, d90: false } },
];
