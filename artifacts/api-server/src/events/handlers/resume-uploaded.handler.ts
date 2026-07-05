import { IEventHandler, DomainEvent } from "../domain-event";
import { prisma } from "@workspace/db-prisma";
import { AiService } from "../../services/ai.service";
import { logger } from "../../config/logger";
import fs from "fs";
const pdf = require("pdf-parse");

export class ResumeUploadedHandler implements IEventHandler {
  async handle(event: DomainEvent): Promise<void> {
    const ev = event as any;
    const { candidateId, filePath, uploadedBy } = ev.payload;

    logger.info(`Processing RESUME_UPLOADED for candidate: ${candidateId}`);

    try {
      // 1. Read File
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found on disk: ${filePath}`);
      }
      const dataBuffer = fs.readFileSync(filePath);

      // 2. Extract Text (MVP pdf parsing)
      const pdfData = await pdf(dataBuffer);
      const rawText = pdfData.text;

      // 3. AI Parsing
      logger.info(`Extracting structured data from resume using AI for candidate: ${candidateId}`);
      const parsedData = await AiService.parseResume(rawText, ev.tenantId);

      // 4. Update Database
      await prisma.$transaction(async (tx) => {
        // Update core candidate info
        await tx.candidate.update({
          where: { id: candidateId },
          data: {
            name: parsedData.name || "Unknown Candidate",
            email: parsedData.email || `parsed_${Date.now()}@domain.com`,
            phone: parsedData.phone || null,
            currentRole: parsedData.currentRole || null,
            experienceYears: parsedData.experienceYears || null,
            skills: parsedData.skills || [],
            summary: parsedData.summary || "AI Resume parsing completed successfully.",
          }
        });

        // Clear old nested arrays if any
        await tx.candidateEducation.deleteMany({ where: { candidateId } });
        await tx.candidateExperience.deleteMany({ where: { candidateId } });

        // Insert new nested records
        if (parsedData.education && parsedData.education.length > 0) {
          await tx.candidateEducation.createMany({
            data: parsedData.education.map((edu: any) => ({
              tenantId: ev.tenantId,
              candidateId,
              degree: edu.degree,
              institution: edu.institution,
              startYear: edu.year ? edu.year - 4 : null,
              endYear: edu.year || null,
            }))
          });
        }

        if (parsedData.experience && parsedData.experience.length > 0) {
          await tx.candidateExperience.createMany({
            data: parsedData.experience.map((exp: any) => ({
              tenantId: ev.tenantId,
              candidateId,
              company: exp.company,
              title: exp.role,
              description: exp.duration, // mapping duration to description for MVP
            }))
          });
        }
        
        // Log timeline event
        await tx.candidateTimeline.create({
          data: {
            tenantId: ev.tenantId,
            candidateId,
            eventType: "RESUME_PARSED",
            title: "AI Resume Processing Complete",
            description: "The AI Intelligence Engine has successfully processed this candidate's resume.",
            performedById: uploadedBy || null
          }
        });
      });

      logger.info(`Successfully processed resume for candidate ${candidateId}`);
    } catch (error: any) {
      logger.error(`Failed to process resume for candidate ${candidateId}: ${error.message}`);
      
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { summary: `AI Resume parsing failed: ${error.message}` }
      });
      throw error; // Rethrow so the EventBus registers it as failed
    }
  }
}
