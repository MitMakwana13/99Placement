/**
 * Seed script — creates an admin user and sample data.
 * Run: pnpm --filter @workspace/api-server run seed
 */
import bcrypt from "bcryptjs";
import {
  prisma,
  SystemRole,
  UrgencyLevel,
  JobStatus,
  CandidateSource,
  PipelineStage,
  AssessmentCategory,
} from "@workspace/db-prisma";
import { RbacService } from "./services/rbac.service";

async function seed() {
  console.log("🌱 Seeding database...");

  const defaultTenantId = "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  // Ensure permissions are seeded globally
  await RbacService.seedPermissions();
  console.log("✓ Global standard permissions seeded.");

  // Ensure default tenant roles and their permissions are initialized
  const tenantRoles = await RbacService.initializeTenantRoles(defaultTenantId);
  console.log("✓ Default tenant roles initialized.");

  const adminRole = tenantRoles["TENANT_ADMIN"];
  const recruiterRole = tenantRoles["RECRUITER"];

  // Ensure default tenant exists
  let tenant = await prisma.tenant.findUnique({
    where: { id: defaultTenantId },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: defaultTenantId,
        name: "99 Placement Default",
        slug: "99-placement-default",
      },
    });
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  // Seed Users (Employees)
  let admin = await prisma.user.findFirst({
    where: { email: "admin@99placement.com" },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        tenantId: defaultTenantId,
        name: "Divyesh Patel",
        email: "admin@99placement.com",
        passwordHash,
        systemRole: SystemRole.TENANT_ADMIN,
        roleId: adminRole.id,
      },
    });
  }

  let recruiter = await prisma.user.findFirst({
    where: { email: "priya@99placement.com" },
  });

  if (!recruiter) {
    recruiter = await prisma.user.create({
      data: {
        tenantId: defaultTenantId,
        name: "Priya Sharma",
        email: "priya@99placement.com",
        passwordHash,
        systemRole: SystemRole.RECRUITER,
        roleId: recruiterRole.id,
      },
    });
  }

  console.log("✓ Employees created");

  // Companies
  let company1 = await prisma.company.findFirst({
    where: { name: "TechCorp India", tenantId: defaultTenantId },
  });

  if (!company1) {
    company1 = await prisma.company.create({
      data: {
        tenantId: defaultTenantId,
        name: "TechCorp India",
        industry: "Technology",
        website: "https://techcorp.in",
      },
    });
  }

  let company2 = await prisma.company.findFirst({
    where: { name: "FinServ Solutions", tenantId: defaultTenantId },
  });

  if (!company2) {
    company2 = await prisma.company.create({
      data: {
        tenantId: defaultTenantId,
        name: "FinServ Solutions",
        industry: "Finance",
        website: "https://finserv.co.in",
      },
    });
  }

  let company3 = await prisma.company.findFirst({
    where: { name: "HealthBridge", tenantId: defaultTenantId },
  });

  if (!company3) {
    company3 = await prisma.company.create({
      data: {
        tenantId: defaultTenantId,
        name: "HealthBridge",
        industry: "Healthcare",
        website: "https://healthbridge.in",
      },
    });
  }

  // Company Contacts
  if (company1) {
    const contactExists = await prisma.companyContact.findFirst({
      where: { companyId: company1.id, email: "rahul@techcorp.in" },
    });
    if (!contactExists) {
      await prisma.companyContact.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company1.id,
          name: "Rahul Mehta",
          email: "rahul@techcorp.in",
          designation: "HR Head",
          isPrimary: true,
        },
      });
    }
  }

  if (company2) {
    const contactExists = await prisma.companyContact.findFirst({
      where: { companyId: company2.id, email: "sneha@finserv.co.in" },
    });
    if (!contactExists) {
      await prisma.companyContact.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company2.id,
          name: "Sneha Iyer",
          email: "sneha@finserv.co.in",
          designation: "Talent Acquisition",
          isPrimary: true,
        },
      });
    }
  }

  console.log("✓ Companies created");

  // Requirements (Jobs)
  const requirements = [];

  if (company1) {
    let r1 = await prisma.job.findFirst({
      where: { title: "Senior React Developer", companyId: company1.id, tenantId: defaultTenantId },
    });
    if (!r1) {
      r1 = await prisma.job.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company1.id,
          recruiterId: recruiter.id,
          code: "JOB-SRD-01",
          title: "Senior React Developer",
          location: "Bangalore",
          jobType: "full_time",
          urgency: UrgencyLevel.HIGH,
          salaryBand: "18-28 LPA",
          openingsCount: 3,
          status: JobStatus.OPEN,
        },
      });
    }
    requirements.push(r1);

    let r2 = await prisma.job.findFirst({
      where: { title: "ML Engineer", companyId: company1.id, tenantId: defaultTenantId },
    });
    if (!r2) {
      r2 = await prisma.job.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company1.id,
          recruiterId: recruiter.id,
          code: "JOB-MLE-02",
          title: "ML Engineer",
          location: "Remote",
          jobType: "full_time",
          urgency: UrgencyLevel.CRITICAL,
          salaryBand: "25-40 LPA",
          openingsCount: 2,
          status: JobStatus.OPEN,
        },
      });
    }
    requirements.push(r2);
  }

  if (company2) {
    let r3 = await prisma.job.findFirst({
      where: { title: "Data Analyst", companyId: company2.id, tenantId: defaultTenantId },
    });
    if (!r3) {
      r3 = await prisma.job.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company2.id,
          recruiterId: admin.id,
          code: "JOB-DA-03",
          title: "Data Analyst",
          location: "Mumbai",
          jobType: "full_time",
          urgency: UrgencyLevel.NORMAL,
          salaryBand: "10-16 LPA",
          openingsCount: 1,
          status: JobStatus.OPEN,
        },
      });
    }
    requirements.push(r3);
  }

  console.log("✓ Requirements created");

  // Candidates
  const candidateData = [
    { name: "Priya Menon", email: "priya.menon@email.com", currentRole: "Senior React Developer", experienceYears: 6, location: "Bangalore", skills: ["React", "TypeScript", "GraphQL"], source: CandidateSource.REFERRAL, expectedCtc: 2800000, noticeDays: 30 },
    { name: "Arjun Rao", email: "arjun.rao@email.com", currentRole: "Senior Data Engineer", experienceYears: 8, location: "Bangalore", skills: ["Python", "Airflow", "Snowflake"], source: CandidateSource.PORTAL, expectedCtc: 3200000, noticeDays: 60 },
    { name: "Sara Kim", email: "sara.kim@email.com", currentRole: "Senior React Developer", experienceYears: 5, location: "Remote", skills: ["React", "Next.js", "Tailwind"], source: CandidateSource.SOCIAL, expectedCtc: 2200000, noticeDays: 15 },
    { name: "Mohammed Iqbal", email: "mohammed.iqbal@email.com", currentRole: "ML Engineer", experienceYears: 7, location: "Hyderabad", skills: ["PyTorch", "LLMs", "RAG"], source: CandidateSource.REFERRAL, expectedCtc: 3800000, noticeDays: 45 },
    { name: "Liu Wei", email: "liu.wei@email.com", currentRole: "Platform Engineer", experienceYears: 6, location: "Remote", skills: ["Kubernetes", "Terraform", "Go"], source: CandidateSource.INTERNAL, expectedCtc: 2900000, noticeDays: 30 },
    { name: "Anita Desai", email: "anita.desai@email.com", currentRole: "Product Designer", experienceYears: 5, location: "Mumbai", skills: ["Figma", "Design Systems", "Prototyping"], source: CandidateSource.PORTAL, expectedCtc: 1800000, noticeDays: 30 },
    { name: "Rahul Verma", email: "rahul.verma@email.com", currentRole: "QA Automation Lead", experienceYears: 9, location: "Chennai", skills: ["Playwright", "Cypress", "CI/CD"], source: CandidateSource.REFERRAL, expectedCtc: 2100000, noticeDays: 60 },
    { name: "Neha Sharma", email: "neha.sharma@email.com", currentRole: "Senior QA Engineer", experienceYears: 4, location: "Pune", skills: ["Selenium", "Appium", "Jira"], source: CandidateSource.SOCIAL, expectedCtc: 1200000, noticeDays: 30 },
  ];

  const createdCandidates = [];
  for (const c of candidateData) {
    const initials = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    let candidate = await prisma.candidate.findUnique({
      where: { email: c.email },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: defaultTenantId,
          name: c.name,
          email: c.email,
          phone: "+91987654" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
          currentRole: c.currentRole,
          experienceYears: c.experienceYears,
          location: c.location,
          skills: c.skills,
          source: c.source,
          expectedCtc: c.expectedCtc,
          noticeDays: c.noticeDays,
          initials,
        },
      });
    }
    createdCandidates.push(candidate);
  }

  console.log("✓ Candidates created");

  // Pipeline entries
  const stages = [
    PipelineStage.SOURCED,
    PipelineStage.SCREENED,
    PipelineStage.ASSESSED,
    PipelineStage.SHORTLISTED,
    PipelineStage.CLIENT_INTERVIEW,
    PipelineStage.OFFER,
    PipelineStage.JOINING,
  ];

  if (requirements.length > 0 && createdCandidates.length > 0) {
    for (let i = 0; i < createdCandidates.length; i++) {
      const req = requirements[i % requirements.length];
      const stage = stages[i % stages.length];

      const pipelineExists = await prisma.candidatePipeline.findFirst({
        where: { candidateId: createdCandidates[i].id, jobId: req.id },
      });

      if (!pipelineExists) {
        await prisma.candidatePipeline.create({
          data: {
            tenantId: defaultTenantId,
            candidateId: createdCandidates[i].id,
            jobId: req.id,
            stage,
            assignedRecruiterId: recruiter.id,
          },
        });
      }
    }
  }

  console.log("✓ Pipeline entries created");

  // Assessment questions
  const questions = [
    // Aptitude
    { category: AssessmentCategory.APTITUDE, questionText: "A train travels 60 km in 1 hour. How far will it travel in 2.5 hours?", options: ["120 km", "150 km", "180 km", "200 km"], correctOption: 1, difficulty: "easy" },
    { category: AssessmentCategory.APTITUDE, questionText: "If 5 machines produce 5 widgets in 5 minutes, how long do 100 machines need to produce 100 widgets?", options: ["1 min", "5 min", "100 min", "20 min"], correctOption: 1, difficulty: "medium" },
    { category: AssessmentCategory.APTITUDE, questionText: "What is the next number in the series: 2, 6, 12, 20, 30?", options: ["38", "40", "42", "44"], correctOption: 2, difficulty: "medium" },
    // English
    { category: AssessmentCategory.ENGLISH, questionText: "Choose the correct form: She ___ to school every day.", options: ["go", "goes", "gone", "going"], correctOption: 1, difficulty: "easy" },
    { category: AssessmentCategory.ENGLISH, questionText: "What is the synonym of 'Benevolent'?", options: ["Malicious", "Kind", "Strict", "Indifferent"], correctOption: 1, difficulty: "easy" },
    { category: AssessmentCategory.ENGLISH, questionText: "Identify the correct sentence:", options: ["He don't know the answer.", "He doesn't knows the answer.", "He doesn't know the answer.", "He not know the answer."], correctOption: 2, difficulty: "easy" },
    // Logical Reasoning
    { category: AssessmentCategory.LOGICAL_REASONING, questionText: "All dogs are animals. All animals have hearts. Which conclusion is valid?", options: ["All animals are dogs", "All dogs have hearts", "Some dogs have no hearts", "Dogs and animals are unrelated"], correctOption: 1, difficulty: "medium" },
    { category: AssessmentCategory.LOGICAL_REASONING, questionText: "If A > B and B > C, what is the relationship between A and C?", options: ["A < C", "A = C", "A > C", "Cannot determine"], correctOption: 2, difficulty: "easy" },
    // Mathematics
    { category: AssessmentCategory.MATHEMATICS, questionText: "What is 15% of 200?", options: ["25", "30", "35", "40"], correctOption: 1, difficulty: "easy" },
    { category: AssessmentCategory.MATHEMATICS, questionText: "Solve: 2x + 5 = 17. What is x?", options: ["4", "5", "6", "7"], correctOption: 2, difficulty: "easy" },
    // Computer Knowledge
    { category: AssessmentCategory.COMPUTER_KNOWLEDGE, questionText: "What does HTML stand for?", options: ["Hyperlinks and Text Markup Language", "Hyper Text Markup Language", "Hyper Text Multiple Language", "Home Tool Markup Language"], correctOption: 1, difficulty: "easy" },
    { category: AssessmentCategory.COMPUTER_KNOWLEDGE, questionText: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Stack", "Array", "Linked List"], correctOption: 1, difficulty: "easy" },
    // General Knowledge
    { category: AssessmentCategory.GENERAL_KNOWLEDGE, questionText: "Which is the largest planet in our solar system?", options: ["Saturn", "Neptune", "Jupiter", "Uranus"], correctOption: 2, difficulty: "easy" },
    { category: AssessmentCategory.GENERAL_KNOWLEDGE, questionText: "Who invented the telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "James Watt"], correctOption: 1, difficulty: "easy" },
    // Technical
    { category: AssessmentCategory.TECHNICAL, questionText: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctOption: 1, difficulty: "medium" },
    { category: AssessmentCategory.TECHNICAL, questionText: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "403", "404"], correctOption: 3, difficulty: "easy" },
  ];

  for (const q of questions) {
    const questionExists = await prisma.assessmentQuestion.findFirst({
      where: { questionText: q.questionText, category: q.category },
    });

    if (!questionExists) {
      await prisma.assessmentQuestion.create({
        data: q,
      });
    }
  }

  console.log("✓ Assessment questions seeded");
  console.log("\n✅ Seed complete!");
  console.log("   Admin login: admin@99placement.com / admin123");
  console.log("   Recruiter:   priya@99placement.com / admin123");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
