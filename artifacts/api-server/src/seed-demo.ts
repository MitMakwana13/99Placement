import { PrismaClient, CandidateSource, PipelineStage, SystemRole, UrgencyLevel, JobStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RbacService } from "./services/rbac.service";
import { redisCache } from "./config/redis";

const prisma = new PrismaClient();

// First Names and Last Names for mock generation
const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Kabir", "Rohan", "Sanjay", "Anil", "Rahul", "Vikas", "Sunil", "Diya", "Anya", "Aadhya", "Ananya", "Pari", "Saanvi", "Avni", "Kavya", "Myra", "Kiara", "Prisha", "Riya", "Nisha", "Neha", "Pooja", "Anjali", "Swati", "Shruti", "Megha", "Priya"];
const lastNames = ["Kumar", "Singh", "Sharma", "Patel", "Reddy", "Shah", "Nair", "Iyer", "Rao", "Jain", "Desai", "Gupta", "Mehta", "Chawla", "Bhatia", "Malhotra", "Kapur", "Das", "Bose", "Mukherjee"];
const cities = ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi", "Gurgaon", "Noida", "Remote"];
const skillsPool = ["React", "Node.js", "Python", "Java", "Go", "Kubernetes", "AWS", "SQL", "PostgreSQL", "Machine Learning", "Data Analysis", "Figma", "Marketing", "Sales", "HR", "C++", "C#", "Azure"];
const roles = ["Software Engineer", "Frontend Developer", "Backend Developer", "Data Scientist", "Product Manager", "UX Designer", "Sales Executive", "Marketing Manager", "DevOps Engineer"];

// Function to get a random element from an array
function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Function to generate a random phone number
function getRandomPhone() {
  return "+919" + Math.floor(Math.random() * 1000000000).toString().padStart(9, "0");
}

async function runSeed() {
  console.log("🌱 Starting Demo Seeder for V2.0...");
  const defaultTenantId = "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  try {
    // Ensure permissions are seeded globally
    await RbacService.seedPermissions();
    console.log("✅ Global standard permissions seeded.");

    // Ensure default tenant roles and their permissions are initialized
    const tenantRoles = await RbacService.initializeTenantRoles(defaultTenantId);
    console.log("✅ Default tenant roles initialized.");

    const adminRole = tenantRoles["TENANT_ADMIN"];

    // 0. Get or create Tenant
    let tenant = await prisma.tenant.findUnique({
      where: { id: defaultTenantId }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: defaultTenantId,
          name: "99 Placement Demo",
          slug: "99-placement-demo"
        }
      });
    }

    // 1. Get or create recruiter
    let recruiter = await prisma.user.findFirst({
      where: { email: "priya@99placement.com" }
    });

    if (!recruiter) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      
      recruiter = await prisma.user.create({
        data: {
          tenantId: defaultTenantId,
          name: "Priya Sharma",
          email: "priya@99placement.com",
          passwordHash,
          systemRole: SystemRole.TENANT_ADMIN,
          roleId: adminRole.id
        }
      });
    } else {
      // Migrate existing user to TENANT_ADMIN systemRole and roleId if mismatch
      recruiter = await prisma.user.update({
        where: { id: recruiter.id },
        data: {
          systemRole: SystemRole.TENANT_ADMIN,
          roleId: adminRole.id
        }
      });
      // Clear permissions cache in Redis for Priya
      await redisCache.del(`user_permissions:${recruiter.id}`);
      console.log(`✅ Reset cache and updated Priya to TENANT_ADMIN role`);
    }

    // 2. Get or create companies
    let company = await prisma.company.findFirst({
      where: { name: "TechCorp India" }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          tenantId: defaultTenantId,
          name: "TechCorp India",
          industry: "Technology",
          website: "https://techcorp.in"
        }
      });
    }

    // 3. Get or create a Job Requirement
    let job = await prisma.job.findFirst({
      where: { title: "Senior React Developer", companyId: company.id }
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company.id,
          recruiterId: recruiter.id,
          code: "JOB-SRD-01",
          title: "Senior React Developer",
          location: "Bangalore",
          jobType: "FULL_TIME",
          urgency: UrgencyLevel.HIGH,
          salaryBand: "18-28 LPA",
          openingsCount: 5,
          status: JobStatus.OPEN
        }
      });
    }
    
    // Create another Job
    let job2 = await prisma.job.findFirst({
      where: { title: "Backend Engineer (Node.js)", companyId: company.id }
    });

    if (!job2) {
      job2 = await prisma.job.create({
        data: {
          tenantId: defaultTenantId,
          companyId: company.id,
          recruiterId: recruiter.id,
          code: "JOB-BE-02",
          title: "Backend Engineer (Node.js)",
          location: "Remote",
          jobType: "FULL_TIME",
          urgency: UrgencyLevel.CRITICAL,
          salaryBand: "20-30 LPA",
          openingsCount: 3,
          status: JobStatus.OPEN
        }
      });
    }

    const jobs = [job, job2];
    const stages = Object.values(PipelineStage);
    const sources = Object.values(CandidateSource);

    console.log("Generating 400+ Candidates... This might take a few moments.");

    // Generate 450 Candidates
    const BATCH_SIZE = 50;
    const TOTAL_CANDIDATES = 450;
    
    let candidateCount = 0;
    
    for (let i = 0; i < TOTAL_CANDIDATES; i += BATCH_SIZE) {
      const candidatesBatch = [];
      
      for (let j = 0; j < BATCH_SIZE; j++) {
        const fname = getRandom(firstNames);
        const lname = getRandom(lastNames);
        const fullName = `${fname} ${lname}`;
        
        // Ensure email uniqueness
        const email = `${fname.toLowerCase()}.${lname.toLowerCase()}.${i + j}@mockemail.com`;
        const role = getRandom(roles);
        const experience = Math.floor(Math.random() * 12) + 1; // 1 to 12 years
        const selectedSkills = [getRandom(skillsPool), getRandom(skillsPool), getRandom(skillsPool)];
        
        candidatesBatch.push({
          tenantId: defaultTenantId,
          name: fullName,
          email: email,
          phone: getRandomPhone(),
          currentRole: role,
          experienceYears: experience,
          location: getRandom(cities),
          skills: selectedSkills,
          source: getRandom(sources),
          currentCtc: Math.floor(Math.random() * 1500000) + 500000,
          expectedCtc: Math.floor(Math.random() * 2000000) + 1000000,
          noticeDays: Math.random() > 0.5 ? 30 : (Math.random() > 0.5 ? 60 : 90),
          initials: fname[0] + lname[0],
        });
      }
      
      // Insert batch
      await prisma.candidate.createMany({
        data: candidatesBatch,
        skipDuplicates: true
      });
      
      candidateCount += candidatesBatch.length;
      console.log(`Created ${candidateCount} candidates...`);
    }

    console.log("✅ Successfully created candidates. Now populating pipelines...");

    const allCandidates = await prisma.candidate.findMany({
      where: { tenantId: defaultTenantId },
      select: { id: true }
    });

    const pipelineItems = [];
    for (let i = 0; i < allCandidates.length; i++) {
      if (Math.random() > 0.3) {
        pipelineItems.push({
          tenantId: defaultTenantId,
          candidateId: allCandidates[i].id,
          jobId: getRandom(jobs).id,
          stage: getRandom(stages),
          assignedRecruiterId: recruiter.id,
        });
      }
    }

    for (let i = 0; i < pipelineItems.length; i += BATCH_SIZE) {
      const batch = pipelineItems.slice(i, i + BATCH_SIZE);
      await prisma.candidatePipeline.createMany({
        data: batch,
        skipDuplicates: true
      });
    }

    console.log(`✅ Successfully assigned ${pipelineItems.length} candidates to pipelines.`);
    
    console.log("✨ Demo seeding completed successfully! The environment is now ready with 400+ mock records.");

  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
