export type AssessmentDifficulty = "easy" | "medium" | "hard" | "EASY" | "MEDIUM" | "HARD";

export type AssessmentCategory =
  | "aptitude"
  | "mathematics"
  | "english"
  | "logical_reasoning"
  | "computer_knowledge"
  | "general_knowledge"
  | "current_affairs"
  | "technical"
  | "APTITUDE"
  | "MATHEMATICS"
  | "ENGLISH"
  | "LOGICAL_REASONING"
  | "COMPUTER_KNOWLEDGE"
  | "GENERAL_KNOWLEDGE"
  | "CURRENT_AFFAIRS"
  | "TECHNICAL";

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  questionText: string;
  options: string[];
  correctOption: number;
  difficulty: AssessmentDifficulty;
  isActive: boolean;
  version: number;
  parentId: string | null;
  totalAttempts?: number;
  correctAttempts?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  passPercentage: number;
  durationMinutes: number;
  randomizationRules: {
    categories: Record<string, number>;
    difficulty?: AssessmentDifficulty;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentResult {
  id: string;
  testId: string;
  questionId: string;
  category: AssessmentCategory;
  selectedOption: number | null;
  isCorrect: boolean;
  question: AssessmentQuestion;
}

export interface AssessmentTest {
  id: string;
  tenantId: string;
  pipelineId: string;
  templateId: string | null;
  conductedById: string | null;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  attemptNumber: number;
  passPercentage: number;
  durationMinutes: number;
  totalQuestions: number;
  correctAnswers: number | null;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  verdict: "PASS" | "FAIL" | null;
  categoryScores: Record<string, number> | null;
  analytics: {
    durationSeconds: number;
    difficultyAccuracy: Record<string, number>;
    categoryAccuracy: Record<string, { correct: number; total: number }>;
  } | null;
  recommendations: {
    weakCategories: string[];
    recommendedTopics: string[];
    suggestedMaterials: string[];
  } | null;
  pipeline: {
    id: string;
    stage: string;
    candidate: { id: string; name: string; email: string };
    job: { id: string; title: string; code: string };
  };
  conductedBy: { id: string; name: string; email: string } | null;
  template: { id: string; name: string; passPercentage: number; durationMinutes: number } | null;
  results: AssessmentResult[];
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentMetrics {
  total: number;
  passed: number;
  failed: number;
  started: number;
  pending: number;
  passRate: number;
  averagePercentage: number;
}

export interface WeakQuestion {
  id: string;
  questionText: string;
  category: AssessmentCategory;
  totalAttempts: number;
  correctAttempts: number;
  passRate: number;
  failRate: number;
  status: "TOO_HARD" | "TOO_EASY";
}
