import { env } from "../config/env";
import logger from "../lib/logger";
import { prisma } from "@workspace/db-prisma";
import { SubscriptionService } from "./subscription.service";
import { AppError } from "../utils/app-error";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  currentRole?: string;
  experienceYears?: number;
  skills: string[];
  education: Array<{ degree: string; institution: string; year?: number }>;
  experience: Array<{ company: string; role: string; duration?: string }>;
  summary?: string;
}

export interface ScreeningScoreResult {
  communication: number;   // 1-10
  experience: number;      // 1-10
  skills: number;          // 1-10
  education: number;       // 1-10
  overall: number;         // 1-10
  recommendation: "SHORTLIST" | "HOLD" | "REJECT";
  reasoning: string;
}

export interface MatchScoreResult {
  matchPercentage: number; // 0-100 overall
  skillMatch: number;      // 0-100
  experienceMatch: number; // 0-100
  locationMatch: number;   // 0-100
  salaryMatch: number;     // 0-100
  educationMatch: number;  // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export interface RankedCandidate {
  candidateId: string;
  name: string;
  rankScore: number;       // 0-100
  reasoning: string;
}

// ─── Provider URL & Model Resolution ──────────────────────────────────────────

function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case "anthropic": return "https://api.anthropic.com/v1";
    case "gemini":    return "https://generativelanguage.googleapis.com/v1beta";
    case "openai":
    default:          return "https://api.openai.com/v1";
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "anthropic": return "claude-3-haiku-20240307";
    case "gemini":    return "gemini-1.5-flash";
    case "custom":    return "gpt-4o-mini";
    case "openai":
    default:          return "gpt-4o-mini";
  }
}

// ─── Core HTTP Call with Tenant Isolation & Settings Overrides ──────────────────

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  tenantId?: string
): Promise<string> {
  let provider = env.AI_PROVIDER || "openai";
  let apiKey = env.AI_API_KEY;
  let baseUrl = env.AI_BASE_URL || getDefaultBaseUrl(provider);
  let model = env.AI_MODEL || getDefaultModel(provider);

  // If a tenant ID is supplied, check for custom keys / configurations
  if (tenantId) {
    try {
      const setting = await prisma.tenantSetting.findFirst({
        where: { tenantId },
      });

      if (setting) {
        if (setting.aiProvider) {
          provider = setting.aiProvider;
        }
        if (setting.aiModel) {
          model = setting.aiModel;
        }
        if (setting.aiBaseUrl) {
          baseUrl = setting.aiBaseUrl;
        } else if (setting.aiProvider) {
          baseUrl = getDefaultBaseUrl(setting.aiProvider);
        }

        if (setting.aiApiKeyEncrypted) {
          try {
            // Decrypt / Decode the key
            apiKey = Buffer.from(setting.aiApiKeyEncrypted, "base64").toString("utf-8");
          } catch (decErr: any) {
            logger.error(`Failed to decrypt tenant AI key for: ${tenantId}: ${decErr.message}`);
          }
        }
      }
    } catch (dbErr: any) {
      logger.error(`Error loading tenant settings in AI service: ${dbErr.message}`);
    }
  }

  if (!apiKey) {
    throw AppError.badRequest(`AI API key is not configured for provider ${provider}`);
  }

  try {
    // 1. Gemini Client Format
    if (provider === "gemini") {
      const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      const data = await response.json() as any;
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    }

    // 2. Anthropic Client Format
    if (provider === "anthropic") {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await response.json() as any;
      return data?.content?.[0]?.text ?? "{}";
    }

    // 3. OpenAI / Custom compatible format
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });
    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content ?? "{}";
  } catch (err: any) {
    logger.error(`AI call failed [${provider}]: ${err.message}`);
    throw new Error(`AI service error: ${err.message}`);
  }
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ─── AI Service Methods ───────────────────────────────────────────────────────

export const AiService = {
  /**
   * Parse resume text → structured candidate profile
   */
  async parseResume(resumeText: string, tenantId?: string): Promise<ParsedResume> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "resume_parses");
    }

    const system = `You are an expert resume parser. Extract structured information from the resume text.
Return ONLY valid JSON with this structure:
{ "name": string, "email": string, "phone": string, "currentRole": string, "experienceYears": number,
  "skills": string[], "education": [{"degree": string, "institution": string, "year": number}],
  "experience": [{"company": string, "role": string, "duration": string}], "summary": string }`;

    const raw = await callAI(system, `Parse this resume:\n\n${resumeText}`, tenantId);
    
    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "resume_parses");
    }

    return safeParse<ParsedResume>(raw, { skills: [], education: [], experience: [] });
  },

  /**
   * Generate AI Screening Score for a candidate against a job
   */
  async screeningScore(
    candidateProfile: Record<string, any>,
    jobDescription: string,
    tenantId?: string
  ): Promise<ScreeningScoreResult> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "ai_credits");
    }

    const system = `You are a senior recruitment analyst. Score the candidate against the job on a scale of 1-10 for each dimension.
Return ONLY valid JSON:
{ "communication": number, "experience": number, "skills": number, "education": number, "overall": number,
  "recommendation": "SHORTLIST"|"HOLD"|"REJECT", "reasoning": string }
Be objective. Base scores strictly on the information provided.`;

    const userPrompt = `
CANDIDATE PROFILE:
${JSON.stringify(candidateProfile, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Analyze and return the JSON score.`;

    const raw = await callAI(system, userPrompt, tenantId);
    
    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "ai_credits");
    }

    const result = safeParse<ScreeningScoreResult>(raw, {
      communication: 5, experience: 5, skills: 5, education: 5, overall: 5,
      recommendation: "HOLD", reasoning: "Unable to analyze",
    });
    return result;
  },

  /**
   * Resume vs Job Match percentage
   */
  async resumeJobMatch(
    candidateProfile: Record<string, any>,
    jobJd: string,
    tenantId?: string
  ): Promise<MatchScoreResult> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "ai_matches");
    }

    const system = `You are an expert ATS system. Calculate how well the candidate matches the job across multiple dimensions.
Return ONLY valid JSON:
{ 
  "matchPercentage": number (0-100 overall), 
  "skillMatch": number (0-100), 
  "experienceMatch": number (0-100), 
  "locationMatch": number (0-100), 
  "salaryMatch": number (0-100), 
  "educationMatch": number (0-100), 
  "matchedSkills": string[], 
  "missingSkills": string[], 
  "summary": string 
}`;

    const raw = await callAI(
      system,
      `CANDIDATE: ${JSON.stringify(candidateProfile)}\n\nJOB: ${jobJd}`,
      tenantId
    );

    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "ai_matches");
    }

    return safeParse<MatchScoreResult>(raw, {
      matchPercentage: 0, skillMatch: 0, experienceMatch: 0, locationMatch: 0, salaryMatch: 0, educationMatch: 0, matchedSkills: [], missingSkills: [], summary: "Unable to analyze",
    });
  },

  /**
   * Rank multiple candidates against a job description
   */
  async rankCandidates(
    candidates: Array<{ candidateId: string; name: string; profile: Record<string, any> }>,
    jobDescription: string,
    tenantId?: string
  ): Promise<RankedCandidate[]> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "ai_credits");
    }

    const system = `You are a talent ranking system. Rank candidates for the job from best to worst.
Return ONLY valid JSON array:
[{ "candidateId": string, "name": string, "rankScore": number (0-100), "reasoning": string }]
Sort by rankScore descending.`;

    const raw = await callAI(
      system,
      `CANDIDATES: ${JSON.stringify(candidates)}\n\nJOB: ${jobDescription}`,
      tenantId
    );

    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "ai_credits");
    }

    return safeParse<RankedCandidate[]>(raw, []);
  },

  /**
   * Generate a comprehensive candidate summary
   */
  async generateSummary(candidateProfile: Record<string, any>, tenantId?: string): Promise<any> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "ai_credits");
    }

    const system = `You are an executive recruiter analyzing a candidate profile.
Provide a comprehensive analysis including the following elements.
Return ONLY valid JSON:
{
  "executiveSummary": string,
  "strengths": string[],
  "weaknesses": string[],
  "riskFactors": string[],
  "interviewTips": string[],
  "recommendedQuestions": string[],
  "hiringRecommendation": "STRONG_HIRE" | "HIRE" | "HOLD" | "REJECT",
  "confidenceScore": number (0-100)
}`;

    const raw = await callAI(system, `Generate summary for: ${JSON.stringify(candidateProfile)}`, tenantId);
    
    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "ai_credits");
    }

    return safeParse<any>(raw, { 
      executiveSummary: "Summary unavailable", 
      strengths: [], weaknesses: [], riskFactors: [], interviewTips: [], recommendedQuestions: [],
      hiringRecommendation: "HOLD", confidenceScore: 0
    });
  },

  /**
   * Suggest tailored interview questions
   */
  async suggestInterviewQuestions(
    candidateProfile: Record<string, any>,
    jobDescription: string,
    interviewType: string = "HR",
    tenantId?: string
  ): Promise<string[]> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "ai_credits");
    }

    const system = `You are an expert interviewer. Generate 8 targeted interview questions for a ${interviewType} interview.
Return ONLY valid JSON: { "questions": string[] }
Mix behavioral (STAR), technical, and situational questions based on the candidate's background.`;

    const raw = await callAI(
      system,
      `CANDIDATE: ${JSON.stringify(candidateProfile)}\n\nJOB: ${jobDescription}`,
      tenantId
    );

    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "ai_credits");
    }

    const parsed = safeParse<{ questions: string[] }>(raw, { questions: [] });
    return parsed.questions;
  },

  /**
   * AI Assessment recommendations after test completion
   */
  async assessmentRecommendations(assessmentResult: Record<string, any>, tenantId?: string): Promise<string> {
    if (tenantId) {
      await SubscriptionService.checkUsageLimit(tenantId, "ai_credits");
    }

    const system = `You are a learning & development advisor. Based on the assessment results, provide specific improvement recommendations.
Return ONLY valid JSON: { "recommendations": string }
Be constructive, specific, and actionable. Max 100 words.`;

    const raw = await callAI(
      system,
      `Assessment results: ${JSON.stringify(assessmentResult)}`,
      tenantId
    );

    if (tenantId) {
      await SubscriptionService.incrementUsage(tenantId, "ai_credits");
    }

    const parsed = safeParse<{ recommendations: string }>(raw, { recommendations: "" });
    return parsed.recommendations;
  },
};
