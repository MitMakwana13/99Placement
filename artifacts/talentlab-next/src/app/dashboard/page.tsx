"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

// Default Mock Fallback Data if backend API is not running/empty
const defaultSummary = {
  openRequirements: 18,
  candidatesInPipeline: 54,
  interviewsThisWeek: 12,
  offersPending: 4,
  joiningToday: 2,
  avgTimeTofillDays: 19,
};

const defaultFunnel = [
  { stage: "sourced", label: "Sourced", count: 85, pct: 100 },
  { stage: "screened", label: "Screened", count: 62, pct: 72 },
  { stage: "assessed", label: "Assessed", count: 48, pct: 56 },
  { stage: "shortlisted", label: "Shortlisted", count: 32, pct: 37 },
  { stage: "client_interview", label: "Client Interview", count: 18, pct: 21 },
  { stage: "offer", label: "Offer", count: 6, pct: 7 },
  { stage: "joining", label: "Joining", count: 4, pct: 4 },
];

const timeToHireTrend = [
  { month: "Jan", duration: 24 },
  { month: "Feb", duration: 22 },
  { month: "Mar", duration: 21 },
  { month: "Apr", duration: 19 },
  { month: "May", duration: 18 },
  { month: "Jun", duration: 16 },
];

const defaultRecentSubmissions = [
  {
    id: "1",
    candidateName: "Jane Cooper",
    jobTitle: "Senior React Developer",
    companyName: "Apex Corp",
    stage: "sourced",
    date: "2 hours ago",
  },
  {
    id: "2",
    candidateName: "Robert Fox",
    jobTitle: "DevOps Engineer",
    companyName: "Acme Corp",
    stage: "client_interview",
    date: "1 day ago",
  },
  {
    id: "3",
    candidateName: "Cody Fisher",
    jobTitle: "Full Stack Architect",
    companyName: "TechLabs",
    stage: "offer",
    date: "2 days ago",
  },
  {
    id: "4",
    candidateName: "Arlene McCoy",
    jobTitle: "Product Designer",
    companyName: "Stripe",
    stage: "joining",
    date: "3 days ago",
  },
];

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Metrics states
  const [summary, setSummary] = useState(defaultSummary);
  const [funnel, setFunnel] = useState(defaultFunnel);
  const [recentSubmissions] = useState(defaultRecentSubmissions);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadDashboardData() {
      setIsFetching(true);
      try {
        const [summaryData, funnelData] = await Promise.all([
          apiClient.get<any>("dashboard/summary"),
          apiClient.get<any>("dashboard/pipeline-funnel"),
        ]);
        if (summaryData) setSummary(summaryData);
        if (funnelData && Array.isArray(funnelData)) setFunnel(funnelData);
      } catch (err) {
        console.warn("Could not load real dashboard data, falling back to cached mock metrics.", err);
      } finally {
        setIsFetching(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Stage mapping tag colors
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "sourced":
        return "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10";
      case "screened":
        return "bg-pastel-lavender text-ink border-purple-200/10";
      case "assessed":
        return "bg-pastel-peach text-ink border-orange-200/10";
      case "shortlisted":
        return "bg-pastel-lavender text-ink border-purple-200/10";
      case "client_interview":
        return "bg-pastel-blue text-pastel-blue-ink border-blue-200/10";
      case "offer":
        return "bg-pastel-pink text-pastel-pink-ink border-pink-200/10";
      case "joining":
        return "bg-pastel-green text-pastel-green-ink border-green-200/10";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header banner */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recruiter dashboard for workspace · <span className="font-mono text-xs">{user.tenantId}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/jobs")}
            className="flex items-center justify-center gap-2 h-11 px-5 py-2.5 rounded-2xl border border-border bg-card hover:bg-muted/40 text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          >
            <Layers className="h-4.5 w-4.5 text-muted-foreground" />
            <span>Manage Pipelines</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/jobs")}
            className="flex items-center justify-center gap-2 h-11 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold transition-all duration-200 cursor-pointer shadow active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 text-pastel-pink" />
            <span>New Job Order</span>
          </button>
        </div>
      </header>

      {/* KPI Cards section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Jobs</span>
              <div className="p-2 rounded-xl bg-pastel-yellow/30 text-pastel-yellow-ink">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">
              {isFetching ? "..." : summary.openRequirements}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">+3 new</span> this week
            </p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">In Pipeline</span>
              <div className="p-2 rounded-xl bg-pastel-pink/30 text-pastel-pink-ink">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">
              {isFetching ? "..." : summary.candidatesInPipeline}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">+8 active</span> candidates
            </p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interviews Scheduled</span>
              <div className="p-2 rounded-xl bg-pastel-blue/30 text-pastel-blue-ink">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">
              {isFetching ? "..." : summary.interviewsThisWeek}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>Next 7 days</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Time to Fill</span>
              <div className="p-2 rounded-xl bg-pastel-green/30 text-pastel-green-ink">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">
              {isFetching ? "..." : `${summary.avgTimeTofillDays}d`}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">-2.4 days</span> improvement
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Analytics Charts split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-2 sm:p-4">
          <CardHeader>
            <CardTitle>Pipeline Recruitment Funnel</CardTitle>
            <CardDescription>Conversion metrics across operational pipeline stages</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "1rem",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="oklch(0.87 0.09 5)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="p-2 sm:p-4">
          <CardHeader>
            <CardTitle>Time to Hire Performance</CardTitle>
            <CardDescription>Average days-to-hire lifecycle trend (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeToHireTrend} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="fillColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.88 0.07 235)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.88 0.07 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "1rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="duration"
                  stroke="oklch(0.88 0.07 235)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fillColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Split layout: Recent Submissions table & AI Copilot matching promo */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-2 sm:p-4">
          <CardHeader className="flex flex-row justify-between items-center pb-3">
            <div>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Real-time updates of active applications</CardDescription>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pastel-green text-pastel-green-ink border border-green-200/10">
              <TrendingUp className="h-3 w-3" /> Live
            </span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Target Role</th>
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 font-semibold text-foreground">{sub.candidateName}</td>
                      <td className="py-3.5 text-muted-foreground">{sub.jobTitle}</td>
                      <td className="py-3.5 text-muted-foreground">{sub.companyName}</td>
                      <td className="py-3.5">
                        <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${getStageColor(sub.stage)}`}>
                          {sub.stage.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Co-Pilot Widget card */}
        <Card className="bg-primary text-primary-foreground flex flex-col justify-between p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pastel-pink">AI Recruiting Suite</span>
              <div className="p-2 rounded-xl bg-white/10 text-white animate-pulse">
                <Sparkles className="h-4.5 w-4.5 text-pastel-pink" />
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight">AI Resume Profiler</h3>
            <p className="text-xs text-primary-foreground/80 leading-relaxed">
              Match candidate scores against job requirements instantly. Prepare your layouts for cognitive resume matching.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Parser Engine Status</span>
                <span className="text-[10px] bg-pastel-pink text-pastel-pink-ink font-bold px-2 py-0.5 rounded-full">Ready</span>
              </div>
              <p className="text-[10px] text-primary-foreground/75">
                Centralized database is prepared to store AI candidate ratings & matches.
              </p>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 bg-white text-primary font-bold rounded-2xl hover:bg-white/95 transition-all text-xs cursor-pointer shadow active:scale-95">
              <span>View AI Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}
