import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetDashboardSummary, useGetPipelineFunnel } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";

const trend = [
  { d: "Mon", offers: 2, joins: 1 },
  { d: "Tue", offers: 3, joins: 1 },
  { d: "Wed", offers: 4, joins: 2 },
  { d: "Thu", offers: 3, joins: 2 },
  { d: "Fri", offers: 5, joins: 3 },
  { d: "Sat", offers: 2, joins: 1 },
  { d: "Sun", offers: 1, joins: 0 },
];

const sourceMix = [
  { name: "Mon", referral: 12, portal: 18, social: 8 },
  { name: "Tue", referral: 16, portal: 14, social: 10 },
  { name: "Wed", referral: 14, portal: 20, social: 7 },
  { name: "Thu", referral: 18, portal: 16, social: 12 },
  { name: "Fri", referral: 22, portal: 18, social: 14 },
];

const stageColors: Record<string, string> = {
  sourced: "oklch(0.9 0.08 90)",
  screened: "oklch(0.9 0.08 30)",
  assessed: "oklch(0.85 0.1 340)",
  shortlisted: "oklch(0.85 0.1 270)",
  client_interview: "oklch(0.88 0.08 195)",
  offer: "oklch(0.88 0.1 145)",
  joining: "oklch(0.88 0.1 145)",
};

export function Dashboard() {
  const { employee } = useAuth();
  const { data: summary } = useGetDashboardSummary();
  const { data: funnel } = useGetPipelineFunnel();

  const kpis = [
    { label: "Open Requirements", value: summary?.openRequirements ?? "—", delta: "Live from DB", tone: "yellow" as const },
    { label: "Candidates in Pipeline", value: summary?.candidatesInPipeline ?? "—", delta: "All active", tone: "pink" as const },
    { label: "Interviews This Week", value: summary?.interviewsThisWeek ?? "—", delta: "Scheduled", tone: "blue" as const },
    { label: "Offers Pending", value: summary?.offersPending ?? "—", delta: "Awaiting accept", tone: "green" as const },
    { label: "Avg Time-to-Fill", value: summary ? `${summary.avgTimeTofillDays}d` : "—", delta: "Days to offer", tone: "lavender" as const },
  ];

  const maxCount = funnel?.[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${employee?.name ?? "Recruiter"}`}
        subtitle={`${summary?.openRequirements ?? 0} open requirements · ${summary?.candidatesInPipeline ?? 0} candidates in pipeline · ${summary?.offersPending ?? 0} offers pending`}
        actions={
          <>
            <Button variant="outline" className="rounded-full border-border/60">
              <Calendar className="mr-2 h-4 w-4" /> Today
            </Button>
            <Button className="rounded-full bg-[var(--ink)] text-background hover:bg-[var(--ink)]/90">
              <Plus className="mr-2 h-4 w-4" /> New requirement
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className={`card-pastel ${tone(k.tone)}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">{k.label}</span>
              <ArrowUpRight className="h-4 w-4 opacity-60" />
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight">{k.value}</div>
            <div className="mt-1 text-xs opacity-70">{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Funnel + charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-pastel lg:col-span-2 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pipeline funnel</h2>
              <p className="text-xs text-muted-foreground">Candidate Sourcing → Joining · live data</p>
            </div>
            <Badge variant="secondary" className="rounded-full bg-[var(--pastel-green)] text-[var(--pastel-green-ink)]">
              <TrendingUp className="mr-1 h-3 w-3" /> Live
            </Badge>
          </div>

          <div className="mt-6 space-y-3">
            {(funnel ?? []).map((s) => {
              const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
              const color = stageColors[s.stage] ?? "oklch(0.88 0.05 90)";
              return (
                <div key={s.stage} className="grid grid-cols-[140px_1fr_60px] items-center gap-3">
                  <span className="text-sm font-medium">{s.label}</span>
                  <div className="h-9 rounded-full bg-muted/60">
                    <div
                      className="flex h-full items-center justify-end rounded-full px-3 text-xs font-semibold text-[var(--ink)] transition-all"
                      style={{ width: `${Math.max(pct, 8)}%`, background: color }}
                    >
                      {s.count}
                    </div>
                  </div>
                  <span className="text-right text-xs text-muted-foreground">{s.pct}%</span>
                </div>
              );
            })}
            {(!funnel || funnel.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">No pipeline data yet — add candidates to requirements to see the funnel.</p>
            )}
          </div>
        </div>

        <div className="card-pastel bg-[var(--pastel-pink)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--pastel-pink-ink)]/80">Offers vs joins</h3>
              <p className="text-3xl font-semibold text-[var(--pastel-pink-ink)]">
                {summary?.offersPending ?? 0} <span className="text-base opacity-60">/ {summary?.joiningToday ?? 0} today</span>
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--pastel-pink-ink)]/70" />
          </div>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--pastel-pink-ink)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--pastel-pink-ink)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="offers" stroke="var(--pastel-pink-ink)" fill="url(#g1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="joins" stroke="var(--pastel-pink-ink)" strokeWidth={2} strokeDasharray="4 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Source mix */}
      <div className="card-pastel bg-card">
        <h2 className="text-lg font-semibold mb-4">Candidate source mix</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceMix} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="referral" stackId="a" fill="var(--pastel-yellow)" radius={[0,0,0,0]} />
              <Bar dataKey="portal" stackId="a" fill="var(--pastel-blue)" radius={[0,0,0,0]} />
              <Bar dataKey="social" stackId="a" fill="var(--pastel-pink)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
