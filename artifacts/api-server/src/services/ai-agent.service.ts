import { env } from "../config/env";
import logger from "../lib/logger";
import { prisma } from "@workspace/db-prisma";
import { SubscriptionService } from "./subscription.service";
import { AppError } from "../utils/app-error";
import { AiService } from "./ai.service";

// ─── 1. Tool Definitions ──────────────────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_candidates",
      description: "Search for candidates in the workspace based on skills or keywords.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search term or skill to look for." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_jobs",
      description: "Search for jobs in the workspace by status or title.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["OPEN", "CLOSED", "DRAFT"], description: "Filter by job status" },
          title: { type: "string", description: "Filter by job title keyword" }
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_pipeline_stage",
      description: "Move a candidate to a different stage in a job pipeline.",
      parameters: {
        type: "object",
        properties: {
          pipelineId: { type: "string", description: "The ID of the candidate pipeline entry." },
          newStage: { type: "string", enum: ["SOURCED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"], description: "The new stage." },
        },
        required: ["pipelineId", "newStage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize_candidate",
      description: "Get a comprehensive summary of a specific candidate.",
      parameters: {
        type: "object",
        properties: {
          candidateId: { type: "string", description: "The ID of the candidate." },
        },
        required: ["candidateId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_interview_questions",
      description: "Generate interview questions for a specific candidate pipeline.",
      parameters: {
        type: "object",
        properties: {
          pipelineId: { type: "string", description: "The ID of the candidate pipeline." },
        },
        required: ["pipelineId"],
      },
    },
  }
];

// ─── 2. Tool Handlers ─────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, any>, tenantId: string, userId: string): Promise<any> {
  logger.info(`Agent executing tool: ${name} with args: ${JSON.stringify(args)}`);

  switch (name) {
    case "search_candidates": {
      const candidates = await prisma.candidate.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: args.query, mode: 'insensitive' } },
            { skills: { has: args.query } },
            { currentRole: { contains: args.query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, name: true, currentRole: true, skills: true, experienceYears: true }
      });
      return { result: candidates.length ? candidates : "No candidates found." };
    }

    case "search_jobs": {
      const jobs = await prisma.job.findMany({
        where: {
          tenantId,
          ...(args.status ? { status: args.status } : {}),
          ...(args.title ? { title: { contains: args.title, mode: 'insensitive' } } : {})
        },
        take: 5,
        select: { id: true, title: true, status: true, location: true }
      });
      return { result: jobs.length ? jobs : "No jobs found." };
    }

    case "move_pipeline_stage": {
      // Security Check: Verify pipeline belongs to tenant
      const pipeline = await prisma.candidatePipeline.findFirst({
        where: { id: args.pipelineId, tenantId },
        include: { candidate: true, job: true }
      });
      
      if (!pipeline) {
        return { error: "Pipeline entry not found or you don't have access." };
      }

      // Execute Mutation
      await prisma.candidatePipeline.update({
        where: { id: args.pipelineId },
        data: { stage: args.newStage, stageUpdatedAt: new Date() }
      });

      // Audit Log
      logger.info(`AI Copilot moved candidate ${pipeline.candidate.name} to ${args.newStage} for user ${userId}.`);

      return { success: true, message: `Moved ${pipeline.candidate.name} to ${args.newStage} for job ${pipeline.job.title}.` };
    }

    case "summarize_candidate": {
      const candidate = await prisma.candidate.findFirst({
        where: { id: args.candidateId, tenantId }
      });
      if (!candidate) return { error: "Candidate not found." };
      
      return {
        name: candidate.name,
        role: candidate.currentRole,
        experience: candidate.experienceYears,
        skills: candidate.skills,
        summary: candidate.summary
      };
    }

    case "generate_interview_questions": {
      const pipeline = await prisma.candidatePipeline.findFirst({
        where: { id: args.pipelineId, tenantId },
        include: { candidate: true, job: true }
      });
      if (!pipeline) return { error: "Pipeline not found." };

      const questions = await AiService.suggestInterviewQuestions(
        { name: pipeline.candidate.name, skills: pipeline.candidate.skills },
        pipeline.job.title,
        "Technical",
        tenantId
      );
      
      return { questions };
    }

    default:
      return { error: `Tool ${name} is not implemented.` };
  }
}

// ─── 3. Agentic Loop ──────────────────────────────────────────────────────────

export const AiAgentService = {
  async chatWithCopilot(
    userMessage: string,
    contextData: string,
    tenantId: string,
    userId: string
  ): Promise<{ text: string }> {
    await SubscriptionService.checkUsageLimit(tenantId, "ai_credits");

    const apiKey = env.AI_API_KEY;
    if (!apiKey) throw AppError.badRequest("AI_API_KEY is not configured.");

    const messages: any[] = [
      {
        role: "system",
        content: `You are "99 Copilot", an elite AI Recruitment Assistant embedded within the 99 Placement SaaS platform.
You have access to tools to query the database and perform actions. 
Whenever a user asks you to search for candidates, move candidates, or summarize data, use your tools!
Context about the workspace:
${contextData}

Rules:
1. Use markdown for all text formatting.
2. If a user asks you to perform an action, ALWAYS use the relevant tool.
3. Be concise and professional.`
      },
      { role: "user", content: userMessage }
    ];

    let loopCount = 0;
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      loopCount++;

      // Make OpenAI API Call with Tools
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          tools: TOOL_DEFINITIONS,
          tool_choice: "auto",
        }),
      });

      const data = await response.json() as any;
      
      if (data.error) {
        logger.error(`OpenAI Agent Error: ${JSON.stringify(data.error)}`);
        return { text: "I encountered an error communicating with the AI provider." };
      }

      const responseMessage = data.choices[0].message;
      messages.push(responseMessage);

      // Check if the LLM wants to call tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Execute all requested tools in parallel
        for (const toolCall of responseMessage.tool_calls) {
          try {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            const functionResult = await executeTool(functionName, functionArgs, tenantId, userId);
            
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: functionName,
              content: JSON.stringify(functionResult),
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              content: JSON.stringify({ error: `Tool execution failed: ${e.message}` }),
            });
          }
        }
        // Loop back to let the LLM generate a response based on the tool outputs
        continue;
      }

      // No more tool calls, return the final generated text
      await SubscriptionService.incrementUsage(tenantId, "ai_credits");
      
      // If there's no text content (rare), fallback
      if (!responseMessage.content) {
         return { text: "I've successfully executed that action." };
      }

      return { text: responseMessage.content };
    }

    return { text: "I reached the maximum number of steps while trying to process your request." };
  }
};
