import { z } from "zod";
import { AssessmentCategory } from "@prisma/client";

const CategoryEnumSchema = z.nativeEnum(AssessmentCategory);

export const CreateQuestionSchema = z.object({
  category: CategoryEnumSchema,
  questionText: z.string().min(1, "Question text cannot be empty"),
  options: z.array(z.string()).min(2, "At least two options must be provided"),
  correctOption: z.number().int().nonnegative("Correct option index must be non-negative"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  isActive: z.boolean().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Template name cannot be empty"),
  description: z.string().optional(),
  passPercentage: z.number().int().min(1).max(100).default(50),
  durationMinutes: z.number().int().min(1).max(300).default(45),
  randomizationRules: z.object({
    categories: z.record(CategoryEnumSchema, z.number().int().positive()),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  }).optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export const AssignTestSchema = z.object({
  pipelineId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  conductedById: z.string().uuid().optional(),
  passPercentage: z.number().int().min(1).max(100).optional(),
  durationMinutes: z.number().int().min(1).max(300).optional(),
  scheduledAt: z.string().datetime({ offset: true }).transform(str => new Date(str)).optional(),
  questionIds: z.array(z.string().uuid()).optional(),
  randomSelection: z.object({
    categories: z.record(CategoryEnumSchema, z.number().int().positive()),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  }).optional(),
}).refine(
  (data) => data.templateId || (data.questionIds && data.questionIds.length > 0) || data.randomSelection,
  {
    message: "Either templateId, explicit questionIds, or randomSelection criteria must be specified to assign a test.",
    path: ["questionIds"],
  }
);

export const SubmitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.number().int().nonnegative("Selected option must be non-negative"),
});
