import { createFileRoute } from "@tanstack/react-router";
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
import {
  pipelineStages,
  kpis,
  activityFeed,
  urgentActions,
  todayAgenda,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · talentlab" },
      { name: "description", content: "Live pipeline, KPIs, activity and today's interviews at a glance." },
    ],
  }),
  component: Dashboard,
});

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

function Dashboard() {
  const max = pipelineStages[0].count;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Divyesh Patel"
        subtitle="34 open requirements, 22 interviews this week, 9 offers in flight. Three urgent actions need you today."
        actions={
          <>
            <Button variant="outline" className="rounded-full border-border/60">
              <Calendar className="mr-2 h-4 w-4" /> May 2026
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
              <p className="text-xs text-muted-foreground">Candidate Sourcing → Candidate Joining · last 30 days</p>
            </div>
            <Badge variant="secondary" className="rounded-full bg-[var(--pastel-green)] text-[var(--pastel-green-ink)]">
              <TrendingUp className="mr-1 h-3 w-3" /> 2.8% conversion
            </Badge>
          </div>

          <div className="mt-6 space-y-3">
            {pipelineStages.map((s) => {
              const pct = (s.count / max) * 100;
              return (
                <div key={s.key} className="grid grid-cols-[140px_1fr_60px] items-center gap-3">
                  <span className="text-sm font-medium">{s.label}</span>
                  <div className="h-9 rounded-full bg-muted/60">
                    <div
                      className="flex h-full items-center justify-end rounded-full px-3 text-xs font-semibold text-[var(--ink)] transition-all"
                      style={{ width: `${pct}%`, background: s.color }}
                    >
                      {s.count}
                    </div>
                  </div>
                  <span className="text-right text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-pastel bg-[var(--pastel-pink)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--pastel-pink-ink)]/80">Offers vs joins</h3>
              <p className="text-3xl font-semibold text-[var(--pastel-pink-ink)]">20 <span className="text-base opacity-60">/ 10</span></p>
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
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--pastel-pink-ink)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{ stroke: "var(--pastel-pink-ink)", strokeOpacity: 0.2 }} contentStyle={{ borderRadius: 12, border: "none", background: "var(--card)" }} />
                <Area type="monotone" dataKey="offers" stroke="var(--pastel-pink-ink)" strokeWidth={2} fill="url(#g1)" />
                <Line type="monotone" dataKey="joins" stroke="var(--ink)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity, urgent, agenda */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-pastel bg-[var(--pastel-yellow)] lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--pastel-yellow-ink)]">Source mix · this week</h3>
            <Badge className="rounded-full bg-[var(--ink)] text-background">5d</Badge>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceMix} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--pastel-yellow-ink)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", background: "var(--card)" }} />
                <Bar dataKey="referral" stackId="a" fill="var(--pastel-yellow-ink)" />
                <Bar dataKey="portal" stackId="a" fill="var(--ink)" />
                <Bar dataKey="social" stackId="a" fill="var(--pastel-pink-ink)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-pastel bg-card lg:col-span-1">
          <h3 className="text-base font-semibold">Recent activity</h3>
          <p className="text-xs text-muted-foreground">Live · last 24h</p>
          <ol className="mt-4 space-y-3">
            {activityFeed.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tone(a.tone)}`}>
                  {a.who.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <div className="flex-1">
                  <p className="text-sm leading-snug"><span className="font-semibold">{a.who}</span> {a.what}</p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card-pastel bg-[var(--pastel-blue)] lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--pastel-blue-ink)]">Urgent actions</h3>
            <Badge className="rounded-full bg-[var(--pastel-blue-ink)] text-background">{urgentActions.length}</Badge>
          </div>
          <ul className="mt-4 space-y-2">
            {urgentActions.map((u) => (
              <li key={u.id} className="flex items-start gap-3 rounded-2xl bg-card/70 p-3">
                <span className={`inline-flex h-7 items-center rounded-full px-2 text-[10px] font-bold uppercase tracking-wider ${tone(u.tone)}`}>{u.kind}</span>
                <p className="flex-1 text-sm">{u.label}</p>
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Today's agenda */}
      <div className="card-pastel bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Today · agenda</h3>
            <p className="text-xs text-muted-foreground">Screenings, interviews, debriefs</p>
          </div>
          <Button variant="ghost" className="rounded-full text-xs">View calendar →</Button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {todayAgenda.map((a) => (
            <div key={a.time} className={`rounded-2xl p-4 ${tone(a.tone)}`}>
              <div className="text-xs font-semibold opacity-70">{a.time}</div>
              <div className="mt-1 text-sm font-semibold leading-snug">{a.title}</div>
              <div className="mt-1 text-xs opacity-70">{a.where}</div>
              <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline">
                Open <CheckCircle2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
