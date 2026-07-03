/**
 * Seed script — creates an admin user and sample data.
 * Run: pnpm --filter @workspace/api-server run seed
 */
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  employeesTable,
  companiesTable,
  companyContactsTable,
  requirementsTable,
  candidatesTable,
  candidatePipelineTable,
  assessmentQuestionsTable,
} from "@workspace/db/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Companies ──────────────────────────────────────────────────────────────
  const defaultTenantId = "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  // ── Employees ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 10);

  const [admin] = await db
    .insert(employeesTable)
    .values({ tenantId: defaultTenantId, name: "Divyesh Patel", email: "admin@99placement.com", passwordHash, role: "admin" })
    .onConflictDoNothing()
    .returning();

  const [recruiter] = await db
    .insert(employeesTable)
    .values({ tenantId: defaultTenantId, name: "Priya Sharma", email: "priya@99placement.com", passwordHash, role: "recruiter" })
    .onConflictDoNothing()
    .returning();

  console.log("✓ Employees created");

  const [company1] = await db
    .insert(companiesTable)
    .values({ tenantId: defaultTenantId, name: "TechCorp India", industry: "Technology", website: "https://techcorp.in" })
    .onConflictDoNothing()
    .returning();

  const [company2] = await db
    .insert(companiesTable)
    .values({ tenantId: defaultTenantId, name: "FinServ Solutions", industry: "Finance", website: "https://finserv.co.in" })
    .onConflictDoNothing()
    .returning();

  const [company3] = await db
    .insert(companiesTable)
    .values({ tenantId: defaultTenantId, name: "HealthBridge", industry: "Healthcare", website: "https://healthbridge.in" })
    .onConflictDoNothing()
    .returning();

  if (company1) {
    await db.insert(companyContactsTable).values({ tenantId: defaultTenantId, companyId: company1.id, name: "Rahul Mehta", email: "rahul@techcorp.in", designation: "HR Head", isPrimary: true }).onConflictDoNothing();
  }
  if (company2) {
    await db.insert(companyContactsTable).values({ tenantId: defaultTenantId, companyId: company2.id, name: "Sneha Iyer", email: "sneha@finserv.co.in", designation: "Talent Acquisition", isPrimary: true }).onConflictDoNothing();
  }

  console.log("✓ Companies created");

  // ── Requirements ───────────────────────────────────────────────────────────
  const requirements = [];
  if (company1) {
    const [r1] = await db.insert(requirementsTable).values({
      tenantId: defaultTenantId,
      companyId: company1.id,
      recruiterId: recruiter?.id || admin?.id,
      title: "Senior React Developer",
      location: "Bangalore",
      jobType: "full_time",
      urgency: "high",
      salaryBand: "18-28 LPA",
      openingsCount: 3,
      status: "open",
    }).onConflictDoNothing().returning();
    if (r1) requirements.push(r1);

    const [r2] = await db.insert(requirementsTable).values({
      tenantId: defaultTenantId,
      companyId: company1.id,
      recruiterId: recruiter?.id || admin?.id,
      title: "ML Engineer",
      location: "Remote",
      jobType: "full_time",
      urgency: "critical",
      salaryBand: "25-40 LPA",
      openingsCount: 2,
      status: "open",
    }).onConflictDoNothing().returning();
    if (r2) requirements.push(r2);
  }

  if (company2) {
    const [r3] = await db.insert(requirementsTable).values({
      tenantId: defaultTenantId,
      companyId: company2.id,
      recruiterId: admin?.id,
      title: "Data Analyst",
      location: "Mumbai",
      jobType: "full_time",
      urgency: "normal",
      salaryBand: "10-16 LPA",
      openingsCount: 1,
      status: "open",
    }).onConflictDoNothing().returning();
    if (r3) requirements.push(r3);
  }

  console.log("✓ Requirements created");

  // ── Candidates ─────────────────────────────────────────────────────────────
  const candidateData = [
    { name: "Priya Menon", email: "priya.menon@email.com", currentRole: "Senior React Developer", experienceYears: 6, location: "Bangalore", skills: ["React", "TypeScript", "GraphQL"], source: "referral" as const, expectedCtc: 2800000, noticeDays: 30 },
    { name: "Arjun Rao", email: "arjun.rao@email.com", currentRole: "Senior Data Engineer", experienceYears: 8, location: "Bangalore", skills: ["Python", "Airflow", "Snowflake"], source: "portal" as const, expectedCtc: 3200000, noticeDays: 60 },
    { name: "Sara Kim", email: "sara.kim@email.com", currentRole: "Senior React Developer", experienceYears: 5, location: "Remote", skills: ["React", "Next.js", "Tailwind"], source: "social" as const, expectedCtc: 2200000, noticeDays: 15 },
    { name: "Mohammed Iqbal", email: "mohammed.iqbal@email.com", currentRole: "ML Engineer", experienceYears: 7, location: "Hyderabad", skills: ["PyTorch", "LLMs", "RAG"], source: "referral" as const, expectedCtc: 3800000, noticeDays: 45 },
    { name: "Liu Wei", email: "liu.wei@email.com", currentRole: "Platform Engineer", experienceYears: 6, location: "Remote", skills: ["Kubernetes", "Terraform", "Go"], source: "internal" as const, expectedCtc: 2900000, noticeDays: 30 },
    { name: "Anita Desai", email: "anita.desai@email.com", currentRole: "Product Designer", experienceYears: 5, location: "Mumbai", skills: ["Figma", "Design Systems", "Prototyping"], source: "portal" as const, expectedCtc: 1800000, noticeDays: 30 },
    { name: "Rahul Verma", email: "rahul.verma@email.com", currentRole: "QA Automation Lead", experienceYears: 9, location: "Chennai", skills: ["Playwright", "Cypress", "CI/CD"], source: "referral" as const, expectedCtc: 2100000, noticeDays: 60 },
    { name: "Neha Sharma", email: "neha.sharma@email.com", currentRole: "Senior QA Engineer", experienceYears: 4, location: "Pune", skills: ["Selenium", "Appium", "Jira"], source: "social" as const, expectedCtc: 1200000, noticeDays: 30 },
  ];

  const createdCandidates = [];
  for (const c of candidateData) {
    const initials = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const sourceUpper = c.source ? c.source.toUpperCase() : "PORTAL";
    const [candidate] = await db.insert(candidatesTable).values({ ...c, initials, source: sourceUpper, tenantId: defaultTenantId }).onConflictDoNothing().returning();
    if (candidate) createdCandidates.push(candidate);
  }

  console.log("✓ Candidates created");

  // ── Pipeline entries ───────────────────────────────────────────────────────
  const stages = ["SOURCED", "SCREENED", "ASSESSED", "SHORTLISTED", "CLIENT_INTERVIEW", "OFFER", "JOINING"] as const;

  if (requirements.length > 0 && createdCandidates.length > 0) {
    for (let i = 0; i < createdCandidates.length; i++) {
      const req = requirements[i % requirements.length];
      const stage = stages[i % stages.length];
      await db.insert(candidatePipelineTable).values({
        tenantId: defaultTenantId,
        candidateId: createdCandidates[i].id,
        requirementId: req.id,
        stage,
        assignedRecruiterId: recruiter?.id || admin?.id,
      }).onConflictDoNothing();
    }
  }

  console.log("✓ Pipeline entries created");

  // ── Assessment questions ───────────────────────────────────────────────────
  const questions = [
    // Aptitude
    { category: "aptitude" as const, questionText: "A train travels 60 km in 1 hour. How far will it travel in 2.5 hours?", options: ["120 km", "150 km", "180 km", "200 km"], correctOption: 1, difficulty: "easy" },
    { category: "aptitude" as const, questionText: "If 5 machines produce 5 widgets in 5 minutes, how long do 100 machines need to produce 100 widgets?", options: ["1 min", "5 min", "100 min", "20 min"], correctOption: 1, difficulty: "medium" },
    { category: "aptitude" as const, questionText: "What is the next number in the series: 2, 6, 12, 20, 30?", options: ["38", "40", "42", "44"], correctOption: 2, difficulty: "medium" },
    // English
    { category: "english" as const, questionText: "Choose the correct form: She ___ to school every day.", options: ["go", "goes", "gone", "going"], correctOption: 1, difficulty: "easy" },
    { category: "english" as const, questionText: "What is the synonym of 'Benevolent'?", options: ["Malicious", "Kind", "Strict", "Indifferent"], correctOption: 1, difficulty: "easy" },
    { category: "english" as const, questionText: "Identify the correct sentence:", options: ["He don't know the answer.", "He doesn't knows the answer.", "He doesn't know the answer.", "He not know the answer."], correctOption: 2, difficulty: "easy" },
    // Logical Reasoning
    { category: "logical_reasoning" as const, questionText: "All dogs are animals. All animals have hearts. Which conclusion is valid?", options: ["All animals are dogs", "All dogs have hearts", "Some dogs have no hearts", "Dogs and animals are unrelated"], correctOption: 1, difficulty: "medium" },
    { category: "logical_reasoning" as const, questionText: "If A > B and B > C, what is the relationship between A and C?", options: ["A < C", "A = C", "A > C", "Cannot determine"], correctOption: 2, difficulty: "easy" },
    // Mathematics
    { category: "mathematics" as const, questionText: "What is 15% of 200?", options: ["25", "30", "35", "40"], correctOption: 1, difficulty: "easy" },
    { category: "mathematics" as const, questionText: "Solve: 2x + 5 = 17. What is x?", options: ["4", "5", "6", "7"], correctOption: 2, difficulty: "easy" },
    // Computer Knowledge
    { category: "computer_knowledge" as const, questionText: "What does HTML stand for?", options: ["Hyperlinks and Text Markup Language", "Hyper Text Markup Language", "Hyper Text Multiple Language", "Home Tool Markup Language"], correctOption: 1, difficulty: "easy" },
    { category: "computer_knowledge" as const, questionText: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Stack", "Array", "Linked List"], correctOption: 1, difficulty: "easy" },
    // General Knowledge
    { category: "general_knowledge" as const, questionText: "Which is the largest planet in our solar system?", options: ["Saturn", "Neptune", "Jupiter", "Uranus"], correctOption: 2, difficulty: "easy" },
    { category: "general_knowledge" as const, questionText: "Who invented the telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "James Watt"], correctOption: 1, difficulty: "easy" },
    // Technical
    { category: "technical" as const, questionText: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctOption: 1, difficulty: "medium" },
    { category: "technical" as const, questionText: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "403", "404"], correctOption: 3, difficulty: "easy" },
  ];

  for (const q of questions) {
    const categoryUpper = q.category ? q.category.toUpperCase() : undefined;
    await db.insert(assessmentQuestionsTable).values({ ...q, category: categoryUpper as any }).onConflictDoNothing();
  }

  console.log("✓ Assessment questions seeded");

  console.log("\n✅ Seed complete!");
  console.log("   Admin login: admin@99placement.com / admin123");
  console.log("   Recruiter:   priya@99placement.com / admin123");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
