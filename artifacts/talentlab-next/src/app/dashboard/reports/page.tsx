"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

// Empty Fallbacks for production
const defaultFunnel: any[] = [];
const recruiterPerformance: any[] = [];

const COLORS = ["#FF6B8B", "#FF8E53", "#FFD26F", "#4E54C8", "#868FBF", "#2A2E43"];

export default function ReportsPage() {
  const router = useRouter();

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.get<any>("dashboard/summary"),
  });

  const { data: funnel = defaultFunnel, isLoading: isLoadingFunnel } = useQuery({
    queryKey: ["dashboard-funnel"],
    queryFn: () => apiClient.get<any>("dashboard/pipeline-funnel"),
  });

  const { data: subscription, isLoading: isLoadingSub } = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: () => apiClient.get<any>("workspace/subscription"),
  });

  const { data: usage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["billing-usage"],
    queryFn: () => apiClient.get<any>("workspace/usage"),
  });

  const { data: recruiterData = recruiterPerformance } = useQuery({
    queryKey: ["recruiter-metrics"],
    queryFn: () => apiClient.get<any>("dashboard/recruiter-metrics"),
  });

  const { data: outboundStats } = useQuery({
    queryKey: ["outbound-stats"],
    queryFn: () => apiClient.get<any>("dashboard/outbound-stats"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Analytical Reports & Metrics <span className="text-xs px-2.5 py-1 bg-pastel-pink/15 text-pastel-pink-ink font-bold rounded-full border border-pastel-pink/20">RMS Intelligence</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor SaaS resource usage, team performance pipelines, and conversion ratios.
          </p>
        </div>
      </header>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recruitment Funnel Conversion */}
        <Card className="lg:col-span-2 border border-border/80 shadow-sm p-4 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-pastel-pink" />
              <span>Recruitment Stage Funnel Analysis</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Conversion rate across candidate pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1e24", borderColor: "#2f2f37", borderRadius: "12px" }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                />
                <Bar dataKey="count" fill="url(#funnelGrad)" radius={[10, 10, 0, 0]}>
                  {funnel.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B8B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF8E53" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SaaS Usage Limits Status */}
        <Card className="lg:col-span-1 border border-border/80 shadow-sm p-4 bg-card/60 backdrop-blur-md flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-pastel-pink" />
                <span>Tenancy Usage Summary</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Current month's resource consumption vs plan limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              {/* AI Parses */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Resume Parses</span>
                  <span className="text-muted-foreground">
                    {usage?.resumeParsesUsed ?? 0} / {subscription?.plan?.maxResumeParsesMonthly ?? "10"}
                  </span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden border border-border/20">
                  <div
                    className="bg-pastel-pink h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((usage?.resumeParsesUsed ?? 0) / (subscription?.plan?.maxResumeParsesMonthly ?? 10)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* AI Match Fit Checks */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">AI Fit Audits</span>
                  <span className="text-muted-foreground">
                    {usage?.aiMatchesUsed ?? 0} / {subscription?.plan?.maxAiMatchesMonthly ?? "10"}
                  </span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden border border-border/20">
                  <div
                    className="bg-pastel-blue-ink h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((usage?.aiMatchesUsed ?? 0) / (subscription?.plan?.maxAiMatchesMonthly ?? 10)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Emails Sent */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Emails Outbox</span>
                  <span className="text-muted-foreground">
                    {usage?.emailsSentUsed ?? 0} / {subscription?.plan?.maxEmailsMonthly ?? "100"}
                  </span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden border border-border/20">
                  <div
                    className="bg-pastel-yellow h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((usage?.emailsSentUsed ?? 0) / (subscription?.plan?.maxEmailsMonthly ?? 100)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Email & WhatsApp Outbound Delivery Statistics */}
              {outboundStats && (
                <div className="pt-3 border-t border-border/40 space-y-2 text-xs">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Outbound logs</span>
                    <span>Delivered</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Emails Sent</span>
                    <span className="text-foreground">
                      {outboundStats.emailsSent} ({outboundStats.emailDeliveryRate}% delivery)
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">WhatsApp Sent</span>
                    <span className="text-foreground">
                      {outboundStats.whatsAppSent} ({outboundStats.whatsAppDeliveryRate}% delivery)
                    </span>
                  </div>
                </div>
              )}

            </CardContent>
          </div>

          <div className="p-4 border-t border-border/40 mt-4 text-xs font-semibold text-muted-foreground flex justify-between items-center">
            <span>SaaS Plan: <span className="text-foreground font-extrabold uppercase">{subscription?.plan?.displayName || "Free Trial"}</span></span>
            <span className="text-pastel-pink text-[10px] uppercase font-bold hover:underline cursor-pointer" onClick={() => router.push("/dashboard/settings")}>Manage Settings →</span>
          </div>
        </Card>

      </div>

      {/* Grid: Recruiter leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recruiter Leaderboard */}
        <Card className="lg:col-span-2 border border-border/80 shadow-sm p-4 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-pastel-pink" />
              <span>Recruiter Leaderboard</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Monthly candidate sourcing and placement milestones per coordinator.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recruiterData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1e24", borderColor: "#2f2f37", borderRadius: "12px" }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                />
                <Bar dataKey="sourced" name="Sourced" fill="#4E54C8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="hires" name="Placements" fill="#FF6B8B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Mini-Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Time To Fill</span>
              <span className="text-2xl font-black text-foreground">{summary?.avgTimeTofillDays ?? 21} Days</span>
            </div>
            <div className="p-3 bg-pastel-pink/15 rounded-xl border border-pastel-pink/20">
              <TrendingUp className="h-5 w-5 text-pastel-pink" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Open Jobs</span>
              <span className="text-2xl font-black text-foreground">{summary?.openRequirements ?? 0} Requirements</span>
            </div>
            <div className="p-3 bg-pastel-blue-ink/15 rounded-xl border border-pastel-blue-ink/20">
              <Briefcase className="h-5 w-5 text-pastel-blue-ink" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Sourced Talent</span>
              <span className="text-2xl font-black text-foreground">{summary?.candidatesInPipeline ?? 0} Profiles</span>
            </div>
            <div className="p-3 bg-pastel-yellow/15 rounded-xl border border-pastel-yellow/20">
              <Users className="h-5 w-5 text-pastel-yellow-ink" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
