/**
 * AI Service — Provider-Agnostic Adapter
 *
 * Reads AI_PROVIDER, AI_API_KEY, AI_BASE_URL, AI_MODEL from environment.
 * Supports: openai, anthropic, gemini, custom (any OpenAI-compatible endpoint).
 *
 * NO API KEYS ARE HARDCODED. All configuration is via environment variables.
 */

import { env } from "../config/env";
import logger from "../lib/logger";

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
  matchPercentage: number; // 0-100
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

// ─── Provider URL Resolution ──────────────────────────────────────────────────

function getBaseUrl(): string {
  if (env.AI_BASE_URL) return env.AI_BASE_URL;
  switch (env.AI_PROVIDER) {
    case "anthropic": return "https://api.anthropic.com/v1";
    case "gemini":    return "https://generativelanguage.googleapis.com/v1beta";
    case "openai":
    default:          return "https://api.openai.com/v1";
  }
}

function getDefaultModel(): string {
  if (env.AI_MODEL) return env.AI_MODEL;
  switch (env.AI_PROVIDER) {
    case "anthropic": return "claude-3-haiku-20240307";
    case "gemini":    return "gemini-1.5-flash";
    case "custom":    return "gpt-4o-mini";
    case "openai":
    default:          return "gpt-4o-mini";
  }
}

// ─── Core HTTP Call ───────────────────────────────────────────────────────────

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.AI_API_KEY) {
    logger.warn("AI_API_KEY is not set — returning mock AI response");
    return JSON.stringify({ error: "AI_API_KEY not configured" });
  }

  const model = getDefaultModel();
  const baseUrl = getBaseUrl();

  try {
    // Gemini uses a different API format
    if (env.AI_PROVIDER === "gemini") {
      const url = `${baseUrl}/models/${model}:generateContent?key=${env.AI_API_KEY}`;
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

    // Anthropic
    if (env.AI_PROVIDER === "anthropic") {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.AI_API_KEY,
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

    // OpenAI / Custom (OpenAI-compatible)
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
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
    logger.error(`AI call failed [${env.AI_PROVIDER}]: ${err.message}`);
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
  async parseResume(resumeText: string): Promise<ParsedResume> {
    const system = `You are an expert resume parser. Extract structured information from the resume text.
Return ONLY valid JSON with this structure:
{ "name": string, "email": string, "phone": string, "currentRole": string, "experienceYears": number,
  "skills": string[], "education": [{"degree": string, "institution": string, "year": number}],
  "experience": [{"company": string, "role": string, "duration": string}], "summary": string }`;

    const raw = await callAI(system, `Parse this resume:\n\n${resumeText}`);
    return safeParse<ParsedResume>(raw, { skills: [], education: [], experience: [] });
  },

  /**
   * Generate AI Screening Score for a candidate against a job
   */
  async screeningScore(
    candidateProfile: Record<string, any>,
    jobDescription: string,
  ): Promise<ScreeningScoreResult> {
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

    const raw = await callAI(system, userPrompt);
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
  ): Promise<MatchScoreResult> {
    const system = `You are an expert ATS system. Calculate how well the candidate matches the job.
Return ONLY valid JSON:
{ "matchPercentage": number (0-100), "matchedSkills": string[], "missingSkills": string[], "summary": string }`;

    const raw = await callAI(
      system,
      `CANDIDATE: ${JSON.stringify(candidateProfile)}\n\nJOB: ${jobJd}`,
    );
    return safeParse<MatchScoreResult>(raw, {
      matchPercentage: 0, matchedSkills: [], missingSkills: [], summary: "Unable to analyze",
    });
  },

  /**
   * Rank multiple candidates against a job description
   */
  async rankCandidates(
    candidates: Array<{ candidateId: string; name: string; profile: Record<string, any> }>,
    jobDescription: string,
  ): Promise<RankedCandidate[]> {
    const system = `You are a talent ranking system. Rank candidates for the job from best to worst.
Return ONLY valid JSON array:
[{ "candidateId": string, "name": string, "rankScore": number (0-100), "reasoning": string }]
Sort by rankScore descending.`;

    const raw = await callAI(
      system,
      `CANDIDATES: ${JSON.stringify(candidates)}\n\nJOB: ${jobDescription}`,
    );
    return safeParse<RankedCandidate[]>(raw, []);
  },

  /**
   * Generate a professional candidate summary
   */
  async generateSummary(candidateProfile: Record<string, any>): Promise<string> {
    const system = `You are a professional recruiter writing a candidate summary for a hiring manager.
Write a concise 2-paragraph summary (max 150 words) highlighting key strengths and fit.
Return ONLY valid JSON: { "summary": string }`;

    const raw = await callAI(system, `Generate summary for: ${JSON.stringify(candidateProfile)}`);
    const parsed = safeParse<{ summary: string }>(raw, { summary: "" });
    return parsed.summary;
  },

  /**
   * Suggest tailored interview questions
   */
  async suggestInterviewQuestions(
    candidateProfile: Record<string, any>,
    jobDescription: string,
    interviewType: string = "HR",
  ): Promise<string[]> {
    const system = `You are an expert interviewer. Generate 8 targeted interview questions for a ${interviewType} interview.
Return ONLY valid JSON: { "questions": string[] }
Mix behavioral (STAR), technical, and situational questions based on the candidate's background.`;

    const raw = await callAI(
      system,
      `CANDIDATE: ${JSON.stringify(candidateProfile)}\n\nJOB: ${jobDescription}`,
    );
    const parsed = safeParse<{ questions: string[] }>(raw, { questions: [] });
    return parsed.questions;
  },

  /**
   * AI Assessment recommendations after test completion
   */
  async assessmentRecommendations(assessmentResult: Record<string, any>): Promise<string> {
    const system = `You are a learning & development advisor. Based on the assessment results, provide specific improvement recommendations.
Return ONLY valid JSON: { "recommendations": string }
Be constructive, specific, and actionable. Max 100 words.`;

    const raw = await callAI(
      system,
      `Assessment results: ${JSON.stringify(assessmentResult)}`,
    );
    const parsed = safeParse<{ recommendations: string }>(raw, { recommendations: "" });
    return parsed.recommendations;
  },
};
