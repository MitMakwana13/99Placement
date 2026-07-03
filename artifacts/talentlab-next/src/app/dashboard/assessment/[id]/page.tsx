"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceLayout } from "@/components/ui/WorkspaceLayout";
import { useAssessmentTest, useDetailedReportCard } from "@/modules/assessment/hooks/useAssessmentTests";
import { AssignTestModal } from "@/modules/assessment/components/AssignTestModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/ToastProvider";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  FileText,
  HelpCircle,
  BarChart2,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Award,
  BookOpen,
  PieChart,
  History,
} from "lucide-react";

export default function AssessmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isReassignOpen, setIsReassignOpen] = useState(false);

  const { data: test, isLoading, refetch } = useAssessmentTest(id);
  const { data: reportCard } = useDetailedReportCard(id);

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-semibold text-muted-foreground">Loading workspace...</div>;
  }

  if (!test) {
    return (
      <div className="text-center py-20 text-xs text-muted-foreground">
        Assessment assignment details not found.
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: <FileText className="h-4 w-4" /> },
    { id: "questions", label: "Questions", icon: <HelpCircle className="h-4 w-4" /> },
    { id: "results", label: "Results Breakdown", icon: <Award className="h-4 w-4" /> },
    { id: "analytics", label: "Performance Analytics", icon: <BarChart2 className="h-4 w-4" /> },
    { id: "timeline", label: "Audit Timeline", icon: <History className="h-4 w-4" /> },
  ];

  // Prepare radar chart data
  const categoryScores = test.categoryScores || {};
  const radarData = Object.entries(categoryScores).map(([cat, score]) => ({
    subject: cat.replace("_", " ").toUpperCase(),
    score: score,
    fullMark: 100,
  }));

  // Prepare difficulty bar chart data
  const difficultyAccuracy = test.analytics?.difficultyAccuracy || {};
  const difficultyData = Object.entries(difficultyAccuracy).map(([diff, score]) => ({
    difficulty: diff.toUpperCase(),
    accuracy: score,
  }));

  const getVerdictLabel = () => {
    if (test.completedAt) {
      return test.verdict === "PASS" ? "Passed" : "Failed";
    }
    if (test.startedAt) return "In Progress";
    return "Pending";
  };

  const getVerdictColor = () => {
    if (test.completedAt) {
      return test.verdict === "PASS"
        ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200"
        : "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200";
    }
    if (test.startedAt) return "bg-amber-100 text-amber-700 border border-amber-200";
    return "bg-muted text-muted-foreground border";
  };

  return (
    <WorkspaceLayout
      title={`Workspace — ${test.pipeline?.candidate?.name || "Candidate"}`}
      subtitle={`Assigned Test: ${test.template?.name || "Custom Assessment Matrix"}`}
      entityLabel="Assessment Workspace"
      backUrl="/dashboard/assessment"
      backLabel="Assessments Dashboard"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
      headerMeta={
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getVerdictColor()}`}>
          {getVerdictLabel()}
        </span>
      }
      actions={
        <>
          {!test.completedAt && (
            <Button
              onClick={() => router.push(`/dashboard/assessment/${test.id}/test`)}
              className="rounded-xl px-4 text-xs h-10"
            >
              Launch Exam Mode
            </Button>
          )}
          {test.completedAt && (
            <Button
              onClick={() => setIsReassignOpen(true)}
              variant="outline"
              className="rounded-xl px-4 text-xs h-10"
            >
              Re-assign Test
            </Button>
          )}
        </>
      }
    >
      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold uppercase text-foreground">Exam Specifications</CardTitle>
                <CardDescription className="text-xs">Parameters and limits defined for this assessment.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-muted/40 border border-border/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase block">Questions Quantity</span>
                    <span className="text-sm font-extrabold text-foreground">{test.totalQuestions} Questions</span>
                  </div>
                  <div className="p-3.5 bg-muted/40 border border-border/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase block">Pass Percentage</span>
                    <span className="text-sm font-extrabold text-foreground">{test.passPercentage}% Correct</span>
                  </div>
                  <div className="p-3.5 bg-muted/40 border border-border/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase block">Allotted Time</span>
                    <span className="text-sm font-extrabold text-foreground">{test.durationMinutes} Minutes</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Assigned Role</span>
                      <span className="text-xs font-bold text-foreground">{test.pipeline?.job?.title || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Scheduled Date</span>
                      <span className="text-xs font-bold text-foreground">
                        {test.scheduledAt ? new Date(test.scheduledAt).toLocaleString() : "Immediate"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {test.completedAt && (
              <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold uppercase text-foreground">Report Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/30 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-semibold">Total Grade Percentage Score</span>
                      <span className="text-2xl font-black text-foreground block">{test.percentage}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground font-semibold">Correct MCQs</span>
                      <span className="text-lg font-extrabold text-foreground block">
                        {test.correctAnswers} / {test.totalQuestions}
                      </span>
                    </div>
                  </div>

                  {reportCard?.recommendations?.weakCategories && reportCard.recommendations.weakCategories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">Target Weak Areas Detected:</span>
                      <div className="flex flex-wrap gap-1">
                        {reportCard.recommendations.weakCategories.map((c: string) => (
                          <span key={c} className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            {c.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportCard?.recommendations?.suggestedMaterials && reportCard.recommendations.suggestedMaterials.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-black text-muted-foreground uppercase block">Assessor Study Recommendations:</span>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-medium">
                        {reportCard.recommendations.suggestedMaterials.map((mat: string, idx: number) => (
                          <li key={idx}>{mat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold uppercase text-foreground">Candidate Profile</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground font-medium block">Name</span>
                  <span className="text-sm font-bold text-foreground block">{test.pipeline?.candidate?.name}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground font-medium block">Email Address</span>
                  <span className="text-sm font-bold text-foreground block break-all">{test.pipeline?.candidate?.email}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground font-medium block">Job Assignment Code</span>
                  <span className="text-sm font-mono text-muted-foreground block">{test.pipeline?.job?.code || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Questions list tab */}
      {activeTab === "questions" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase text-foreground">Exam Questions Bank Setup</CardTitle>
            <CardDescription className="text-xs">
              List of MCQs structured for this test instance. Answers are hidden during candidate execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="divide-y divide-border/20">
              {test.results.map((r: any, idx: number) => (
                <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-foreground/5 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-foreground/5 text-foreground px-2 py-0.5 rounded border border-border/40">
                      {r.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                      {r.question?.difficulty || "medium"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{r.question?.questionText || "Question Content Hidden"}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {r.question?.options?.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="p-2.5 rounded-xl border border-border/40 bg-muted/20 text-xs flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-foreground/5 flex items-center justify-center font-bold text-[10px]">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results breakdown tab */}
      {activeTab === "results" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase text-foreground">Scored Responses</CardTitle>
            <CardDescription className="text-xs">Detailed audit of option selections vs answer key.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {!test.completedAt ? (
              <div className="text-center py-12 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">Exam Not Completed</p>
                <p className="text-xs text-muted-foreground">Detailed responses will unlock once candidate submits or duration expires.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {test.results.map((r: any, idx: number) => (
                  <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-foreground/5 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        r.isCorrect 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {r.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{r.question?.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.question?.options?.map((opt: string, optIdx: number) => {
                        const isSelected = r.selectedOption === optIdx;
                        const isCorrectOption = r.question.correctOption === optIdx;
                        let cardStyle = "border-border/40 bg-muted/20 text-muted-foreground";

                        if (isCorrectOption) {
                          cardStyle = "border-green-300 bg-green-50/50 text-green-800 dark:text-green-300 font-extrabold shadow-sm";
                        } else if (isSelected) {
                          cardStyle = "border-red-300 bg-red-50/50 text-red-800 dark:text-red-300 font-extrabold shadow-sm";
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${cardStyle}`}>
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full bg-foreground/5 flex items-center justify-center font-bold text-[10px]">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-foreground/5 border">
                                Selection
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics charts tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {!test.completedAt ? (
            <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
              <CardContent className="p-12 text-center space-y-2">
                <PieChart className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">Charts Unavailable</p>
                <p className="text-xs text-muted-foreground">Analytics will automatically construct once test results are graded.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart category accuracy */}
              <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold uppercase text-foreground">Accuracy by Category</CardTitle>
                  <CardDescription className="text-xs">Category scores benchmarked against pass percentage.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {radarData.length > 0 ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "currentColor", fontSize: 9, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Candidate Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground py-12">No category scores loaded.</div>
                  )}
                </CardContent>
              </Card>

              {/* Bar Chart difficulty accuracy */}
              <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold uppercase text-foreground">Accuracy by Difficulty</CardTitle>
                  <CardDescription className="text-xs">Weight ratios achieved across Easy, Medium, Hard MCQs.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {difficultyData.length > 0 ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={difficultyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="difficulty" tick={{ fill: "currentColor", fontSize: 10, fontWeight: 700 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground py-12">No difficulty accuracy data loaded.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Timeline audit tab */}
      {activeTab === "timeline" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase text-foreground">Execution Lifecycle Audit Trail</CardTitle>
            <CardDescription className="text-xs">Immutable timestamps recorded for test states transitions.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="relative border-l border-border/50 pl-6 ml-2 space-y-6">
              {/* Event 1: Assigned */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border bg-background border-border flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">Test Assigned & Scheduled</span>
                  <span className="text-[10px] text-muted-foreground block">
                    {test.scheduledAt ? new Date(test.scheduledAt).toLocaleString() : "N/A"}
                  </span>
                  <p className="text-xs text-muted-foreground">Test instance created with attempt count #{test.attemptNumber}.</p>
                </div>
              </div>

              {/* Event 2: Started */}
              {test.startedAt && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border bg-background border-border flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Test Started (Timer Triggered)</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {new Date(test.startedAt).toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground">Candidate loaded exam questions and timer initialized.</p>
                  </div>
                </div>
              )}

              {/* Event 3: Completed */}
              {test.completedAt && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border bg-background border-border flex items-center justify-center">
                    <span className={`h-2 w-2 rounded-full ${test.verdict === "PASS" ? "bg-green-500" : "bg-red-500"}`} />
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Test Submitted & Evaluated ({test.verdict})</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {new Date(test.completedAt).toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Finished and scored. Result verdict: {test.verdict === "PASS" ? "SHORTLISTED Stage Transition" : "Pipeline Blocked"}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reassign Modal */}
      <AssignTestModal
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        pipelineId={test.pipelineId}
        onSuccess={refetch}
      />
    </WorkspaceLayout>
  );
}
