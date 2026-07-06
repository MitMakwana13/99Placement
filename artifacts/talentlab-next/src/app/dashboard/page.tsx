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
  Building,
  UploadCloud,
  FileText
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
import { motion } from "framer-motion";

function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

// Fallback Demo Data for an active-looking dashboard
const defaultSummary = {
  openRequirements: 128,
  candidatesInPipeline: 432,
  interviewsThisWeek: 45,
  avgTimeTofillDays: 14,
};

const defaultFunnel = [
  { label: "Sourced", count: 850 },
  { label: "Screened", count: 432 },
  { label: "Interview", count: 180 },
  { label: "Offered", count: 45 },
  { label: "Hired", count: 28 },
];

const timeToHireTrend = [
  { month: "Jan", duration: 24 },
  { month: "Feb", duration: 22 },
  { month: "Mar", duration: 18 },
  { month: "Apr", duration: 19 },
  { month: "May", duration: 15 },
  { month: "Jun", duration: 14 },
];

const defaultRecentSubmissions = [
  { id: 1, candidateName: "Alex Mercer", jobTitle: "Senior Frontend Engineer", companyName: "TechNova", stage: "client_interview" },
  { id: 2, candidateName: "Sarah Jenkins", jobTitle: "Product Manager", companyName: "Nexus Corp", stage: "offer" },
  { id: 3, candidateName: "Michael Chang", jobTitle: "Backend Developer", companyName: "CloudSync", stage: "screened" },
  { id: 4, candidateName: "Emily Davis", jobTitle: "UX Designer", companyName: "CreativeFlow", stage: "joining" },
];

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState(defaultSummary);
  const [funnel, setFunnel] = useState(defaultFunnel);
  const [recentSubmissions, setRecentSubmissions] = useState(defaultRecentSubmissions);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    setIsFetching(true);

    Promise.all([
      apiClient.get<any>("dashboard/summary").catch((err) => {
        console.error("Failed to load dashboard summary:", err);
        return null;
      }),
      apiClient.get<any>("dashboard/pipeline-funnel").catch((err) => {
        console.error("Failed to load dashboard funnel:", err);
        return null;
      }),
      apiClient.get<any>("dashboard/recent-submissions").catch((err) => {
        console.error("Failed to load recent submissions:", err);
        return null;
      })
    ]).then(([summaryData, funnelData, submissionsData]) => {
      if (!active) return;
      if (summaryData) {
        setSummary({
          openRequirements: summaryData.openRequirements ?? 0,
          candidatesInPipeline: summaryData.candidatesInPipeline ?? 0,
          interviewsThisWeek: summaryData.interviewsThisWeek ?? 0,
          avgTimeTofillDays: summaryData.avgTimeTofillDays ?? 14,
        });
      }
      if (funnelData && Array.isArray(funnelData)) {
        const mappedFunnel = funnelData.map((item: any) => ({
          label: item.label || item.stage,
          count: Number(item.count) || 0
        }));
        setFunnel(mappedFunnel);
      }
      if (submissionsData && Array.isArray(submissionsData)) {
        setRecentSubmissions(submissionsData);
      }
      setIsFetching(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const animOpenJobs = useCountUp(summary.openRequirements);
  const animPipeline = useCountUp(summary.candidatesInPipeline);
  const animInterviews = useCountUp(summary.interviewsThisWeek);
  const animDays = useCountUp(summary.avgTimeTofillDays);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStageColor = (stage: string) => {
    switch ((stage || "").toLowerCase()) {
      case "sourced": return "bg-gray-800 text-gray-300 border-gray-700";
      case "screened": return "bg-blue-900/40 text-blue-400 border-blue-800";
      case "client_interview": return "bg-purple-900/40 text-purple-400 border-purple-800";
      case "offer": return "bg-primary/20 text-primary border-primary/30";
      case "joining": return "bg-emerald-900/40 text-emerald-400 border-emerald-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  } as const;
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  } as const;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome header banner */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Good Morning, {user.name.split(' ')[0]} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Today you have <strong className="text-foreground">12 interviews</strong>, <strong className="text-foreground">6 screenings</strong>, <strong className="text-foreground">3 offers waiting</strong>, and <strong className="text-foreground">24 candidates</strong> requiring action.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push("/dashboard/candidates/new")} className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/40 text-sm font-semibold transition-all shadow-sm">
            <Users className="h-4 w-4" /> <span>+ Candidate</span>
          </button>
          <button onClick={() => router.push("/dashboard/companies")} className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/40 text-sm font-semibold transition-all shadow-sm">
            <Building className="h-4 w-4" /> <span>+ Company</span>
          </button>
          <button onClick={() => router.push("/dashboard/jobs")} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold transition-all shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" /> <span>New Job Order</span>
          </button>
        </div>
      </header>

      {/* KPI Cards section */}
      <motion.section variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="glass-panel-hover transition-all duration-300 border-border/60 bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Jobs</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
                {animOpenJobs}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-primary font-semibold">▲ +12%</span> this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-panel-hover transition-all duration-300 border-border/60 bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">In Pipeline</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
                {animPipeline}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-primary font-semibold">▲ +8%</span> active candidates
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-panel-hover transition-all duration-300 border-border/60 bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interviews Scheduled</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
                {animInterviews}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                <span className="text-primary font-semibold">Next 7 days</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-panel-hover transition-all duration-300 border-border/60 bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Time to Fill</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
                {animDays}d
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-primary" />
                <span className="text-primary font-semibold">▼ -2.4 days</span> improvement
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Analytics Charts split */}
      <motion.section variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="p-2 sm:p-4 bg-card border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Pipeline Recruitment Funnel</CardTitle>
              <CardDescription>Conversion metrics across operational pipeline stages</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "1rem" }}
                    cursor={{fill: 'var(--color-muted)'}}
                  />
                  <Bar dataKey="count" fill="oklch(0.77 0.14 85)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-2 sm:p-4 bg-card border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Time to Hire Trend</CardTitle>
              <CardDescription>Average days-to-hire lifecycle (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeToHireTrend} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.77 0.14 85)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.77 0.14 85)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "1rem" }} />
                  <Area type="monotone" dataKey="duration" stroke="oklch(0.77 0.14 85)" strokeWidth={3} fill="url(#goldGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Split layout: Recent Submissions table & AI Copilot matching promo */}
      <motion.section variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-2 sm:p-4 bg-card border-border/60 h-full">
            <CardHeader className="flex flex-row justify-between items-center pb-3">
              <div>
                <CardTitle className="text-lg">Recent Submissions</CardTitle>
                <CardDescription>Real-time updates of active applications</CardDescription>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <TrendingUp className="h-3 w-3" /> Live
              </span>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Target Role</th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {recentSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 font-bold text-foreground">{sub.candidateName}</td>
                        <td className="py-3.5 text-muted-foreground">{sub.jobTitle}</td>
                        <td className="py-3.5 text-muted-foreground">{sub.companyName}</td>
                        <td className="py-3.5">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${getStageColor(sub.stage)}`}>
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
        </motion.div>

        {/* AI Recommendations Widget */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border/60 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-primary/10 blur-[40px] pointer-events-none" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI Recommendations</CardTitle>
              </div>
              <CardDescription>Actionable insights for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">12 Candidates ready</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI suggests moving them to Interview stage.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 mt-0.5">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">4 Candidates at risk</p>
                    <p className="text-xs text-muted-foreground mt-0.5">High probability of offer rejection detected.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Resume Queue</p>
                    <p className="text-xs text-muted-foreground mt-0.5">8 resumes pending AI parsing.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground font-bold rounded-xl transition-all text-sm cursor-pointer shadow-sm">
                <span>Open AI Copilot</span>
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.section>
    </div>
  );
}
