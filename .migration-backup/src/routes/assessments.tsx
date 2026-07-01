import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis as RAxis,
} from "recharts";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assessmentCategories, assessmentScores } from "@/lib/mock-data";

export const Route = createFileRoute("/assessments")({
  head: () => ({ meta: [{ title: "Assessments · talentlab" }, { name: "description", content: "Radar charts and leaderboard for assessment scores." }] }),
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const [shortlist, setShortlist] = useState<Record<string, boolean>>(
    Object.fromEntries(assessmentScores.map((s) => [s.name, s.shortlisted]))
  );
  const [active, setActive] = useState(0);
  const c = assessmentScores[active];
  const overall = Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length);
  const passed = overall >= 70;

  const radarData = assessmentCategories.map((label, i) => ({ category: label, score: c.scores[i] }));
  const gaugeData = [{ name: "score", value: overall, fill: passed ? "var(--pastel-green-ink)" : "var(--pastel-pink-ink)" }];

  return (
    <div className="space-y-6">
      <PageHeader title="Assessment scoreboard" subtitle="Six-category breakdown per candidate, with leaderboard and shortlist toggle." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card-pastel bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground">Performance radar · six categories</p>
            </div>
            <Badge className={`rounded-full ${tone(passed ? "pastel-green" : "pastel-pink")}`}>{passed ? "Pass" : "Below threshold"}</Badge>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="78%">
                <PolarGrid stroke="var(--ink)" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--ink)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="var(--pastel-pink-ink)" fill="var(--pastel-pink)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-pastel bg-[var(--pastel-green)] flex flex-col items-center justify-center text-[var(--pastel-green-ink)]">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Overall score</div>
          <div className="relative mt-2 h-56 w-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="78%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                <RAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "var(--pastel-green-ink)", fillOpacity: 0.15 }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold tabular-nums">{overall}%</div>
              <div className="text-xs opacity-70">pass ≥ 70%</div>
            </div>
          </div>
          <div className="mt-3 text-xs opacity-80">Threshold: 70 · Cohort avg: 78</div>
        </div>
      </div>

      <div className="card-pastel bg-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Leaderboard · REQ-2028 ML Engineer</h3>
          <p className="text-xs text-muted-foreground">Click a row to see their radar above.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              {assessmentCategories.map((c) => <TableHead key={c} className="text-center">{c}</TableHead>)}
              <TableHead className="text-right">Overall</TableHead>
              <TableHead className="text-right">Shortlist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessmentScores
              .map((s, i) => ({ ...s, i, overall: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) }))
              .sort((a, b) => b.overall - a.overall)
              .map((row) => (
                <TableRow key={row.name} className={`cursor-pointer ${row.i === active ? "bg-muted/50" : ""}`} onClick={() => setActive(row.i)}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  {row.scores.map((s, j) => <TableCell key={j} className="text-center tabular-nums">{s}</TableCell>)}
                  <TableCell className="text-right"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(row.overall >= 70 ? "pastel-green" : "pastel-pink")}`}>{row.overall}%</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={shortlist[row.name] ? "default" : "outline"} className="rounded-full" onClick={(e) => { e.stopPropagation(); setShortlist((s) => ({ ...s, [row.name]: !s[row.name] })); }}>
                      {shortlist[row.name] ? "Shortlisted" : "Shortlist"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
