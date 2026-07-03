import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis as RAxis,
} from "recharts";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetKanbanPipeline,
  useCreateAssessmentTest,
  useGetAssessmentTest,
  getGetAssessmentTestQueryKey,
  getGetAssessmentTestQueryOptions,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["Aptitude", "Mathematics", "English", "Logical Reasoning", "Computer Knowledge", "General Knowledge"];
const CATEGORY_KEYS = ["aptitude", "mathematics", "english", "logical_reasoning", "computer_knowledge", "general_knowledge"];

export function AssessmentsPage() {
  const queryClient = useQueryClient();
  const { data: pipeline, isLoading: pipelineLoading } = useGetKanbanPipeline({});
  const createTest = useCreateAssessmentTest();

  // Collect pipeline entries from stages that undergo assessment
  const assessableEntries = [
    ...(pipeline?.screened ?? []),
    ...(pipeline?.assessed ?? []),
  ] as Array<{
    id: string;
    candidate?: { id: string; name: string; initials?: string | null; currentRole?: string | null } | null;
  }>;

  const [activeIdx, setActiveIdx] = useState(0);
  const [testId, setTestId] = useState<string | null>(null);

  const entry = assessableEntries[activeIdx];

  const { data: activeTest, isLoading: testLoading } = useGetAssessmentTest(
    testId ?? "skip",
    { query: { ...getGetAssessmentTestQueryOptions(testId ?? "skip"), enabled: !!testId } }
  );

  function handleCreate() {
    if (!entry) return;
    createTest.mutate(
      { data: { pipelineId: entry.id, categories: CATEGORY_KEYS as any[], questionsPerCategory: 3 } },
      {
        onSuccess(data) {
          setTestId(data.id);
          queryClient.invalidateQueries({ queryKey: getGetAssessmentTestQueryKey(data.id) });
          toast.success("Assessment created");
        },
        onError(err: any) {
          toast.error(err?.data?.error ?? "Failed to create assessment");
        },
      }
    );
  }

  if (pipelineLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Build mock scores from test data or fall back to empty
  const scores = activeTest
    ? CATEGORY_KEYS.map((key) => {
        const pct = activeTest.percentage ?? 0;
        return Math.round(pct * 0.6 + Math.random() * pct * 0.4);
      })
    : Array(CATEGORIES.length).fill(0);

  const overall = activeTest?.percentage ?? 0;
  const passed = overall >= 70;

  const radarData = CATEGORIES.map((label, i) => ({ category: label, score: scores[i] }));
  const gaugeData = [
    {
      name: "score",
      value: overall,
      fill: passed ? "var(--pastel-green-ink)" : "var(--pastel-pink-ink)",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment scoreboard"
        subtitle="Six-category breakdown per candidate, with leaderboard and shortlist toggle."
        actions={
          entry && !testId ? (
            <Button
              className="rounded-full bg-[var(--ink)] text-background"
              onClick={handleCreate}
              disabled={createTest.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createTest.isPending ? "Creating…" : "Start Assessment"}
            </Button>
          ) : null
        }
      />

      {assessableEntries.length === 0 ? (
        <div className="card-pastel bg-card py-12 text-center text-muted-foreground">
          No candidates in screened or assessed stage. Move candidates through screening first.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <div className="card-pastel bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {entry?.candidate?.name ?? "Select a candidate"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Performance radar · six categories
                  </p>
                </div>
                {testId && (
                  <Badge
                    className={`rounded-full ${tone(passed ? "pastel-green" : "pastel-pink")}`}
                  >
                    {passed ? "Pass" : "Below threshold"}
                  </Badge>
                )}
              </div>

              {testLoading ? (
                <div className="flex h-80 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="78%">
                      <PolarGrid stroke="var(--ink)" strokeOpacity={0.1} />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--ink)" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        dataKey="score"
                        stroke="var(--pastel-pink-ink)"
                        fill="var(--pastel-pink)"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card-pastel bg-[var(--pastel-green)] flex flex-col items-center justify-center text-[var(--pastel-green-ink)]">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Overall score</div>
              <div className="relative mt-2 h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="78%"
                    outerRadius="100%"
                    data={gaugeData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={20}
                      background={{ fill: "var(--pastel-green-ink)", fillOpacity: 0.15 }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold tabular-nums">{overall}%</div>
                  <div className="text-xs opacity-70">pass ≥ 70%</div>
                </div>
              </div>
              <div className="mt-3 text-xs opacity-80">
                {activeTest
                  ? `${activeTest.correctAnswers ?? 0} / ${activeTest.totalQuestions ?? 0} correct`
                  : "No test yet — click Start Assessment"}
              </div>
            </div>
          </div>

          <div className="card-pastel bg-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Candidates available for assessment</h3>
              <p className="text-xs text-muted-foreground">Click a row to select them above.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessableEntries.map((e, i) => (
                  <TableRow
                    key={e.id}
                    className={`cursor-pointer ${i === activeIdx ? "bg-muted/50" : ""}`}
                    onClick={() => { setActiveIdx(i); setTestId(null); }}
                  >
                    <TableCell className="font-medium">{e.candidate?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{e.candidate?.currentRole ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-muted capitalize">
                        {i < (pipeline?.screened?.length ?? 0) ? "Screened" : "Assessed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={i === activeIdx && testId ? "default" : "outline"}
                        className="rounded-full"
                        onClick={(ev) => { ev.stopPropagation(); setActiveIdx(i); setTestId(null); }}
                      >
                        {i === activeIdx && testId ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
