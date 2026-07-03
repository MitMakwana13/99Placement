import { z } from "zod";

export const ScheduleInterviewSchema = z.object({
  pipelineId: z.string().uuid(),
  interviewerId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  scheduledAt: z.string().datetime({ offset: true }).transform(str => new Date(str)),
  durationMin: z.number().int().positive().default(60),
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  meetingId: z.string().optional(),
  agenda: z.string().optional(),
  interviewType: z.enum(["HR", "TECHNICAL", "MANAGER", "FINAL", "BEHAVIORAL", "SYSTEM_DESIGN", "CODING", "CUSTOM"]).default("TECHNICAL"),
  mode: z.enum(["VIRTUAL", "IN_PERSON", "PHONE"]).default("VIRTUAL"),
  roundNumber: z.number().int().positive().default(1),
  panelUserIds: z.array(z.string().uuid()).optional(),
});

export const RescheduleInterviewSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).transform(str => new Date(str)),
  durationMin: z.number().int().positive().optional(),
  timezone: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
});

export const SubmitFeedbackSchema = z.object({
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  comments: z.string().optional(),
  recommendation: z.enum(["HIRE", "HOLD", "REJECT"]),
  overallRating: z.number().int().min(1).max(10),
  scores: z.array(
    z.object({
      dimension: z.string().min(1, "Dimension is required"),
      score: z.number().int().min(1).max(10),
      notes: z.string().optional(),
    })
  ).optional(),
});

export const CreateOfferSchema = z.object({
  pipelineId: z.string().uuid(),
  offeredCtc: z.number().int().positive("Ctc must be positive"),
  designation: z.string().min(1, "Designation is required"),
  joiningDate: z.string().datetime({ offset: true }).transform(str => new Date(str)),
  letterUrl: z.string().url().optional().or(z.literal("")),
});

export const SubmitApprovalDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comments: z.string().optional(),
});

export const CreateJoiningSchema = z.object({
  pipelineId: z.string().uuid(),
  joiningDate: z.string().datetime({ offset: true }).transform(str => new Date(str)).optional(),
  noticePeriodDays: z.number().int().nonnegative().optional(),
  noticeStartDate: z.string().datetime({ offset: true }).transform(str => new Date(str)).optional(),
});

export const UpdateJoiningSchema = z.object({
  joiningDate: z.string().datetime({ offset: true }).transform(str => new Date(str)).optional(),
  actualJoinedAt: z.string().datetime({ offset: true }).transform(str => new Date(str)).optional(),
  bgvStatus: z.string().optional(),
  docCollectionStatus: z.string().optional(),
  laptopIssued: z.boolean().optional(),
  idCardIssued: z.boolean().optional(),
});

export const CreateFollowupSchema = z.object({
  pipelineId: z.string().uuid(),
  checkType: z.string().min(1, "Check type is required"),
  scheduledAt: z.string().datetime({ offset: true }).transform(str => new Date(str)).optional(),
  notes: z.string().optional(),
  retentionStatus: z.string().optional(),
});
