import "./test-env";
import { test } from "node:test";
import assert from "node:assert";
import { AuthService } from "./services/auth.service";
import { RbacService } from "./services/rbac.service";
import { prisma } from "@workspace/db-prisma";
import logger from "./lib/logger";
import { CandidateService } from "./services/candidate.service";
import { CandidateRepository } from "./repositories/candidate.repository";
import { CompanyService } from "./services/company.service";
import { CompanyRepository } from "./repositories/company.repository";
import { JobService } from "./services/job.service";
import { JobRepository } from "./repositories/job.repository";
import { PipelineService } from "./services/pipeline.service";
import { PipelineRepository } from "./repositories/pipeline.repository";
import { bootstrapEventHandlers } from "./events/bootstrap";
import { ScreeningService } from "./services/screening.service";
import { ScreeningRepository } from "./repositories/screening.repository";
import { AssessmentService } from "./services/assessment.service";
import { AssessmentRepository } from "./repositories/assessment.repository";
import { InterviewService } from "./services/interview.service";
import { InterviewRepository } from "./repositories/interview.repository";
import { OfferService } from "./services/offer.service";
import { OfferRepository } from "./repositories/offer.repository";
import { JoiningService } from "./services/joining.service";
import { JoiningRepository } from "./repositories/joining.repository";
import { db } from "@workspace/db";
import { requirementsTable, employeesTable } from "@workspace/db/schema";

async function runTests() {
  logger.info("Starting Enterprise Recruitment Management System Integration Tests...");

  // Bootstrap all domain event handlers BEFORE any service calls
  bootstrapEventHandlers();

  // Clear Drizzle-only tables first to avoid FK constraint violations
  try {
    await db.delete(requirementsTable);
    await db.delete(employeesTable);
  } catch (err) {
    logger.error("Failed to clear Drizzle-only tables:", err);
  }

  // Clear Assessment & Screening tables first (FK dependencies)
  await prisma.offerApproval.deleteMany();
  await prisma.offerLetter.deleteMany();
  await prisma.postJoiningFollowup.deleteMany();
  await prisma.joiningStatus.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessmentTest.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.screeningCriteriaScore.deleteMany();
  await prisma.screeningInterview.deleteMany();
  await prisma.interviewScore.deleteMany();
  await prisma.interviewFeedback.deleteMany();
  await prisma.interviewPanel.deleteMany();
  await prisma.interviewTimeline.deleteMany();
  await prisma.interviewReminder.deleteMany();
  await prisma.interviewQuestion.deleteMany();
  await prisma.interviewRecording.deleteMany();
  await prisma.interviewAttachment.deleteMany();
  await prisma.interviewRescheduleHistory.deleteMany();
  await prisma.interview.deleteMany();

  // Clear Pipeline Domain related tables
  await prisma.pipelineActivity.deleteMany();
  await prisma.pipelineTag.deleteMany();
  await prisma.pipelineReminder.deleteMany();
  await prisma.pipelineChecklist.deleteMany();
  await prisma.pipelineRating.deleteMany();
  await prisma.pipelineAttachment.deleteMany();
  await prisma.pipelineNote.deleteMany();
  await prisma.pipelineHistory.deleteMany();
  await prisma.candidatePipeline.deleteMany();

  // Clear Job Domain related tables
  await prisma.jobTimeline.deleteMany();
  await prisma.jobStatusHistory.deleteMany();
  await prisma.jobDocument.deleteMany();
  await prisma.jobQuestion.deleteMany();
  await prisma.jobTag.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.jobLocation.deleteMany();
  await prisma.jobDepartment.deleteMany();
  await prisma.jobRecruiterAssignment.deleteMany();
  await prisma.jobHiringManagerAssignment.deleteMany();
  await prisma.job.deleteMany();

  // Setup/Teardown: Clear DB first
  await prisma.savedFilter.deleteMany();
  await prisma.candidateTimeline.deleteMany();
  await prisma.candidateNote.deleteMany();
  await prisma.candidateTag.deleteMany();
  await prisma.candidateDocument.deleteMany();
  await prisma.candidateCertification.deleteMany();
  await prisma.candidateLanguage.deleteMany();
  await prisma.candidateSkill.deleteMany();
  await prisma.candidateExperience.deleteMany();
  await prisma.candidateEducation.deleteMany();
  await prisma.candidateAddress.deleteMany();
  await prisma.candidate.deleteMany();

  // Clear Company Domain related tables
  await prisma.recruiterAssignment.deleteMany();
  await prisma.companyTimeline.deleteMany();
  await prisma.companyNote.deleteMany();
  await prisma.companyTag.deleteMany();
  await prisma.companyDocument.deleteMany();
  await prisma.companyDepartment.deleteMany();
  await prisma.companyAddress.deleteMany();
  await prisma.companyContact.deleteMany();
  await prisma.company.deleteMany();

  await prisma.userPreference.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermissionMapping.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenantSetting.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.permission.deleteMany();

  // Seed permissions
  await RbacService.seedPermissions();

  let testTenantId = "";
  let testUserId = "";
  let testUserEmail = "admin@recruiterlabs.test";
  let activeRefreshToken = "";
  let candidate1Id = "";
  let candidate2Id = "";

  // Wrap all integration tests inside a single parent suite to force serial execution
  await test("Enterprise Recruitment Management System Integration Suite", async (t) => {
    
    await t.test("Onboard Tenant and Admin User (Registration)", async () => {
      const registration = await AuthService.registerTenant({
        tenantName: "RecruiterLabs Consultancy",
        tenantSlug: "recruiterlabs",
        adminName: "Jane Doe",
        adminEmail: testUserEmail,
        adminPassword: "SecurePassword123",
      });

      assert.ok(registration.tenantId, "Tenant ID should be defined");
      assert.ok(registration.userId, "Admin User ID should be defined");
      assert.strictEqual(registration.email, testUserEmail, "Admin email should match input");

      testTenantId = registration.tenantId;
      testUserId = registration.userId;

      // Verify Tenant Setting table has been automatically populated
      const settings = await prisma.tenantSetting.findUnique({
        where: { tenantId: testTenantId },
      });
      assert.ok(settings, "Tenant settings should be auto-created");
      assert.strictEqual(settings.timezone, "UTC", "Default timezone should be UTC");

      // Verify User Preference table has been automatically populated
      const prefs = await prisma.userPreference.findUnique({
        where: { userId: testUserId },
      });
      assert.ok(prefs, "User preferences should be auto-created");
      assert.strictEqual(prefs.theme, "light", "Default theme should be light");
    });

    await t.test("Dynamic RBAC Seeding checks", async () => {
      // Verify roles were successfully seeded for the tenant
      const roles = await prisma.role.findMany({
        where: { tenantId: testTenantId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      const roleNames = roles.map((r) => r.name);
      assert.ok(roleNames.includes("TENANT_ADMIN"), "Should contain TENANT_ADMIN role");
      assert.ok(roleNames.includes("RECRUITER"), "Should contain RECRUITER role");

      const tenantAdmin = roles.find((r) => r.name === "TENANT_ADMIN");
      assert.ok(tenantAdmin, "Tenant Admin role should exist");
      
      // Check if wildcard permission seed associated all permissions to TENANT_ADMIN
      const adminPermsCount = tenantAdmin.permissions.length;
      const globalPermsCount = await prisma.permission.count();
      assert.strictEqual(adminPermsCount, globalPermsCount, "TENANT_ADMIN should have all seeded permissions");
    });

    await t.test("User Credentials Login and Token Generation", async () => {
      const loginResult = await AuthService.login({
        email: testUserEmail,
        password: "SecurePassword123",
      });

      assert.ok(loginResult.accessToken, "Should generate an access token");
      assert.ok(loginResult.refreshToken, "Should generate a refresh token");
      assert.strictEqual(loginResult.user.email, testUserEmail);
      assert.strictEqual(loginResult.user.role, "TENANT_ADMIN");

      activeRefreshToken = loginResult.refreshToken;

      // Check if session record is written to the DB
      const sessionCount = await prisma.userSession.count({
        where: { userId: testUserId },
      });
      assert.strictEqual(sessionCount, 1, "Should write 1 active session to DB");
    });

    await t.test("Login with Invalid Password throws AppError", async () => {
      try {
        await AuthService.login({
          email: testUserEmail,
          password: "WrongPassword",
        });
        assert.fail("Should have thrown error");
      } catch (err: any) {
        assert.strictEqual(err.statusCode, 401, "Error should return 401 unauthorized status");
        assert.strictEqual(err.code, "INVALID_CREDENTIALS", "Should return correct error code");
      }
    });

    await t.test("Refresh Session and Token Rotation (RTR)", async () => {
      // Wait briefly to check rotation timestamps if necessary
      const refreshResult = await AuthService.refreshSession(activeRefreshToken);

      assert.ok(refreshResult.accessToken, "Should generate new access token");
      assert.ok(refreshResult.refreshToken, "Should generate new refresh token");
      assert.notStrictEqual(
        refreshResult.refreshToken,
        activeRefreshToken,
        "Refresh token should be rotated"
      );

      // Save rotated token
      activeRefreshToken = refreshResult.refreshToken;

      // Verify session count is still 1 (old session is deleted, new is inserted)
      const sessionCount = await prisma.userSession.count({
        where: { userId: testUserId },
      });
      assert.strictEqual(sessionCount, 1, "Total active sessions should remain 1 under RTR");
    });

    await t.test("Refresh Token Reuse Detection (Security Breach Fallback)", async () => {
      // Attempting to refresh again using the *old* refresh token
      try {
        // Let's use a dummy reuse token that was previously valid. We simulate reuse by passing an old token:
        const dummyPayload = {
          userId: testUserId,
          email: testUserEmail,
          role: "TENANT_ADMIN",
          systemRole: "TENANT_ADMIN",
          tenantId: testTenantId,
        };
        
        // Sign a valid refresh token structure, but don't save it to DB (it will look like an old token)
        const { signRefreshToken } = await import("./utils/jwt");
        const reuseToken = signRefreshToken(dummyPayload);

        await AuthService.refreshSession(reuseToken);
        assert.fail("Should have triggered security revocation check");
      } catch (err: any) {
        if (err.name === "AssertionError") {
          console.error("TEST FAILED WITHOUT THROWING ERROR inside refreshSession. Stack:", err.stack);
          throw err;
        }
        console.log("SUCCESSFULLY CAUGHT SECURITY EXCEPTION:", { message: err.message, statusCode: err.statusCode, code: err.code });
        assert.strictEqual(err.statusCode, 403, "Should return 403 forbidden status");
        assert.strictEqual(err.code, "TOKEN_REUSE_DETECTED", "Should detect reuse breach");

        // Verify all sessions for the user are invalidated
        const sessionCount = await prisma.userSession.count({
          where: { userId: testUserId },
        });
        assert.strictEqual(sessionCount, 0, "All user sessions should be revoked for security");
      }
    });

    await t.test("Dynamic RBAC Permissions validation via RbacService", async () => {
      // Restore a valid session for subsequent tests if they need it
      await AuthService.login({
        email: testUserEmail,
        password: "SecurePassword123",
      });

      const hasReadPerm = await RbacService.hasPermission(testUserId, "candidates:read");
      assert.strictEqual(hasReadPerm, true, "TENANT_ADMIN should have candidate read permission");

      const hasInvalidPerm = await RbacService.hasPermission(testUserId, "non-existent-perm");
      assert.strictEqual(hasInvalidPerm, false, "Should return false for invalid permission");
    });

    await t.test("Logout invalidates session", async () => {
      // Clear all previous user sessions first to isolate session counts
      await prisma.userSession.deleteMany({ where: { userId: testUserId } });

      // Generate login session first
      const loginResult = await AuthService.login({
        email: testUserEmail,
        password: "SecurePassword123",
      });

      const logoutToken = loginResult.refreshToken;
      const sessionCountBefore = await prisma.userSession.count({
        where: { userId: testUserId },
      });
      assert.strictEqual(sessionCountBefore, 1);

      await AuthService.logout(logoutToken);

      const sessionCountAfter = await prisma.userSession.count({
        where: { userId: testUserId },
      });
      assert.strictEqual(sessionCountAfter, 0, "Session should be deleted on logout");
    });

    // ==========================================
    // CANDIDATE DOMAIN INTEGRATION TESTS
    // ==========================================

    await t.test("Create Candidate with nested profiles & validations", async () => {
      try {
        const candidateInput = {
          name: "Alice Smith",
          email: "alice.smith@example.test",
          phone: "+15559988",
          currentRole: "Frontend Engineer",
          experienceYears: 4,
          location: "New York, NY",
          skills: ["React", "TypeScript"],
          source: "SOCIAL",
          currentCtc: 95000,
          expectedCtc: 110000,
          noticeDays: 15,
          summary: "Passionate engineer focusing on user experience.",
          address: {
            addressLine1: "456 Avenue A",
            city: "New York",
            state: "NY",
            postalCode: "10009",
            country: "USA"
          },
          educations: [
            {
              degree: "B.Tech",
              fieldOfStudy: "Information Technology",
              institution: "City College",
              startDate: new Date("2015-09-01T00:00:00Z"),
              endDate: new Date("2019-05-15T00:00:00Z"),
              isCompleted: true
            }
          ],
          experiences: [
            {
              company: "Tech Solutions",
              title: "Junior Frontend Developer",
              location: "New York, NY",
              startDate: new Date("2019-06-01T00:00:00Z"),
              endDate: new Date("2021-12-31T00:00:00Z"),
              isCurrent: false,
              description: "Built landing pages and user dashboards."
            },
            {
              company: "SaaS Systems",
              title: "Frontend Developer",
              location: "Remote",
              startDate: new Date("2022-01-01T00:00:00Z"),
              isCurrent: true,
              description: "Maintained design system libraries."
            }
          ],
          skillsList: [
            {
              name: "React",
              rating: 5,
              yearsOfExperience: 4
            }
          ],
          languages: [
            {
              language: "English",
              proficiency: "FLUENT"
            }
          ],
          certifications: [
            {
              name: "React Native Professional",
              issuingOrganization: "Meta"
            }
          ],
          documents: [
            {
              name: "alice_resume.pdf",
              documentType: "RESUME",
              fileUrl: "https://cloudinary.com/resumes/alice_resume.pdf",
              fileSize: 120000,
              checksum: "hash_alice_resume_123"
            }
          ],
          tags: ["Strong-JS", "Remote-Ready"]
        };

        // Act
        const candidate = await CandidateService.createCandidate(testTenantId, candidateInput, testUserId);
        
        // Assert
        assert.ok(candidate.id, "Candidate ID should be populated");
        assert.strictEqual(candidate.name, "Alice Smith");
        candidate1Id = candidate.id;

        // Verify relations
        const countAddress = await prisma.candidateAddress.count({ where: { candidateId: candidate1Id } });
        assert.strictEqual(countAddress, 1, "Should create nested address");

        const countEdu = await prisma.candidateEducation.count({ where: { candidateId: candidate1Id } });
        assert.strictEqual(countEdu, 1, "Should create nested education");

        const countExp = await prisma.candidateExperience.count({ where: { candidateId: candidate1Id } });
        assert.strictEqual(countExp, 2, "Should create nested experience records");

        const countSkills = await prisma.candidateSkill.count({ where: { candidateId: candidate1Id } });
        assert.strictEqual(countSkills, 1, "Should create nested skill list");

        const countDocs = await prisma.candidateDocument.count({ where: { candidateId: candidate1Id } });
        assert.strictEqual(countDocs, 1, "Should create nested documents");

        // Try creating duplicate candidate (email duplicate)
        try {
          await CandidateService.createCandidate(testTenantId, {
            name: "Alice Duplicate",
            email: "alice.smith@example.test",
          }, testUserId);
          assert.fail("Should throw duplicate email error");
        } catch (err: any) {
          if (err.name === "AssertionError") throw err;
          assert.strictEqual(err.statusCode, 409, "Should throw 409 conflict");
          assert.strictEqual(err.code, "DUPLICATE_EMAIL");
        }

        // Try creating duplicate candidate (phone duplicate)
        try {
          await CandidateService.createCandidate(testTenantId, {
            name: "Alice Phone Dup",
            email: "alice.different@example.test",
            phone: "+15559988",
          }, testUserId);
          assert.fail("Should throw duplicate phone error");
        } catch (err: any) {
          if (err.name === "AssertionError") throw err;
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.code, "DUPLICATE_PHONE");
        }

        // Try creating duplicate candidate (resume checksum duplicate)
        try {
          await CandidateService.createCandidate(testTenantId, {
            name: "Alice Resume Dup",
            email: "alice.different2@example.test",
            documents: [
              {
                name: "same_resume.pdf",
                documentType: "RESUME",
                fileUrl: "https://cloudinary.com/resumes/alice_resume.pdf",
                checksum: "hash_alice_resume_123"
              }
            ]
          }, testUserId);
          assert.fail("Should throw duplicate resume error");
        } catch (err: any) {
          if (err.name === "AssertionError") throw err;
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.code, "DUPLICATE_RESUME");
        }
      } catch (error: any) {
        console.error("CREATE CANDIDATE TEST ERROR DETECTED:", error);
        throw error;
      }
    });

    await t.test("Retrieve Candidate and Update Profile Audit Trails", async () => {
      // Retrieve
      const candidate = await CandidateRepository.findById(testTenantId, candidate1Id);
      assert.ok(candidate);
      assert.strictEqual(candidate.address?.city, "New York");

      // Update
      await CandidateService.updateCandidate(testTenantId, candidate1Id, {
        currentRole: "Lead Frontend Engineer",
        expectedCtc: 120000,
      }, testUserId);

      // Verify timeline event — no setTimeout needed: publish() is fully awaited
      const timeline = await prisma.candidateTimeline.findFirst({
        where: { candidateId: candidate1Id, eventType: "CandidateUpdated" },
      });
      assert.ok(timeline, "Should record CandidateUpdated in timeline");
      assert.ok(timeline.metadata, "Timeline event should contain changes metadata");
    });

    await t.test("Query Candidates list with search & cursor pagination", async () => {
      // Seed second candidate
      const candidate2 = await CandidateService.createCandidate(testTenantId, {
        name: "Bob Builder",
        email: "bob.builder@example.test",
        phone: "+15557766",
        currentRole: "Backend Architect",
        experienceYears: 10,
        location: "San Jose, CA",
        skills: ["Node.js", "PostgreSQL", "React"],
        source: "PORTAL",
        currentCtc: 150000,
        expectedCtc: 180000,
        noticeDays: 60,
      }, testUserId);

      candidate2Id = candidate2.id;

      // Filter by name search
      const listResult = await CandidateRepository.findManyPaginated(
        testTenantId,
        { search: "Bob" },
        { limit: 5 }
      );
      assert.strictEqual(listResult.data.length, 1);
      assert.strictEqual(listResult.data[0].name, "Bob Builder");

      // Filter by skill search (skills list includes "React")
      const listReact = await CandidateRepository.findManyPaginated(
        testTenantId,
        { skills: ["React"] },
        { limit: 5 }
      );
      // Both Alice and Bob should match since both have React skill
      assert.strictEqual(listReact.data.length, 2);

      // Test saved filters
      const saved = await CandidateRepository.saveFilter(testTenantId, testUserId, "React Senior", { skills: ["React"] });
      assert.ok(saved.id);
      assert.strictEqual(saved.name, "React Senior");
    });

    await t.test("Merge Candidate Profiles", async () => {
      // Add note to source candidate Bob
      await prisma.candidateNote.create({
        data: {
          tenantId: testTenantId,
          candidateId: candidate2Id,
          authorId: testUserId,
          content: "Bob is a great backend dev."
        }
      });

      // Merge Bob (source) into Alice (target)
      const mergedTarget = await CandidateService.mergeCandidates(testTenantId, candidate2Id, candidate1Id, testUserId);
      assert.ok(mergedTarget);
      
      // Bob should be soft deleted
      const checkBob = await CandidateRepository.findById(testTenantId, candidate2Id);
      assert.strictEqual(checkBob, null, "Source candidate profile should be soft-deleted");

      // Note from Bob should be transferred to Alice
      const countTargetNotes = await prisma.candidateNote.count({ where: { candidateId: candidate1Id } });
      assert.strictEqual(countTargetNotes, 1, "Target candidate should have inherited the note");

      // Timeline event created
      const mergeTimeline = await prisma.candidateTimeline.findFirst({
        where: { candidateId: candidate1Id, eventType: "CandidateMerged" }
      });
      assert.ok(mergeTimeline, "Timeline should record merge transaction");
    });

    await t.test("Soft delete, restore and permanent delete candidates", async () => {
      // Soft Delete
      await CandidateService.softDeleteCandidate(testTenantId, candidate1Id, testUserId);
      const deleted = await CandidateRepository.findById(testTenantId, candidate1Id);
      assert.strictEqual(deleted, null, "Should not return soft-deleted profile in standard queries");

      // Restore
      await CandidateService.restoreCandidate(testTenantId, candidate1Id, testUserId);
      const restored = await CandidateRepository.findById(testTenantId, candidate1Id);
      assert.ok(restored, "Should return restored profile");

      // Permanent delete
      await CandidateService.permanentDeleteCandidate(testTenantId, candidate1Id);
      const permanent = await CandidateRepository.findById(testTenantId, candidate1Id, true);
      assert.strictEqual(permanent, null, "Should remove profile completely from DB");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Company Domain Integration Tests
    // ─────────────────────────────────────────────────────────────────────────

    let company1Id = "";
    let company2Id = "";

    await t.test("Create Company with nested records", async () => {
      const company = await CompanyService.createCompany(testTenantId, {
        name: "Acme Corporation",
        industry: "Aerospace",
        website: "https://acme.org",
        gstin: "27AAAAA1111A1Z1",
        pan: "AAAAA1111A",
        cin: "U11111MH2026PTC111111",
        email: "contact@acme.org",
        phone: "+919876543210",
        employeeCount: 500,
        companyType: "PRIVATE_LIMITED",
        description: "Leading manufacturer of cartoon traps.",
        address: {
          addressLine1: "123 Rocket Way",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
        contacts: [
          {
            name: "Wile E. Coyote",
            email: "wile@acme.org",
            phone: "+919876543211",
            designation: "Chief Trapper",
            contactType: "TECHNICAL",
            isPrimary: true,
          }
        ],
        departments: [
          {
            name: "Research & Development",
            headName: "Road Runner",
            headEmail: "runner@acme.org",
            description: "Developing speed-related technologies.",
          }
        ],
        tags: ["enterprise", "strategic"],
      }, testUserId);

      assert.ok(company.id, "Company ID should be defined");
      assert.strictEqual(company.name, "Acme Corporation");
      company1Id = company.id;

      // Verify nested address
      const companyWithRelations = await CompanyRepository.findById(testTenantId, company.id);
      assert.ok(companyWithRelations);
      assert.strictEqual(companyWithRelations.address?.city, "Mumbai");
      assert.strictEqual(companyWithRelations.contacts.length, 1);
      assert.strictEqual(companyWithRelations.contacts[0].name, "Wile E. Coyote");
      assert.strictEqual(companyWithRelations.departments.length, 1);
      assert.strictEqual(companyWithRelations.departments[0].name, "Research & Development");
      assert.deepStrictEqual(companyWithRelations.tags.map(t => t.name), ["enterprise", "strategic"]);

      // Verify Event timelines/audits were written synchronously
      const timeline = await prisma.companyTimeline.findFirst({
        where: { companyId: company.id, eventType: "CompanyCreated" },
      });
      assert.ok(timeline, "Timeline entry should be auto-created by handler");

      const audit = await prisma.activityLog.findFirst({
        where: { tenantId: testTenantId, entityId: company.id, action: "CREATE" },
      });
      assert.ok(audit, "Audit log should be auto-created by handler");
    });

    await t.test("Duplicate Company checks", async () => {
      // Test duplicate name
      try {
        await CompanyService.createCompany(testTenantId, { name: "Acme Corporation" }, testUserId);
        assert.fail("Should throw on duplicate name");
      } catch (err: any) {
        if (err.name === "AssertionError") throw err;
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, "DUPLICATE_COMPANY_NAME");
      }

      // Test duplicate GSTIN
      try {
        await CompanyService.createCompany(testTenantId, {
          name: "Acme Copy",
          gstin: "27AAAAA1111A1Z1",
        }, testUserId);
        assert.fail("Should throw on duplicate GSTIN");
      } catch (err: any) {
        if (err.name === "AssertionError") throw err;
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, "DUPLICATE_GSTIN");
      }
    });

    await t.test("Update Company and Verify Timeline changes", async () => {
      const updated = await CompanyService.updateCompany(testTenantId, company1Id, {
        industry: "Defense Systems",
        website: "https://defense.acme.org",
        tags: ["enterprise", "defense", "strategic"],
      }, testUserId);

      assert.strictEqual(updated.industry, "Defense Systems");

      const timeline = await prisma.companyTimeline.findFirst({
        where: { companyId: company1Id, eventType: "CompanyUpdated" },
        orderBy: { createdAt: "desc" },
      });
      assert.ok(timeline, "Timeline event should be recorded");
      const metadata = timeline.metadata as any;
      assert.strictEqual(metadata.industry.old, "Aerospace");
      assert.strictEqual(metadata.industry.new, "Defense Systems");

      const refreshed = await CompanyRepository.findById(testTenantId, company1Id);
      assert.strictEqual(refreshed?.tags.length, 3);
    });

    await t.test("Assign Recruiter and Lead Recruiter", async () => {
      const assignment = await CompanyService.assignRecruiter(testTenantId, company1Id, testUserId, true, testUserId);
      assert.ok(assignment.id);
      assert.strictEqual(assignment.isLead, true);

      const timeline = await prisma.companyTimeline.findFirst({
        where: { companyId: company1Id, eventType: "RecruiterAssigned" },
      });
      assert.ok(timeline);
      assert.strictEqual((timeline.metadata as any).isLead, true);
    });

    await t.test("Manage Company Contacts", async () => {
      // Add primary contact (should demote previous primary Wile E. Coyote)
      const contact = await CompanyService.addContact(testTenantId, company1Id, {
        name: "Road Runner",
        email: "roadrunner@acme.org",
        isPrimary: true,
        contactType: "MANAGEMENT",
      }, testUserId);

      assert.ok(contact.id);
      assert.strictEqual(contact.isPrimary, true);

      // Verify Wile is no longer primary
      const contacts = await CompanyService.getContacts(testTenantId, company1Id);
      const wile = contacts.find(c => c.name.includes("Wile"));
      assert.strictEqual(wile?.isPrimary, false, "Wile E. Coyote should be demoted from primary");
    });

    await t.test("Add Company Notes and Documents", async () => {
      const note = await CompanyService.addNote(testTenantId, company1Id, "Acme is a premium high-value account.", false, testUserId);
      assert.ok(note.id);

      const docs = await CompanyService.addDocument(testTenantId, company1Id, {
        name: "Acme Mutual NDA",
        documentType: "NDA",
        fileUrl: "https://storage.acme.org/nda.pdf",
      });
      assert.ok(docs.id);

      const notes = await CompanyService.getNotes(testTenantId, company1Id);
      assert.strictEqual(notes.length, 1);
      assert.strictEqual(notes[0].content, "Acme is a premium high-value account.");
    });

    await t.test("Query Companies list with Advanced Filters and saved search filters", async () => {
      // Create second company
      const company2 = await CompanyService.createCompany(testTenantId, {
        name: "Stark Industries",
        industry: "Defense Systems",
        website: "https://stark.com",
        email: "tony@stark.com",
        companyType: "PUBLIC_LIMITED",
        address: {
          addressLine1: "10880 Malibu Point",
          city: "Malibu",
          state: "California",
          postalCode: "90265",
          country: "USA",
        },
      }, testUserId);

      company2Id = company2.id;

      // Filter by industry
      const listDefense = await CompanyRepository.findManyPaginated(
        testTenantId,
        { industry: "Defense Systems" },
        { limit: 10 }
      );
      assert.strictEqual(listDefense.data.length, 2, "Both companies should match Defense Systems");

      // Filter by country
      const listUSA = await CompanyRepository.findManyPaginated(
        testTenantId,
        { country: "USA" },
        { limit: 10 }
      );
      assert.strictEqual(listUSA.data.length, 1);
      assert.strictEqual(listUSA.data[0].name, "Stark Industries");

      // Save and retrieve search filters
      const saved = await CompanyRepository.saveFilter(testTenantId, testUserId, "Defense Tech", { industry: "Defense Systems" });
      assert.ok(saved.id);
      
      const filters = await CompanyRepository.getFilters(testTenantId, testUserId);
      assert.ok(filters.some(f => f.name === "Defense Tech"));
    });

    await t.test("Merge Companies (Acme into Stark)", async () => {
      // Merge Acme (source) into Stark (target)
      const merged = await CompanyService.mergeCompanies(testTenantId, company1Id, company2Id, testUserId);
      assert.ok(merged);

      // Acme should be soft-deleted
      const checkAcme = await CompanyRepository.findById(testTenantId, company1Id);
      assert.strictEqual(checkAcme, null, "Source company profile should be soft-deleted");

      // Check contacts of target (Stark)
      const targetContacts = await CompanyService.getContacts(testTenantId, company2Id);
      assert.strictEqual(targetContacts.length, 2, "Target company should have inherited the 2 contacts from source company");

      // Check timeline events of target
      const timelineEvents = await CompanyService.getTimeline(testTenantId, company2Id);
      assert.ok(timelineEvents.some(e => e.eventType === "CompanyMerged"));
    });

    await t.test("Archive protection check, Restore and Permanent Delete", async () => {
      // Archive Stark (no open jobs, should succeed)
      const archived = await CompanyService.archiveCompany(testTenantId, company2Id, testUserId);
      assert.ok(archived.archivedAt);

      // Verify standard queries exclude archived by default
      const checkArchived = await CompanyRepository.findById(testTenantId, company2Id);
      assert.strictEqual(checkArchived, null);

      // Verify including archived works
      const checkWithArchived = await CompanyRepository.findById(testTenantId, company2Id, true);
      assert.ok(checkWithArchived);

      // Restore Stark
      const restored = await CompanyService.restoreCompany(testTenantId, company2Id, testUserId);
      assert.strictEqual(restored.archivedAt, null);

      // Permanent Delete Stark
      await CompanyService.permanentDeleteCompany(testTenantId, company2Id);
      const permDeleted = await CompanyRepository.findByIdIncludeDeleted(testTenantId, company2Id);
      assert.strictEqual(permDeleted, null, "Should be completely removed from DB");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Job Domain Integration Tests
    // ─────────────────────────────────────────────────────────────────────────
    let testJobId = "";
    let mockCompanyId = "";

    await t.test("Job Domain Setup (Create Mock Company)", async () => {
      const company = await CompanyService.createCompany(testTenantId, {
        name: "Job Testing Corp",
        website: "https://jobtest.corp",
        industry: "Software Engineering",
      }, testUserId);
      mockCompanyId = company.id;
      assert.ok(mockCompanyId, "Mock company ID should be generated");
    });

    await t.test("Create Job in DRAFT status with sub-relations", async () => {
      const job = await JobService.createJob(testTenantId, {
        companyId: mockCompanyId,
        title: "Principal TypeScript Engineer",
        code: "JOB-TS-001",
        description: "Looking for an expert TS developer",
        location: "Remote, India",
        jobType: "full_time",
        urgency: "HIGH",
        salaryMin: 3000000,
        salaryMax: 4500000,
        currency: "INR",
        minExperience: 8,
        maxExperience: 12,
        departments: ["Engineering", "Platform"],
        locations: [
          { city: "Bengaluru", state: "Karnataka", country: "India" },
          { city: "Pune", state: "Maharashtra", country: "India" }
        ],
        requirements: [
          { description: "Deep TypeScript knowledge", isRequired: true },
          { description: "Prisma & SQL experience", isRequired: true }
        ],
        skills: [
          { name: "TypeScript", isRequired: true },
          { name: "Node.js", isRequired: true }
        ],
        questions: [
          { questionText: "How many years of TS?", questionType: "TEXT", isRequired: true }
        ],
        tags: ["Core", "SaaS"],
      }, testUserId);

      testJobId = job.id;
      assert.ok(testJobId);
      assert.strictEqual(job.status, "DRAFT", "Initial status should be DRAFT");

      // Verify sub-relations populated in database
      const fullJob = await JobRepository.findById(testTenantId, testJobId);
      assert.ok(fullJob);
      assert.strictEqual(fullJob.departments.length, 2);
      assert.strictEqual(fullJob.locations.length, 2);
      assert.strictEqual(fullJob.requirements.length, 2);
      assert.strictEqual(fullJob.skills.length, 2);
      assert.strictEqual(fullJob.questions.length, 1);
      assert.strictEqual(fullJob.tags.length, 2);
    });

    await t.test("Submit Job for Approval", async () => {
      const job = await JobService.submitForApproval(testTenantId, testJobId, testUserId);
      assert.strictEqual(job.status, "PENDING_APPROVAL");

      // Check status history
      const history = await JobRepository.findStatusHistory(testTenantId, testJobId);
      assert.ok(history.some(h => h.oldStatus === "DRAFT" && h.newStatus === "PENDING_APPROVAL"));
    });

    await t.test("Approve Job", async () => {
      const job = await JobService.approveJob(testTenantId, testJobId, testUserId);
      assert.strictEqual(job.status, "OPEN", "Status should transition to OPEN on approval");
      assert.ok(job.approvedById === testUserId);

      // Verify event timeline recorded the approval
      const timeline = await JobService.getTimeline(testTenantId, testJobId);
      assert.ok(timeline.some(t => t.eventType === "JobApproved"), "Should have JobApproved in timeline");
    });

    await t.test("Assign Recruiter & Hiring Manager", async () => {
      // Assign recruiter
      const recAssign = await JobService.assignRecruiter(testTenantId, testJobId, testUserId, true, testUserId);
      assert.ok(recAssign.isLead);

      // Assign hiring manager
      const hmAssign = await JobService.assignHiringManager(testTenantId, testJobId, testUserId, testUserId);
      assert.ok(hmAssign.userId === testUserId);

      // Check notifications
      const notifications = await prisma.notification.findMany({
        where: { tenantId: testTenantId, recipientId: testUserId }
      });
      assert.ok(notifications.some(n => n.type === "JOB_ASSIGNED"), "Should notify assigned users");
    });

    await t.test("Clone Job Posting", async () => {
      const cloned = await JobService.cloneJob(testTenantId, testJobId, testUserId, {
        title: "Principal TS Engineer (Clone)",
        code: "JOB-TS-001-CLONE",
      });

      assert.strictEqual(cloned.title, "Principal TS Engineer (Clone)");
      assert.strictEqual(cloned.status, "DRAFT", "Cloned jobs should start as DRAFT");

      // Cleanup clone
      await JobService.permanentDeleteJob(testTenantId, cloned.id);
    });

    await t.test("Save Search Filter for Jobs", async () => {
      const filter = await JobService.saveFilter(testTenantId, testUserId, "TS Jobs", { search: "TypeScript" });
      assert.ok(filter.id);

      const filters = await JobService.getFilters(testTenantId, testUserId);
      assert.ok(filters.some(f => f.name === "TS Jobs"));
    });

    await t.test("Close and Reopen Job lifecycle", async () => {
      const closed = await JobService.closeJob(testTenantId, testJobId, "Filled role", testUserId);
      assert.strictEqual(closed.status, "CLOSED");

      const reopened = await JobService.reopenJob(testTenantId, testJobId, testUserId);
      assert.strictEqual(reopened.status, "OPEN");
    });

    await t.test("Archive & Permanent Delete Job", async () => {
      // Close job first (archiving open jobs might be blocked or allowed depending on context)
      await JobService.closeJob(testTenantId, testJobId, "Archiving", testUserId);

      // Archive job
      const archived = await JobService.archiveJob(testTenantId, testJobId, testUserId);
      assert.strictEqual(archived.status, "ARCHIVED");

      // Verify excluded from normal list
      const checkArchived = await JobRepository.findById(testTenantId, testJobId);
      assert.strictEqual(checkArchived, null);

      // Permanent delete
      await JobService.permanentDeleteJob(testTenantId, testJobId);
      const checkDeleted = await JobRepository.findByIdIncludeDeleted(testTenantId, testJobId);
      assert.strictEqual(checkDeleted, null, "Should be completely purged from database");
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  // Pipeline Domain Integration Tests
  // ─────────────────────────────────────────────────────────────────────────
  await test("Pipeline Domain Integration Suite", async (t) => {
    let pipelineCompanyId = "";
    let pipelineJobId = "";
    let pipelineCandidateId = "";
    let pipelineId = "";
    let tenantId = "";
    let userId = "";

    // ── Setup: Create Company, Job, Candidate ───────────────────────────────
    await t.test("Pipeline Domain Setup", async () => {
      // Seed permissions (idempotent)
      await RbacService.seedPermissions();

      // Re-bootstrap event handlers for this suite
      bootstrapEventHandlers();

      // Register fresh tenant & admin
      const reg = await AuthService.registerTenant({
        tenantName: "PipelineLabs Inc.",
        tenantSlug: "pipelinelabs",
        adminName: "Pipeline Admin",
        adminEmail: "pipeline-admin@pipelinelabs.test",
        adminPassword: "PipeSecure123!",
      });
      tenantId = reg.tenantId;
      userId = reg.userId;

      // Create Company
      const company = await CompanyService.createCompany(tenantId, {
        name: "Pipeline Corp",
        industry: "Technology",
      }, userId);
      pipelineCompanyId = company.id;

      // Create Job
      const job = await JobService.createJob(tenantId, {
        companyId: pipelineCompanyId,
        title: "Senior Fullstack Engineer",
        code: "PIPE-JOB-001",
        location: "Remote",
        jobType: "full_time",
        urgency: "HIGH",
      }, userId);
      pipelineJobId = job.id;

      // Create Candidate
      const candidate = await CandidateService.createCandidate(tenantId, {
        name: "Alice Pipeline",
        email: "alice.pipeline@test.com",
        phone: "+919900000001",
        currentRole: "Fullstack Developer",
        experienceYears: 6,
        location: "Bengaluru",
      }, userId);
      pipelineCandidateId = candidate.id;

      assert.ok(pipelineCompanyId, "Company ID should exist");
      assert.ok(pipelineJobId, "Job ID should exist");
      assert.ok(pipelineCandidateId, "Candidate ID should exist");
    });


    // ── Test 1: Add Candidate to Pipeline ──────────────────────────────────
    await t.test("Add Candidate to Job Pipeline", async () => {

      const pipeline = await PipelineService.create(tenantId, {
        candidateId: pipelineCandidateId,
        jobId:       pipelineJobId,
      }, userId);

      pipelineId = pipeline.id;

      assert.ok(pipelineId, "Pipeline ID should be generated");
      assert.strictEqual(pipeline.stage, "SOURCED", "Default stage should be SOURCED");
      assert.strictEqual(pipeline.candidateId, pipelineCandidateId);
      assert.strictEqual(pipeline.jobId, pipelineJobId);

      // Verify checklists auto-seeded
      assert.ok(pipeline.checklists.length >= 4, "Default checklist items should be seeded");
      assert.ok(pipeline.checklists.some(c => c.itemKey === "DOCUMENTS_VERIFIED"), "DOCUMENTS_VERIFIED should exist");
      assert.ok(pipeline.checklists.some(c => c.itemKey === "OFFER_ACCEPTED"), "OFFER_ACCEPTED should exist");
    });

    // ── Test 2: Prevent duplicate pipeline entry ────────────────────────────
    await t.test("Prevent Duplicate Candidate in Same Job Pipeline", async () => {

      try {
        await PipelineService.create(tenantId, {
          candidateId: pipelineCandidateId,
          jobId:       pipelineJobId,
        }, userId);
        assert.fail("Should throw 409 on duplicate pipeline entry");
      } catch (err: any) {
        if (err.name === "AssertionError") throw err;
        assert.strictEqual(err.statusCode, 409, "Should return 409 Conflict");
      }
    });

    // ── Test 3: Simple Stage Transition ────────────────────────────────────
    await t.test("Stage Transition: SOURCED → SCREENED", async () => {

      const updated = await PipelineService.updateStage(tenantId, pipelineId, {
        newStage: "SCREENED",
        reason:   "Initial screening passed",
      }, userId);

      assert.strictEqual(updated.stage, "SCREENED");

      // Verify stage history written
      const history = await prisma.pipelineHistory.findFirst({
        where: { pipelineId, newStage: "SCREENED" },
      });
      assert.ok(history, "PipelineHistory should record the transition");
      assert.strictEqual(history.oldStage, "SOURCED");
    });

    // ── Test 4: Advance to ASSESSED & SHORTLISTED ──────────────────────────
    await t.test("Stage Transition: SCREENED → ASSESSED → SHORTLISTED", async () => {

      await PipelineService.updateStage(tenantId, pipelineId, { newStage: "ASSESSED" }, userId);
      const shortlisted = await PipelineService.updateStage(tenantId, pipelineId, { newStage: "SHORTLISTED" }, userId);

      assert.strictEqual(shortlisted.stage, "SHORTLISTED");

      // Event handler should write a PipelineActivity entry for shortlisting
      const activity = await prisma.pipelineActivity.findFirst({
        where: { pipelineId, activityType: "SHORTLISTED" },
      });
      assert.ok(activity, "PipelineActivity should record shortlisting event");
    });

    // ── Test 5: Checklist invariant — block OFFER if DOCUMENTS_VERIFIED incomplete ──
    await t.test("Checklist Invariant: Block OFFER if DOCUMENTS_VERIFIED is incomplete", async () => {

      try {
        await PipelineService.updateStage(tenantId, pipelineId, { newStage: "OFFER" }, userId);
        assert.fail("Should throw 400 when DOCUMENTS_VERIFIED checklist is incomplete");
      } catch (err: any) {
        if (err.name === "AssertionError") throw err;
        assert.strictEqual(err.statusCode, 400, "Should return 400 Bad Request");
        assert.ok(err.message.includes("Checklist requirements not met"), "Error message should mention checklist");
      }
    });

    // ── Test 6: Complete checklist item, then advance to OFFER ─────────────
    await t.test("Complete Checklist Item and Advance to OFFER", async () => {

      // Mark DOCUMENTS_VERIFIED as complete
      const checked = await PipelineService.updateChecklistItem(tenantId, pipelineId, "DOCUMENTS_VERIFIED", true, userId);
      assert.ok(checked.isCompleted, "Checklist item should be marked complete");
      assert.ok(checked.completedAt, "completedAt should be set");

      // Also complete REFERENCE_CHECKED (optional but good practice)
      await PipelineService.updateChecklistItem(tenantId, pipelineId, "REFERENCE_CHECKED", true, userId);

      // Now transition to OFFER should succeed
      const offered = await PipelineService.updateStage(tenantId, pipelineId, {
        newStage: "OFFER",
        reason:   "Cleared all interview rounds",
      }, userId);
      assert.strictEqual(offered.stage, "OFFER");
    });

    // ── Test 7: Checklist invariant — block JOINING if OFFER_ACCEPTED incomplete ──
    await t.test("Checklist Invariant: Block JOINING if OFFER_ACCEPTED is incomplete", async () => {

      try {
        await PipelineService.updateStage(tenantId, pipelineId, { newStage: "JOINING" }, userId);
        assert.fail("Should throw 400 when OFFER_ACCEPTED checklist is incomplete");
      } catch (err: any) {
        if (err.name === "AssertionError") throw err;
        assert.strictEqual(err.statusCode, 400, "Should return 400 Bad Request");
        assert.ok(err.message.includes("Checklist requirements not met"), "Error message should mention checklist");
      }
    });

    // ── Test 8: Accept offer and advance to JOINING (Hired!) ───────────────
    await t.test("Accept Offer and Advance to JOINING — Candidate Hired", async () => {

      // Mark OFFER_ACCEPTED as complete
      await PipelineService.updateChecklistItem(tenantId, pipelineId, "OFFER_ACCEPTED", true, userId);

      const joining = await PipelineService.updateStage(tenantId, pipelineId, {
        newStage: "JOINING",
        reason:   "Offer accepted, joining confirmed",
      }, userId);
      assert.strictEqual(joining.stage, "JOINING");

      // CandidateHiredEvent should have written a PipelineActivity of type HIRED
      const hiredActivity = await prisma.pipelineActivity.findFirst({
        where: { pipelineId, activityType: "HIRED" },
      });
      assert.ok(hiredActivity, "PipelineActivity should record HIRED event");
    });

    // ── Test 9: Pipeline Notes CRUD ────────────────────────────────────────
    await t.test("Pipeline Notes — Create and Delete", async () => {

      const note = await PipelineService.createNote(tenantId, pipelineId, {
        content:   "Candidate is a strong communicator. Recommend fast-tracking.",
        isPrivate: false,
      }, userId);

      assert.ok(note.id, "Note should have an ID");
      assert.strictEqual(note.content, "Candidate is a strong communicator. Recommend fast-tracking.");
      assert.strictEqual(note.authorId, userId);

      // Verify note appears in pipeline
      const pipeline = await PipelineService.findById(tenantId, pipelineId);
      assert.ok(pipeline.pipelineNotes.some(n => n.id === note.id));

      // Delete note
      const deleted = await PipelineService.deleteNote(tenantId, note.id);
      assert.ok(deleted);

      const pipelineAfter = await PipelineService.findById(tenantId, pipelineId);
      assert.ok(!pipelineAfter.pipelineNotes.some(n => n.id === note.id), "Note should be removed");
    });

    // ── Test 10: Pipeline Attachments CRUD ─────────────────────────────────
    await t.test("Pipeline Attachments — Create and Delete", async () => {

      const attachment = await PipelineService.createAttachment(tenantId, pipelineId, {
        name:    "Alice_Pipeline_Resume.pdf",
        fileUrl: "https://storage.example.com/alice-resume.pdf",
        fileKey: "alice-resume-2026.pdf",
        fileSize: 204800,
      }, userId);

      assert.ok(attachment.id);
      assert.strictEqual(attachment.name, "Alice_Pipeline_Resume.pdf");

      const deleted = await PipelineService.deleteAttachment(tenantId, attachment.id);
      assert.ok(deleted);
    });

    // ── Test 11: Pipeline Ratings ───────────────────────────────────────────
    await t.test("Pipeline Ratings — Submit and Verify", async () => {

      const rating = await PipelineService.updateRating(tenantId, pipelineId, {
        recruiterRating: 5,
        technicalRating: 4,
        hrRating:        5,
        overallRating:   5,
        feedback:        "Excellent candidate. Top-tier communication and technical skills.",
      }, userId);

      assert.ok(rating.id);
      assert.strictEqual(rating.recruiterRating, 5);
      assert.strictEqual(rating.overallRating, 5);

      // Verify RatingUpdated event fired — PipelineActivity should not be set
      // but Notification could be written. Just verify rating record itself.
      const pipeline = await PipelineService.findById(tenantId, pipelineId);
      assert.ok(pipeline.ratings.length >= 1, "Pipeline should have at least one rating");
    });

    // ── Test 12: Pipeline Reminders ─────────────────────────────────────────
    await t.test("Pipeline Reminders — Create and Complete", async () => {

      const remindAt = new Date();
      remindAt.setDate(remindAt.getDate() + 3); // 3 days from now

      const reminder = await PipelineService.createReminder(tenantId, pipelineId, {
        userId,
        title:        "Follow up on joining documents",
        description:  "Remind Alice to submit her documents",
        reminderType: "FOLLOW_UP",
        remindAt,
      }, userId);

      assert.ok(reminder.id);
      assert.strictEqual(reminder.reminderType, "FOLLOW_UP");
      assert.strictEqual(reminder.isCompleted, false);

      // Mark reminder as completed
      const completed = await PipelineService.updateReminderCompletion(tenantId, reminder.id, true);
      assert.strictEqual(completed.isCompleted, true);

      // Verify notification was created by event handler
      const notification = await prisma.notification.findFirst({
        where: { tenantId, type: "PIPELINE_REMINDER", entityId: pipelineId },
      });
      assert.ok(notification, "Notification should be created for the reminder");
    });

    // ── Test 13: Soft Delete & Restore Pipeline ─────────────────────────────
    await t.test("Pipeline Soft Delete and Restore", async () => {

      // Create a fresh pipeline entry for a second candidate
      const candidate2 = await CandidateService.createCandidate(tenantId, {
        name: "Bob Pipeline",
        email: "bob.pipeline@test.com",
        phone: "+919900000002",
        currentRole: "Backend Developer",
        experienceYears: 4,
        location: "Pune",
      }, userId);

      const secondJob = await JobService.createJob(tenantId, {
        companyId: pipelineCompanyId,
        title:     "Backend Node.js Developer",
        code:      "PIPE-JOB-002",
        location:  "Pune",
        jobType:   "full_time",
        urgency:   "HIGH",
      }, userId);

      const p2 = await PipelineService.create(tenantId, {
        candidateId: candidate2.id,
        jobId:       secondJob.id,
      }, userId);

      // Soft delete
      const deleted = await PipelineService.softDelete(tenantId, p2.id, userId);
      assert.ok(deleted.deletedAt, "deletedAt should be set on soft delete");

      // Should not appear in normal queries
      const list = await PipelineService.findMany(tenantId, {});
      assert.ok(!list.items.some(p => p.id === p2.id), "Soft deleted record should be excluded");

      // Restore
      const restored = await PipelineService.restore(tenantId, p2.id, userId);
      assert.strictEqual(restored.deletedAt, null, "deletedAt should be null after restore");
    });

    // ── Test 14: Bulk Stage Move ────────────────────────────────────────────
    await t.test("Bulk Stage Move — Multiple Candidates to SCREENED", async () => {

      // Create two fresh candidates & pipelines for a new job
      const bulkJob = await JobService.createJob(tenantId, {
        companyId: pipelineCompanyId,
        title:     "Bulk Test Position",
        code:      "PIPE-JOB-BULK",
        location:  "Remote",
        jobType:   "full_time",
        urgency:   "HIGH",
      }, userId);

      const cA = await CandidateService.createCandidate(tenantId, {
        name: "Bulk CandidateA",
        email: "bulk.a@test.com", phone: "+919900000010",
        currentRole: "Engineer", experienceYears: 3, location: "Delhi",
      }, userId);

      const cB = await CandidateService.createCandidate(tenantId, {
        name: "Bulk CandidateB",
        email: "bulk.b@test.com", phone: "+919900000011",
        currentRole: "Engineer", experienceYears: 5, location: "Chennai",
      }, userId);

      const pA = await PipelineService.create(tenantId, { candidateId: cA.id, jobId: bulkJob.id }, userId);
      const pB = await PipelineService.create(tenantId, { candidateId: cB.id, jobId: bulkJob.id }, userId);

      // Bulk move both to SCREENED
      const result = await PipelineService.bulkUpdateStage(tenantId, [pA.id, pB.id], {
        newStage: "SCREENED",
        reason:   "Initial screening batch approved",
      }, userId);

      assert.strictEqual(result.updatedCount, 2, "Both candidates should be moved");
      assert.ok(result.items.every(p => p.stage === "SCREENED"), "All updated records should be SCREENED");
    });

    // ── Test 15: Pipeline Metrics ───────────────────────────────────────────
    await t.test("Pipeline Metrics — Validate Dashboard Calculations", async () => {

      const metrics = await PipelineService.getPipelineMetrics(tenantId);

      assert.ok(typeof metrics.conversionRate === "number", "Conversion rate should be a number");
      assert.ok(typeof metrics.dropOffRate === "number", "Drop-off rate should be a number");
      assert.ok(metrics.candidatesPerStage, "candidatesPerStage map should exist");
      assert.ok(metrics.pipelineHealth, "pipelineHealth should exist");
      assert.ok(Array.isArray(metrics.recruiterPerformance), "recruiterPerformance should be an array");

      logger.info(`Metrics snapshot: Conversion=${metrics.conversionRate}%, DropOff=${metrics.dropOffRate}%, Health Score=${metrics.pipelineHealth.healthScore}`);
    });

    // ── Internal Screening Domain Integration Suite ──────────────────────────
    await t.test("Internal Screening Domain — 99 Placement Workflow", async (st) => {
      let screeningId = "";
      let activePipelineId = "";
      let rejectPipelineId = "";

      // Setup candidates and pipelines for screening tests
      await st.test("Setup Candidate & Job for Screening", async () => {
        const company = await CompanyService.createCompany(tenantId, { name: "99 Screening Corp" }, userId);
        const job = await JobService.createJob(tenantId, {
          companyId: company.id,
          title: "Screening Specialist",
          location: "Mumbai",
          code: "SCR-99",
        }, userId);

        const candidateA = await CandidateService.createCandidate(tenantId, {
          name: "John Screening",
          email: "john.screen@99placement.test",
        }, userId);

        const candidateB = await CandidateService.createCandidate(tenantId, {
          name: "Jane Reject",
          email: "jane.reject@99placement.test",
        }, userId);

        const pipelineA = await PipelineService.create(tenantId, { candidateId: candidateA.id, jobId: job.id }, userId);
        const pipelineB = await PipelineService.create(tenantId, { candidateId: candidateB.id, jobId: job.id }, userId);

        activePipelineId = pipelineA.id;
        rejectPipelineId = pipelineB.id;

        assert.ok(activePipelineId && rejectPipelineId, "Pipelines setup successfully");
      });

      await st.test("Schedule Internal Screening Interview", async () => {
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
        const screening = await ScreeningService.scheduleScreening(tenantId, {
          pipelineId: activePipelineId,
          interviewerId: userId,
          scheduledAt,
          mode: "phone",
        }, userId);

        screeningId = screening.id;
        assert.ok(screeningId, "Screening should be successfully scheduled");
        assert.strictEqual(screening.mode, "phone");
        assert.strictEqual(screening.verdict, null, "Scheduled screening must not have a verdict yet");
      });

      await st.test("Prevent Scheduling Multiple Active Screenings for Same Pipeline", async () => {
        const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await assert.rejects(
          ScreeningService.scheduleScreening(tenantId, {
            pipelineId: activePipelineId,
            interviewerId: userId,
            scheduledAt,
          }, userId),
          /An active screening interview already exists/,
          "Should block duplicate active screening schedule",
        );
      });

      await st.test("Reschedule Screening Interview", async () => {
        const newScheduledAt = new Date(Date.now() + 36 * 60 * 60 * 1000);
        const updated = await ScreeningService.rescheduleScreening(tenantId, screeningId, {
          scheduledAt: newScheduledAt,
          mode: "video",
        }, userId);

        assert.strictEqual(updated.mode, "video");
        assert.deepEqual(updated.scheduledAt, newScheduledAt, "Scheduled time should be updated");
      });

      await st.test("Submit Scorecard & Verify Automation (Verdict: SHORTLIST -> stage: ASSESSED)", async () => {
        const submission = await ScreeningService.submitScorecard(tenantId, screeningId, {
          scorecard: {
            communicationScore: 8,
            technicalScore: 9,
            experienceScore: 7,
            salaryAlignScore: 9,
            noticePeriodScore: 10,
            personalityScore: 8,
          },
          verdict: "SHORTLIST",
          recommendation: "Highly recommended for developer role",
          notes: "Strong technical skills, very articulate.",
          currentCtcDisclosed: 800000,
          expectedCtcDisclosed: 1100000,
          noticePeriodDays: 30,
          canJoinEarlier: true,
          criteriaScores: [
            { criterion: "System Design", score: 8, notes: "Good core grasp" },
            { criterion: "Coding", score: 9, notes: "Clean implementation" },
          ],
        }, userId);

        assert.strictEqual(submission.verdict, "SHORTLIST");
        // Average score check: (8+9+7+9+10+8)/6 = 8.5 -> rounded overall score = 9
        assert.strictEqual(submission.overallScore, 9, "Overall score average calculation mismatch");
        assert.strictEqual(submission.criteriaScores.length, 2, "Criteria scores count mismatch");

        // Verify automatic pipeline stage advancement
        const pipeline = await PipelineRepository.findById(tenantId, activePipelineId);
        assert.strictEqual(pipeline.stage, "ASSESSED", "Shortlisted candidate must advance to ASSESSED stage automatically");
      });

      await st.test("Submit Scorecard (Verdict: REJECT -> stage: REJECTED)", async () => {
        // Schedule screening for candidate B first
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const screeningB = await ScreeningService.scheduleScreening(tenantId, {
          pipelineId: rejectPipelineId,
          interviewerId: userId,
          scheduledAt,
        }, userId);

        const submission = await ScreeningService.submitScorecard(tenantId, screeningB.id, {
          scorecard: {
            communicationScore: 4,
            technicalScore: 3,
            experienceScore: 4,
          },
          verdict: "REJECT",
          recommendation: "Not suitable",
        }, userId);

        assert.strictEqual(submission.verdict, "REJECT");

        // Verify pipeline stage moved to REJECTED
        const pipeline = await PipelineRepository.findById(tenantId, rejectPipelineId);
        assert.strictEqual(pipeline.stage, "REJECTED", "Rejected candidate must move to REJECTED stage automatically");
      });

      await st.test("Verify Screening Metrics", async () => {
        const metrics = await ScreeningService.getMetrics(tenantId);
        assert.strictEqual(metrics.total, 2, "Total screening count mismatch");
        assert.strictEqual(metrics.shortlisted, 1);
        assert.strictEqual(metrics.rejected, 1);
        assert.strictEqual(metrics.conducted, 2);
        assert.strictEqual(metrics.pending, 0);
        assert.ok(metrics.averageScore > 0, "Average score must be calculated");
      });

      await st.test("Verify Side-Effects (Timeline Entries)", async () => {
        const timeline = await prisma.candidateTimeline.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
        });

        const completedEvents = timeline.filter(t => t.eventType === "ScreeningConducted");
        assert.strictEqual(completedEvents.length, 2, "Both completed events must be written to timeline");
      });

      await st.test("Cancel Screening Interview", async () => {
        // Schedule a third screening to cancel it
        const candidateC = await CandidateService.createCandidate(tenantId, {
          name: "Cancel Target",
          email: "cancel@99placement.test",
        }, userId);
        const pipeline = await PipelineService.create(tenantId, { candidateId: candidateC.id, jobId: (await prisma.job.findFirst({ where: { tenantId } }))!.id }, userId);

        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const screening = await ScreeningService.scheduleScreening(tenantId, {
          pipelineId: pipeline.id,
          interviewerId: userId,
          scheduledAt,
        }, userId);

        const cancelled = await ScreeningService.cancelScreening(tenantId, screening.id, "Candidate requested cancel", userId);
        assert.ok(cancelled.deletedAt !== null, "deletedAt should be set upon cancel");
      });
    });

    // ── Assessment & Scorecard Engine Integration Suite ─────────────────────
    await t.test("Assessment & Scorecard Engine — 99 Placement Evaluation Workflow", async (st) => {
      let q1Id = "";
      let q2Id = "";
      let q3Id = "";
      let q4Id = "";
      let testId = "";
      let pipelineId = "";
      let failedPipelineId = "";

      // Setup Question Bank & Pipelines
      await st.test("Setup Question Bank and Candidate Pipelines", async () => {
        // 1. Create Question Bank Questions
        const q1 = await AssessmentRepository.createQuestion({
          category: "APTITUDE",
          questionText: "What is 15% of 200?",
          options: ["15", "30", "45", "60"],
          correctOption: 1, // index 1 is "30"
          difficulty: "easy",
        });
        q1Id = q1.id;

        const q2 = await AssessmentRepository.createQuestion({
          category: "TECHNICAL",
          questionText: "Which HTTP status code represents Conflict?",
          options: ["200", "400", "404", "409"],
          correctOption: 3, // index 3 is "409"
          difficulty: "medium",
        });
        q2Id = q2.id;

        const q3 = await AssessmentRepository.createQuestion({
          category: "TECHNICAL",
          questionText: "What does HTML stand for?",
          options: ["HyperText Markup Language", "HighText Machine Language", "HyperTransfer Markup Language"],
          correctOption: 0,
          difficulty: "easy",
        });
        q3Id = q3.id;

        const q4 = await AssessmentRepository.createQuestion({
          category: "ENGLISH",
          questionText: "Choose the correct synonym for 'Ample':",
          options: ["Scarce", "Abundant", "Minimal"],
          correctOption: 1,
          difficulty: "medium",
        });
        q4Id = q4.id;

        assert.ok(q1Id && q2Id && q3Id && q4Id, "Question Bank questions seeded successfully");

        // 2. Set up pipeline in ASSESSED stage
        const company = await CompanyService.createCompany(tenantId, { name: "99 Assessment Corp" }, userId);
        const job = await JobService.createJob(tenantId, {
          companyId: company.id,
          title: "Senior Engineer",
          location: "Pune",
          code: "ENG-99",
        }, userId);

        const candA = await CandidateService.createCandidate(tenantId, {
          name: "Alice Tester",
          email: "alice.test@99placement.test",
        }, userId);

        const candB = await CandidateService.createCandidate(tenantId, {
          name: "Bob Failer",
          email: "bob.fail@99placement.test",
        }, userId);

        const pipeA = await PipelineService.create(tenantId, { candidateId: candA.id, jobId: job.id }, userId);
        const pipeB = await PipelineService.create(tenantId, { candidateId: candB.id, jobId: job.id }, userId);

        pipelineId = pipeA.id;
        failedPipelineId = pipeB.id;

        // Manually move them to ASSESSED stage (required stage to assign test)
        await prisma.candidatePipeline.update({
          where: { id: pipelineId },
          data: { stage: "ASSESSED" },
        });
        await prisma.candidatePipeline.update({
          where: { id: failedPipelineId },
          data: { stage: "ASSESSED" },
        });

        const pA = await PipelineRepository.findById(tenantId, pipelineId);
        assert.strictEqual(pA.stage, "ASSESSED", "Candidate pipeline must be in ASSESSED stage to run assessments");
      });

      await st.test("Prevent Assigment to Pipelines in Invalid Stages", async () => {
        // Create a new candidate pipeline which will be in SOURCED stage
        const cand = await CandidateService.createCandidate(tenantId, {
          name: "Sourced Only",
          email: "sourced.only@99placement.test",
        }, userId);
        const pipe = await PipelineService.create(tenantId, {
          candidateId: cand.id,
          jobId: (await prisma.job.findFirst({ where: { tenantId } }))!.id,
        }, userId);

        await assert.rejects(
          AssessmentService.assignTest(tenantId, {
            pipelineId: pipe.id,
            questionIds: [q1Id, q2Id],
          }, userId),
          /Candidate must be in ASSESSED stage to assign a test/,
          "Should block test assignment for SOURCED stage pipeline"
        );
      });

      await st.test("Assign Assessment Test with Manual Question Selection", async () => {
        const testRecord = await AssessmentService.assignTest(tenantId, {
          pipelineId,
          questionIds: [q1Id, q2Id, q4Id],
          durationMinutes: 30,
          passPercentage: 60,
        }, userId);

        testId = testRecord.id;
        assert.ok(testId, "Test successfully assigned");
        assert.strictEqual(testRecord.attemptNumber, 1, "First attempt number must be 1");
        assert.strictEqual(testRecord.totalQuestions, 3);
        assert.strictEqual(testRecord.passPercentage, 60);
        assert.strictEqual(testRecord.durationMinutes, 30);
      });

      await st.test("Assign Assessment Test with Random Question Selection", async () => {
        const randomTest = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          randomSelection: {
            categories: {
              TECHNICAL: 2, // will pick q2 and q3
              APTITUDE: 1,  // will pick q1
            },
            difficulty: "easy", // note: q2 is medium, q3 easy, q1 easy. Random filters by category & active.
          },
          durationMinutes: 15,
          passPercentage: 50,
        }, userId);

        assert.ok(randomTest.id, "Random selection test assigned");
        assert.ok(randomTest.results.length > 0, "Should have seeded questions");
      });

      await st.test("Start Assessment Test", async () => {
        const started = await AssessmentService.startTest(tenantId, testId, userId);
        assert.ok(started.startedAt, "startedAt should be populated");

        // Prevent double start
        await assert.rejects(
          AssessmentService.startTest(tenantId, testId, userId),
          /Test has already been started/,
          "Should prevent starting an already started test"
        );
      });

      await st.test("Submit Single Question Answers", async () => {
        // Question 1: Easy, Weight = 1. Let's answer CORRECTLY ("30", index 1)
        const ans1 = await AssessmentService.submitAnswer(tenantId, testId, q1Id, 1);
        assert.strictEqual(ans1.isCorrect, true);

        // Question 2: Medium, Weight = 2. Let's answer INCORRECTLY ("404", index 2)
        const ans2 = await AssessmentService.submitAnswer(tenantId, testId, q2Id, 2);
        assert.strictEqual(ans2.isCorrect, false);

        // Question 4: Medium, Weight = 2. Let's answer CORRECTLY ("Abundant", index 1)
        const ans3 = await AssessmentService.submitAnswer(tenantId, testId, q4Id, 1);
        assert.strictEqual(ans3.isCorrect, true);
      });

      await st.test("Retrieve Candidate-Facing Test (Hides correct answers)", async () => {
        const candidateTest = await AssessmentService.findTestForCandidate(tenantId, testId);
        assert.ok(candidateTest.results.every(r => !("correctOption" in r.question)), "Candidate-facing results must strip correctOption");
      });

      await st.test("Grade Assessment Test (Verdict: PASS -> stage: SHORTLISTED)", async () => {
        const completed = await AssessmentService.completeTest(tenantId, testId, userId);

        assert.ok(completed.completedAt, "completedAt should be filled");
        assert.strictEqual(completed.correctAnswers, 2); // Q1 and Q4 correct
        
        // Weighted math:
        // Q1 (easy) -> weight 1, correct.
        // Q2 (medium) -> weight 2, incorrect.
        // Q4 (medium) -> weight 2, correct.
        // Total score = 1 + 2 = 3. Max score = 1 + 2 + 2 = 5.
        // Percentage = 3/5 * 100 = 60%.
        assert.strictEqual(completed.totalScore, 3, "Weighted score incorrect");
        assert.strictEqual(completed.maxScore, 5, "Max score incorrect");
        assert.strictEqual(completed.percentage, 60, "Percentage calculation incorrect");
        assert.strictEqual(completed.verdict, "PASS", "Pass threshold 60% should issue PASS verdict");

        // Verify stage transition to SHORTLISTED
        const pipeline = await PipelineRepository.findById(tenantId, pipelineId);
        assert.strictEqual(pipeline.stage, "SHORTLISTED", "Passed candidate must move to SHORTLISTED automatically");
      });

      await st.test("Block Double Submission of Completed Test", async () => {
        await assert.rejects(
          AssessmentService.completeTest(tenantId, testId, userId),
          /Test has already been completed/,
          "Should prevent completing an already finished test"
        );
      });

      await st.test("Grade Assessment Test (Verdict: FAIL -> No automatic stage transition)", async () => {
        // Assign and start a test for Candidate B (Bob Failer)
        const bTest = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          questionIds: [q1Id, q2Id], // q1 weight 1, q2 weight 2
          passPercentage: 50,
        }, userId);

        await AssessmentService.startTest(tenantId, bTest.id, userId);

        // Submit incorrect answer to Q1
        await AssessmentService.submitAnswer(tenantId, bTest.id, q1Id, 0); // wrong
        // Submit incorrect answer to Q2
        await AssessmentService.submitAnswer(tenantId, bTest.id, q2Id, 0); // wrong

        const completed = await AssessmentService.completeTest(tenantId, bTest.id, userId);
        assert.strictEqual(completed.verdict, "FAIL");
        assert.strictEqual(completed.percentage, 0);

        // Verify stage remains ASSESSED (no automatic reject or movement)
        const pipeline = await PipelineRepository.findById(tenantId, failedPipelineId);
        assert.strictEqual(pipeline.stage, "ASSESSED", "Failed candidate should remain in ASSESSED stage");
      });

      await st.test("Retest Flow: Assign Second Test Attempt", async () => {
        const test2 = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          questionIds: [q3Id, q4Id],
          passPercentage: 50,
        }, userId);

        assert.strictEqual(test2.attemptNumber, 3, "Third attempt number must be 3");
      });

      await st.test("Auto-Submit Expired Test", async () => {
        // Assign a test and start it
        const expTest = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          questionIds: [q1Id],
          durationMinutes: 10,
        }, userId);

        await AssessmentService.startTest(tenantId, expTest.id, userId);

        // Answer it correctly
        await AssessmentService.submitAnswer(tenantId, expTest.id, q1Id, 1);

        // Artificially modify startedAt to 30 mins ago in the DB directly to simulate expiry
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        await prisma.assessmentTest.update({
          where: { id: expTest.id },
          data: { startedAt: thirtyMinsAgo },
        });

        // Trigger findTestById (or answer submission) to trigger auto-submit logic
        const testObj = await AssessmentService.findTestById(tenantId, expTest.id, userId);
        assert.ok(testObj.completedAt, "Expired test should have been auto-completed");
        assert.strictEqual(testObj.verdict, "PASS", "Should evaluate correctly based on correct answer");
      });

      await st.test("Verify Assessment Metrics", async () => {
        const metrics = await AssessmentService.getMetrics(tenantId);
        assert.ok(metrics.total >= 3, "Total tests count mismatch");
        assert.ok(metrics.passed >= 2, "Passed tests count mismatch");
        assert.ok(metrics.averagePercentage > 0, "Average percentage should be calculated");
      });

      // ── V2 UPGRADES SUBTESTS ────────────────────────────────────────────────
      let templateId = "";
      
      await st.test("Template CRUD - Create Template", async () => {
        const template = await AssessmentService.createTemplate(tenantId, {
          name: "V2 Engine Core Template",
          description: "Assessment template testing framework",
          passPercentage: 65,
          durationMinutes: 20,
          randomizationRules: {
            categories: {
              TECHNICAL: 1,
              APTITUDE: 1,
            },
          },
        }, userId);

        templateId = template.id;
        assert.ok(templateId, "Template ID should be generated");
        assert.strictEqual(template.name, "V2 Engine Core Template");
        assert.strictEqual(template.passPercentage, 65);
      });

      await st.test("Template CRUD - Retrieve Template", async () => {
        const template = await AssessmentService.findTemplateById(tenantId, templateId);
        assert.strictEqual(template.name, "V2 Engine Core Template");
      });

      await st.test("Template CRUD - List Templates", async () => {
        const list = await AssessmentService.listTemplates(tenantId);
        assert.ok(list.length >= 1);
        assert.ok(list.some(t => t.id === templateId));
      });

      await st.test("Template CRUD - Update Template", async () => {
        const updated = await AssessmentService.updateTemplate(tenantId, templateId, {
          name: "V2 Core Updated Template",
          passPercentage: 70,
        }, userId);
        assert.strictEqual(updated.name, "V2 Core Updated Template");
        assert.strictEqual(updated.passPercentage, 70);
      });

      await st.test("Template Assignment - Inherit configurations", async () => {
        const assigned = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          templateId,
        }, userId);

        assert.strictEqual(assigned.templateId, templateId);
        assert.strictEqual(assigned.passPercentage, 70); // inherited from updated template
        assert.strictEqual(assigned.durationMinutes, 20); // inherited from template
        assert.strictEqual(assigned.totalQuestions, 2); // 1 TECHNICAL + 1 APTITUDE
      });

      await st.test("Question Versioning - Increment version on edit", async () => {
        const qOriginal = await AssessmentRepository.findQuestionById(q1Id);
        assert.strictEqual(qOriginal.version, 1);

        const qNew = await AssessmentRepository.updateQuestion(q1Id, {
          questionText: "What is 15% of 200? (V2 Edited)",
        });

        assert.strictEqual(qNew.version, 2);
        assert.strictEqual(qNew.parentId, q1Id);
      });

      await st.test("Question Versioning - Deactivate old version on edit", async () => {
        const qOriginalDeactivated = await AssessmentRepository.findQuestionById(q1Id);
        assert.strictEqual(qOriginalDeactivated.isActive, false);
      });

      await st.test("Immutability - Reject answer submission on completed test", async () => {
        await assert.rejects(
          AssessmentService.submitAnswer(tenantId, testId, q2Id, 1),
          /Cannot submit answers for a completed test/,
          "Should block answer submissions for a completed test"
        );
      });

      await st.test("Immutability - Reject double completion/grade", async () => {
        await assert.rejects(
          AssessmentService.completeTest(tenantId, testId, userId),
          /Test has already been completed/,
          "Should block re-evaluating/re-grading completed test"
        );
      });

      await st.test("Timer Validation - Reject answer submission after timer expiry", async () => {
        const expiredTest = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          questionIds: [q2Id],
          durationMinutes: 10,
        }, userId);

        await AssessmentService.startTest(tenantId, expiredTest.id, userId);

        // Artificially expire the timer
        const timerExpiredStartedAt = new Date(Date.now() - 15 * 60 * 1000);
        await prisma.assessmentTest.update({
          where: { id: expiredTest.id },
          data: { startedAt: timerExpiredStartedAt },
        });

        await assert.rejects(
          AssessmentService.submitAnswer(tenantId, expiredTest.id, q2Id, 1),
          /Time limit has expired for this test/,
          "Should prevent answer submissions on timer expiry"
        );
      });

      await st.test("Analytics - Record Category Accuracy & Difficulty Accuracy", async () => {
        const testToComplete = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          questionIds: [q2Id, q3Id],
        }, userId);

        await AssessmentService.startTest(tenantId, testToComplete.id, userId);
        await AssessmentService.submitAnswer(tenantId, testToComplete.id, q2Id, 3); // correct
        await AssessmentService.submitAnswer(tenantId, testToComplete.id, q3Id, 1); // incorrect

        const completed = await AssessmentService.completeTest(tenantId, testToComplete.id, userId);
        const analytics = completed.analytics as any;

        assert.ok(analytics, "Analytics must be calculated");
        assert.ok(analytics.difficultyAccuracy, "difficultyAccuracy should be recorded");
        assert.ok(analytics.categoryAccuracy, "categoryAccuracy should be recorded");
      });

      await st.test("Recommendation Engine - Recommend topics on weak categories", async () => {
        const testToComplete = await AssessmentService.assignTest(tenantId, {
          pipelineId: failedPipelineId,
          questionIds: [q4Id],
        }, userId);

        await AssessmentService.startTest(tenantId, testToComplete.id, userId);
        await AssessmentService.submitAnswer(tenantId, testToComplete.id, q4Id, 0); // wrong answer (English category)

        const completed = await AssessmentService.completeTest(tenantId, testToComplete.id, userId);
        const recommendations = completed.recommendations as any;

        assert.ok(recommendations, "Recommendations must exist");
        assert.ok(recommendations.weakCategories.includes("ENGLISH"), "ENGLISH should be identified as weak");
        assert.ok(recommendations.recommendedTopics.length > 0, "Recommended topics should be seeded");
      });

      await st.test("Weak Question Detection - Identify too hard or too easy questions", async () => {
        // Create a question and artificially set attempts to simulate statistical thresholds
        const tooHardQuestion = await AssessmentRepository.createQuestion({
          category: "TECHNICAL",
          questionText: "What is the P-NP problem solution?",
          options: ["Option A", "Option B"],
          correctOption: 0,
          difficulty: "hard",
        });

        await prisma.assessmentQuestion.update({
          where: { id: tooHardQuestion.id },
          data: {
            totalAttempts: 10,
            correctAttempts: 0, // 0% correct (fail rate 100% >= threshold 90%)
          },
        });

        const flagged = await AssessmentService.getWeakQuestions();
        assert.ok(flagged.some(q => q.id === tooHardQuestion.id && q.status === "TOO_HARD"));
      });

      await st.test("Template Validation - Reject invalid passPercentage", async () => {
        await assert.rejects(
          AssessmentService.createTemplate(tenantId, {
            name: "Invalid Template",
            passPercentage: 150, // Max is 100
            durationMinutes: 10,
          }, userId),
          /Validation failed/,
          "Should block invalid passPercentage"
        );
      });

      await st.test("Template Validation - Reject negative durationMinutes", async () => {
        await assert.rejects(
          AssessmentService.createTemplate(tenantId, {
            name: "Invalid Template 2",
            passPercentage: 50,
            durationMinutes: -5, // Min is 1
          }, userId),
          /Validation failed/,
          "Should block negative durationMinutes"
        );
      });

      await st.test("Question Versioning - Exclude inactive/old versions from active queries", async () => {
        const activeQuestions = await AssessmentRepository.listQuestions({ isActive: true });
        assert.ok(activeQuestions.items.every((q: any) => q.isActive === true), "Only active questions should be retrieved");
        assert.ok(!activeQuestions.items.some((q: any) => q.id === q1Id), "Old version (deactivated) of q1Id should not be returned");
      });

      await st.test("Template CRUD - Delete Template", async () => {
        await AssessmentService.deleteTemplate(tenantId, templateId, userId);
        await assert.rejects(
          AssessmentService.findTemplateById(tenantId, templateId),
          /Assessment template not found/,
          "Should not find a deleted template"
        );
      });

      await st.test("Verify Timeline Domain Events Integration", async () => {
        const timeline = await prisma.candidateTimeline.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
        });

        const assigned = timeline.filter(t => t.eventType === "AssessmentAssigned");
        const started = timeline.filter(t => t.eventType === "AssessmentStarted");
        const submitted = timeline.filter(t => t.eventType === "AssessmentSubmitted");
        const evaluated = timeline.filter(t => t.eventType === "AssessmentEvaluated");

        assert.ok(assigned.length > 0, "AssessmentAssigned events should be logged to timeline");
        assert.ok(started.length > 0, "AssessmentStarted events should be logged to timeline");
        assert.ok(submitted.length > 0, "AssessmentSubmitted events should be logged to timeline");
        assert.ok(evaluated.length > 0, "AssessmentEvaluated events should be logged to timeline");
      });
    });

  });

  // ── Phase 5: Hiring Decision Engine Integration Tests ──────────────────────────────────────────
  await test("Phase 5: Hiring Decision Engine (Interview, Offer, Joining)", async (t) => {
    let testTenantId = "";
    let testUserId = "";
    let testCompany: any = null;

    let testCandidateId: string;
    let testJobId: string;
    let testPipelineId: string;

    await t.test("Setup: Register fresh tenant & admin for Phase 5", async () => {
      // Seed permissions (idempotent)
      await RbacService.seedPermissions();

      // Register fresh tenant & admin
      const reg = await AuthService.registerTenant({
        tenantName: "HiringDecision Inc.",
        tenantSlug: `hiringdecision-${Date.now()}`,
        adminName: "Decision Admin",
        adminEmail: `decision-admin-${Date.now()}@hiringdecision.test`,
        adminPassword: "DecisionSecure123!",
      });
      testTenantId = reg.tenantId;
      testUserId = reg.userId;

      // Create a Company to reuse for all jobs in our Phase 5 tests
      testCompany = await CompanyService.createCompany(testTenantId, {
        name: "Hiring Decision Corp",
        industry: "Technology",
      }, testUserId);
    });

    // Helper to setup fresh Candidate, Job, and Pipeline connection
    const setupCandidatePipeline = async (initialStage: any = "SHORTLISTED") => {
      const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const candidate = await CandidateService.createCandidate(testTenantId, {
        name: "Hiring Decision Candidate",
        email: `hiring.candidate.${uniqueId}@example.com`,
        phone: "+91" + Math.floor(1000000000 + Math.random() * 9000000000),
      }, testUserId);
      const job = await JobService.createJob(testTenantId, {
        companyId: testCompany.id,
        title: "Decision Engine Engineer",
        code: `DEC-JOB-${uniqueId}`,
        location: "Remote",
        jobType: "full_time",
        urgency: "HIGH",
      }, testUserId);
      const pipeline = await PipelineService.create(testTenantId, {
        candidateId: candidate.id,
        jobId: job.id,
      }, testUserId);

      if (initialStage !== "SOURCED") {
        await PipelineRepository.updateStage(testTenantId, pipeline.id, {
          newStage: initialStage,
          reason: "Set up test stage",
          performedById: testUserId,
        });
      }
      return { candidateId: candidate.id, jobId: job.id, pipelineId: pipeline.id };
    };

    // Pre-create a candidate/pipeline for general interview tests
    await t.test("Setup: General Candidate/Pipeline for Interview tests", async () => {
      const setup = await setupCandidatePipeline("SHORTLISTED");
      testCandidateId = setup.candidateId;
      testJobId = setup.jobId;
      testPipelineId = setup.pipelineId;
    });

    // ── INTERVIEW MANAGEMENT TESTS (10+ Tests) ──

    await t.test("Interview: Successfully schedule a valid interview", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days in future

      const interview = await InterviewService.scheduleInterview(testTenantId, {
        pipelineId: testPipelineId,
        title: "Technical Round 1",
        scheduledAt: futureDate,
        durationMin: 45,
        timezone: "Asia/Kolkata",
        interviewType: "TECHNICAL",
        mode: "VIRTUAL",
        roundNumber: 1,
        panelUserIds: [testUserId],
      }, testUserId);

      assert.strictEqual(interview.title, "Technical Round 1");
      assert.strictEqual(interview.status, "SCHEDULED");
      assert.strictEqual(interview.interviewType, "TECHNICAL");
      assert.strictEqual(interview.roundNumber, 1);
      assert.strictEqual(interview.panel.length, 1);
    });

    await t.test("Interview Validation: Block scheduling in the past", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await assert.rejects(
        InterviewService.scheduleInterview(testTenantId, {
          pipelineId: testPipelineId,
          title: "Past Interview",
          scheduledAt: pastDate,
          interviewType: "HR",
        }, testUserId),
        /Interview must be scheduled for a future date and time/
      );
    });

    await t.test("Interview Validation: Block scheduling for dropped candidate", async () => {
      const setupDropped = await setupCandidatePipeline("DROPPED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      await assert.rejects(
        InterviewService.scheduleInterview(testTenantId, {
          pipelineId: setupDropped.pipelineId,
          title: "Interview for Dropped Candidate",
          scheduledAt: futureDate,
        }, testUserId),
        /Cannot schedule interview for a dropped candidate/
      );
    });

    await t.test("Interview Invariant: Mandatory round sequencing (Block Round 2 if Round 1 not COMPLETED)", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      await assert.rejects(
        InterviewService.scheduleInterview(testTenantId, {
          pipelineId: testPipelineId,
          title: "Technical Round 2",
          scheduledAt: futureDate,
          roundNumber: 2,
        }, testUserId),
        /Cannot schedule round 2 until round 1 is completed/
      );
    });

    let round1InterviewId: string;
    await t.test("Interview: Complete Round 1 interview, then successfully schedule Round 2", async () => {
      const interviews = await InterviewRepository.findMany(testTenantId, { pipelineId: testPipelineId });
      const round1 = interviews.find(i => i.roundNumber === 1);
      assert.ok(round1);
      round1InterviewId = round1.id;

      // Mark as completed
      const updated = await InterviewService.markAsCompleted(testTenantId, round1InterviewId, testUserId);
      assert.strictEqual(updated.status, "COMPLETED");

      // Schedule round 2 should now succeed
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const round2 = await InterviewService.scheduleInterview(testTenantId, {
        pipelineId: testPipelineId,
        title: "Technical Round 2",
        scheduledAt: futureDate,
        roundNumber: 2,
      }, testUserId);

      assert.strictEqual(round2.roundNumber, 2);
      assert.strictEqual(round2.status, "SCHEDULED");
    });

    await t.test("Interview: Successfully reschedule interview to future date", async () => {
      const interviews = await InterviewRepository.findMany(testTenantId, { pipelineId: testPipelineId });
      const round2 = interviews.find(i => i.roundNumber === 2);
      assert.ok(round2);

      const newFutureDate = new Date();
      newFutureDate.setDate(newFutureDate.getDate() + 4);

      const updated = await InterviewService.rescheduleInterview(testTenantId, round2.id, {
        scheduledAt: newFutureDate,
        location: "Meeting Room A",
      }, testUserId);

      assert.strictEqual(updated.status, "SCHEDULED");
      assert.strictEqual(updated.location, "Meeting Room A");
      assert.strictEqual(updated.scheduledAt.getTime(), newFutureDate.getTime());
    });

    await t.test("Interview Rescheduling: Block rescheduling if scheduledAt is in the past", async () => {
      const interviews = await InterviewRepository.findMany(testTenantId, { pipelineId: testPipelineId });
      const round2 = interviews.find(i => i.roundNumber === 2);
      assert.ok(round2);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await assert.rejects(
        InterviewService.rescheduleInterview(testTenantId, round2.id, {
          scheduledAt: pastDate,
        }, testUserId),
        /Rescheduled time must be in the future/
      );
    });

    await t.test("Interview Feedback: Successfully submit feedback and score dimensions", async () => {
      const updated = await InterviewService.submitFeedback(testTenantId, round1InterviewId, {
        submittedById: testUserId,
        strengths: "Great coding and communication skills",
        weaknesses: "Slightly slow on edge cases",
        comments: "Highly recommended",
        recommendation: "HIRE",
        overallRating: 9,
        scores: [
          { dimension: "Coding", score: 9, notes: "Excellent logic" },
          { dimension: "System Design", score: 8 },
        ]
      }, testUserId);

      assert.strictEqual(updated.feedback.length, 1);
      assert.strictEqual(updated.feedback[0].overallRating, 9);
      assert.strictEqual(updated.feedback[0].scores.length, 2);
    });

    await t.test("Interview Feedback Invariant: Block duplicate feedback by same interviewer", async () => {
      await assert.rejects(
        InterviewService.submitFeedback(testTenantId, round1InterviewId, {
          submittedById: testUserId,
          recommendation: "HIRE",
          overallRating: 8,
        }, testUserId),
        /Feedback has already been submitted by this interviewer/
      );
    });

    await t.test("Interview Feedback Invariant: Block feedback submission on Cancelled / No-Show interview", async () => {
      const setupTemp = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const tempInterview = await InterviewService.scheduleInterview(testTenantId, {
        pipelineId: setupTemp.pipelineId,
        title: "Temp Interview to Cancel",
        scheduledAt: futureDate,
        roundNumber: 1,
      }, testUserId);

      // Cancel it
      await InterviewService.cancelInterview(testTenantId, tempInterview.id, "Candidate requested reschedule", testUserId);

      // Submit feedback should fail
      await assert.rejects(
        InterviewService.submitFeedback(testTenantId, tempInterview.id, {
          submittedById: testUserId,
          recommendation: "HIRE",
          overallRating: 7,
        }, testUserId),
        /Cannot submit feedback on a cancelled interview/
      );
    });

    await t.test("Interview: Mark interview as No-Show", async () => {
      const setupTemp = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const tempInterview = await InterviewService.scheduleInterview(testTenantId, {
        pipelineId: setupTemp.pipelineId,
        title: "Temp Interview for No-Show",
        scheduledAt: futureDate,
        roundNumber: 1,
      }, testUserId);

      const updated = await InterviewService.markAsNoShow(testTenantId, tempInterview.id, testUserId);
      assert.strictEqual(updated.status, "NO_SHOW");

      // Verify feedback blocked
      await assert.rejects(
        InterviewService.submitFeedback(testTenantId, tempInterview.id, {
          submittedById: testUserId,
          recommendation: "REJECT",
          overallRating: 1,
        }, testUserId),
        /Cannot submit feedback on a no-show interview/
      );
    });

    // ── OFFER WORKFLOW TESTS (10+ Tests) ──

    await t.test("Offer Validation: Block offer creation for sourced/screened candidate", async () => {
      const setupSourced = await setupCandidatePipeline("SOURCED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await assert.rejects(
        OfferService.createOffer(testTenantId, {
          pipelineId: setupSourced.pipelineId,
          offeredCtc: 1200000,
          designation: "Software Engineer",
          joiningDate: futureDate,
        }, testUserId),
        /Candidate must pass screening and assessments before creating an offer/
      );
    });

    let draftOfferId: string;
    await t.test("Offer: Successfully draft an offer with future joining date", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const offer = await OfferService.createOffer(testTenantId, {
        pipelineId: testPipelineId,
        offeredCtc: 1500000,
        designation: "Senior Software Engineer",
        joiningDate: futureDate,
      }, testUserId);

      assert.strictEqual(offer.designation, "Senior Software Engineer");
      assert.strictEqual(offer.offeredCtc, 1500000);
      assert.strictEqual(offer.status, "DRAFTED");
      draftOfferId = offer.id;
    });

    await t.test("Offer Validation: Block releasing a draft offer directly without approval", async () => {
      await assert.rejects(
        OfferService.releaseOffer(testTenantId, draftOfferId, testUserId),
        /Offer letter must be fully approved before release/
      );
    });

    await t.test("Offer Approval: Submit offer for approval", async () => {
      const updated = await OfferService.submitForApproval(testTenantId, draftOfferId, [testUserId], testUserId);
      assert.strictEqual(updated.status, "PENDING_APPROVAL");
      assert.strictEqual(updated.approvals.length, 1);
      assert.strictEqual(updated.approvals[0].status, "PENDING");
    });

    await t.test("Offer Approval Chain: Approving with one user completes the approval if they are the only approver", async () => {
      await OfferService.submitApprovalDecision(
        testTenantId,
        draftOfferId,
        testUserId,
        "APPROVED",
        "Looks great, compensation matches standards",
        testUserId
      );

      const populated = await OfferRepository.findById(testTenantId, draftOfferId);
      assert.strictEqual(populated.status, "APPROVED");
      const approval = populated.approvals.find((a: any) => a.approverId === testUserId);
      assert.ok(approval);
      assert.strictEqual(approval.status, "APPROVED");
    });

    await t.test("Offer Approval Invariant: Block duplicate approval by the same user", async () => {
      // Try approving again
      await assert.rejects(
        OfferService.submitApprovalDecision(
          testTenantId,
          draftOfferId,
          testUserId,
          "APPROVED",
          "Duplicate check",
          testUserId
        ),
        /Offer is not pending approval/ // because status is already APPROVED
      );
    });

    await t.test("Offer Approval Chain: Multi-approver flow logic", async () => {
      const setupOffer = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const offer = await OfferService.createOffer(testTenantId, {
        pipelineId: setupOffer.pipelineId,
        offeredCtc: 2000000,
        designation: "Lead Developer",
        joiningDate: futureDate,
      }, testUserId);

      // Submit to TWO approvers
      const approver1 = testUserId;
      const approver2 = "11111111-1111-1111-1111-111111111111"; // Mock UUID
      
      const defaultRole = await prisma.role.findFirst({
        where: { tenantId: testTenantId },
      });
      const testRoleId = defaultRole!.id;

      await prisma.user.upsert({
        where: { id: approver2 },
        update: {},
        create: {
          id: approver2,
          tenantId: testTenantId,
          email: "approver2@example.com",
          name: "Second Approver",
          roleId: testRoleId,
          passwordHash: "dummy",
        }
      });

      await OfferService.submitForApproval(testTenantId, offer.id, [approver1, approver2], testUserId);

      // Approver 1 approves
      await OfferService.submitApprovalDecision(testTenantId, offer.id, approver1, "APPROVED", "Approved by first", testUserId);
      const populated1 = await OfferRepository.findById(testTenantId, offer.id);
      assert.strictEqual(populated1.status, "PENDING_APPROVAL"); // Still pending since approver2 hasn't approved

      // Approver 2 approves -> now fully approved
      await OfferService.submitApprovalDecision(testTenantId, offer.id, approver2, "APPROVED", "Approved by second", testUserId);
      const populated2 = await OfferRepository.findById(testTenantId, offer.id);
      assert.strictEqual(populated2.status, "APPROVED");
    });

    await t.test("Offer Approval Chain: Rejection by any approver rejects the offer immediately", async () => {
      const setupOffer = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const offer = await OfferService.createOffer(testTenantId, {
        pipelineId: setupOffer.pipelineId,
        offeredCtc: 2500000,
        designation: "Architect",
        joiningDate: futureDate,
      }, testUserId);

      const approver1 = testUserId;
      const approver2 = "22222222-2222-2222-2222-222222222222";
      
      const defaultRole = await prisma.role.findFirst({
        where: { tenantId: testTenantId },
      });
      const testRoleId = defaultRole!.id;

      await prisma.user.upsert({
        where: { id: approver2 },
        update: {},
        create: {
          id: approver2,
          tenantId: testTenantId,
          email: "approver3@example.com",
          name: "Third Approver",
          roleId: testRoleId,
          passwordHash: "dummy",
        }
      });

      await OfferService.submitForApproval(testTenantId, offer.id, [approver1, approver2], testUserId);

      // Approver 2 rejects -> instantly REJECTED
      const updated = await OfferService.submitApprovalDecision(testTenantId, offer.id, approver2, "REJECTED", "Too expensive", testUserId);
      assert.strictEqual(updated.status, "REJECTED");
    });

    await t.test("Offer: Successfully release approved offer and automate stage transition to OFFER", async () => {
      const released = await OfferService.releaseOffer(testTenantId, draftOfferId, testUserId);
      assert.strictEqual(released.status, "SENT");

      // Verify candidate pipeline stage advanced to OFFER
      const pipeline = await PipelineRepository.findById(testTenantId, testPipelineId);
      assert.strictEqual(pipeline.stage, "OFFER");
    });

    await t.test("Offer Accept: Accept released offer and automate stage transition to JOINING & initialize JoiningStatus", async () => {
      const accepted = await OfferService.acceptOffer(testTenantId, draftOfferId, testUserId);
      assert.strictEqual(accepted.status, "ACCEPTED");

      // Verify candidate pipeline stage advanced to JOINING
      const pipeline = await PipelineRepository.findById(testTenantId, testPipelineId);
      assert.strictEqual(pipeline.stage, "JOINING");

      // Verify JoiningStatus record exists
      const joining = await JoiningRepository.findByPipelineId(testTenantId, testPipelineId);
      assert.ok(joining);
      assert.strictEqual(joining.bgvStatus, "pending");
      assert.strictEqual(joining.docCollectionStatus, "pending");
    });

    await t.test("Offer Decline: Decline released offer and automate stage transition to REJECTED", async () => {
      const setupOffer = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const offer = await OfferService.createOffer(testTenantId, {
        pipelineId: setupOffer.pipelineId,
        offeredCtc: 1100000,
        designation: "Intern",
        joiningDate: futureDate,
      }, testUserId);

      await OfferService.submitForApproval(testTenantId, offer.id, [testUserId], testUserId);
      await OfferService.submitApprovalDecision(testTenantId, offer.id, testUserId, "APPROVED", "Approved", testUserId);
      await OfferService.releaseOffer(testTenantId, offer.id, testUserId);

      const declined = await OfferService.declineOffer(testTenantId, offer.id, "Candidate accepted another offer", testUserId);
      assert.strictEqual(declined.status, "REJECTED");

      const pipeline = await PipelineRepository.findById(testTenantId, setupOffer.pipelineId);
      assert.strictEqual(pipeline.stage, "REJECTED");
    });

    await t.test("Offer Revoke: Revoke sent offer and automate stage transition to REJECTED", async () => {
      const setupOffer = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const offer = await OfferService.createOffer(testTenantId, {
        pipelineId: setupOffer.pipelineId,
        offeredCtc: 1200000,
        designation: "Analyst",
        joiningDate: futureDate,
      }, testUserId);

      await OfferService.submitForApproval(testTenantId, offer.id, [testUserId], testUserId);
      await OfferService.submitApprovalDecision(testTenantId, offer.id, testUserId, "APPROVED", "Approved", testUserId);
      await OfferService.releaseOffer(testTenantId, offer.id, testUserId);

      const revoked = await OfferService.revokeOffer(testTenantId, offer.id, "Business priorities changed", testUserId);
      assert.strictEqual(revoked.status, "REVOKED");

      const pipeline = await PipelineRepository.findById(testTenantId, setupOffer.pipelineId);
      assert.strictEqual(pipeline.stage, "REJECTED");
    });

    // ── JOINING & ONBOARDING LIFECYCLE TESTS (10+ Tests) ──

    await t.test("Joining: Get joining record & update onboarding progress", async () => {
      const joining = await JoiningService.getJoiningRecord(testTenantId, testPipelineId);
      assert.ok(joining);

      const updated = await JoiningService.updateOnboardingProgress(testTenantId, testPipelineId, {
        bgvStatus: "completed",
        docCollectionStatus: "completed",
        laptopIssued: true,
        idCardIssued: true,
      }, testUserId);

      assert.strictEqual(updated.bgvStatus, "completed");
      assert.strictEqual(updated.docCollectionStatus, "completed");
      assert.strictEqual(updated.laptopIssued, true);
      assert.strictEqual(updated.idCardIssued, true);
    });

    await t.test("Joining Validation: Block marking candidate as joined before planned date without override", async () => {
      // Planned date was set to 30 days in future from offer creation
      const earlyDate = new Date();
      earlyDate.setDate(earlyDate.getDate() + 5); // 5 days from now is before 30 days

      await assert.rejects(
        JoiningService.markCandidateJoined(testTenantId, testPipelineId, earlyDate, false, testUserId),
        /Cannot mark candidate as joined before the planned joining date without explicit override/
      );
    });

    await t.test("Joining: Successfully mark candidate as joined with overridePlannedDate = true", async () => {
      const joinedDate = new Date();
      joinedDate.setDate(joinedDate.getDate() + 5);

      const updated = await JoiningService.markCandidateJoined(testTenantId, testPipelineId, joinedDate, true, testUserId);
      assert.ok(updated.actualJoinedAt);
      assert.strictEqual(updated.actualJoinedAt.getTime(), joinedDate.getTime());

      // Pipeline stage advanced to POST_JOINING
      const pipeline = await PipelineRepository.findById(testTenantId, testPipelineId);
      assert.strictEqual(pipeline.stage, "POST_JOINING");
    });

    await t.test("Joining: Mark candidate as No-Show", async () => {
      const setupOffer = await setupCandidatePipeline("SHORTLISTED");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const offer = await OfferService.createOffer(testTenantId, {
        pipelineId: setupOffer.pipelineId,
        offeredCtc: 1200000,
        designation: "QA Engineer",
        joiningDate: futureDate,
      }, testUserId);

      await OfferService.submitForApproval(testTenantId, offer.id, [testUserId], testUserId);
      await OfferService.submitApprovalDecision(testTenantId, offer.id, testUserId, "APPROVED", "Approved", testUserId);
      await OfferService.releaseOffer(testTenantId, offer.id, testUserId);
      await OfferService.acceptOffer(testTenantId, offer.id, testUserId);

      const noShow = await JoiningService.markCandidateNoShow(testTenantId, setupOffer.pipelineId, testUserId);
      assert.strictEqual(noShow.bgvStatus, "failed");

      const pipeline = await PipelineRepository.findById(testTenantId, setupOffer.pipelineId);
      assert.strictEqual(pipeline.stage, "REJECTED");
    });

    await t.test("Joining: Successfully schedule a post-joining retention follow-up", async () => {
      const futureCheckDate = new Date();
      futureCheckDate.setDate(futureCheckDate.getDate() + 30);

      const followup = await JoiningService.createPostJoiningFollowup(testTenantId, {
        pipelineId: testPipelineId,
        checkType: "30_DAYS_RETENTION",
        scheduledAt: futureCheckDate,
        notes: "Discuss initial project onboarding experience.",
        retentionStatus: "RETAINED",
      }, testUserId);

      assert.strictEqual(followup.checkType, "30_DAYS_RETENTION");
      assert.strictEqual(followup.retentionStatus, "RETAINED");
      assert.strictEqual(followup.scheduledAt?.getTime(), futureCheckDate.getTime());

      const followups = await JoiningService.getPostJoiningFollowups(testTenantId, testPipelineId);
      assert.strictEqual(followups.length, 1);
      assert.strictEqual(followups[0].id, followup.id);
    });

    await t.test("Joining Followup Validation: Block follow-up creation for candidate without joining record", async () => {
      const setupNoJoining = await setupCandidatePipeline("SHORTLISTED");
      await assert.rejects(
        JoiningService.createPostJoiningFollowup(testTenantId, {
          pipelineId: setupNoJoining.pipelineId,
          checkType: "30_DAYS_RETENTION",
        }, testUserId),
        /Joining record must exist before scheduling follow-up checks/
      );
    });

    // ── AUDIT LOG & TIMELINE VERIFICATION ──

    await t.test("Verify Timeline Domain Events Integration for Hiring Decision Engine", async () => {
      const timeline = await prisma.candidateTimeline.findMany({
        where: { tenantId: testTenantId },
        orderBy: { createdAt: "desc" },
      });

      const sched = timeline.filter((item: any) => item.eventType === "InterviewScheduled");
      const resched = timeline.filter((item: any) => item.eventType === "InterviewRescheduled");
      const canc = timeline.filter((item: any) => item.eventType === "InterviewCancelled");
      const comp = timeline.filter((item: any) => item.eventType === "InterviewCompleted");
      const noshow = timeline.filter((item: any) => item.eventType === "InterviewNoShow");
      const fdbk = timeline.filter((item: any) => item.eventType === "InterviewFeedbackSubmitted");
      const offCreated = timeline.filter((item: any) => item.eventType === "OfferCreated");
      const offApproved = timeline.filter((item: any) => item.eventType === "OfferApproved");
      const offReleased = timeline.filter((item: any) => item.eventType === "OfferReleased");
      const offAccepted = timeline.filter((item: any) => item.eventType === "OfferAccepted");
      const offDeclined = timeline.filter((item: any) => item.eventType === "OfferDeclined");
      const offRevoked = timeline.filter((item: any) => item.eventType === "OfferRevoked");
      const joinSched = timeline.filter((item: any) => item.eventType === "JoiningScheduled");
      const candJoined = timeline.filter((item: any) => item.eventType === "CandidateJoined");
      const candNoShow = timeline.filter((item: any) => item.eventType === "CandidateNoShow");
      const followupCreated = timeline.filter((item: any) => item.eventType === "JoiningFollowupCreated");

      assert.ok(sched.length > 0, "InterviewScheduled event should be logged to timeline");
      assert.ok(resched.length > 0, "InterviewRescheduled event should be logged to timeline");
      assert.ok(canc.length > 0, "InterviewCancelled event should be logged to timeline");
      assert.ok(comp.length > 0, "InterviewCompleted event should be logged to timeline");
      assert.ok(noshow.length > 0, "InterviewNoShow event should be logged to timeline");
      assert.ok(fdbk.length > 0, "InterviewFeedbackSubmitted event should be logged to timeline");
      assert.ok(offCreated.length > 0, "OfferCreated event should be logged to timeline");
      assert.ok(offApproved.length > 0, "OfferApproved event should be logged to timeline");
      assert.ok(offReleased.length > 0, "OfferReleased event should be logged to timeline");
      assert.ok(offAccepted.length > 0, "OfferAccepted event should be logged to timeline");
      assert.ok(offDeclined.length > 0, "OfferDeclined event should be logged to timeline");
      assert.ok(offRevoked.length > 0, "OfferRevoked event should be logged to timeline");
      assert.ok(joinSched.length > 0, "JoiningScheduled event should be logged to timeline");
      assert.ok(candJoined.length > 0, "CandidateJoined event should be logged to timeline");
      assert.ok(candNoShow.length > 0, "CandidateNoShow event should be logged to timeline");
      assert.ok(followupCreated.length > 0, "JoiningFollowupCreated event should be logged to timeline");
    });
  });

  logger.info("Integration Tests completed successfully!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
