"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Calendar, CheckCircle2, Clock, LogOut, Plus, Sparkles, TrendingUp, Users } from "lucide-react";

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [stats] = useState({
    openRequirements: 12,
    activeCandidates: 48,
    scheduledInterviews: 8,
    pendingOffers: 3,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Panel */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight text-white">
            TalentLab <span className="text-pastel-pink font-light">RMS</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-sidebar-accent text-white font-medium transition-all">
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50 font-medium transition-all">
            <span>Requirements</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50 font-medium transition-all">
            <span>Candidates</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50 font-medium transition-all">
            <span>Interviews</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50 font-medium transition-all">
            <span>Offer Letters</span>
          </a>
        </nav>

        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 font-medium transition-all w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manager workspace · Tenant ID: <span className="font-mono text-xs">{user.tenantId}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-border/60 hover:bg-card bg-transparent text-sm font-semibold transition-all">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-95 text-sm font-semibold transition-all">
              <Plus className="h-4 w-4" />
              <span>New Job</span>
            </button>
          </div>
        </header>

        {/* KPIs row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-pastel bg-pastel-yellow text-pastel-yellow-ink border border-yellow-200/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Open Requirements</span>
              <Clock className="h-4 w-4 opacity-75" />
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">{stats.openRequirements}</div>
            <div className="mt-1 text-xs opacity-75">Active listings</div>
          </div>

          <div className="card-pastel bg-pastel-pink text-pastel-pink-ink border border-pink-200/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Active Candidates</span>
              <Users className="h-4 w-4 opacity-75" />
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">{stats.activeCandidates}</div>
            <div className="mt-1 text-xs opacity-75">Sourced & Screened</div>
          </div>

          <div className="card-pastel bg-pastel-blue text-pastel-blue-ink border border-blue-200/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Interviews Scheduled</span>
              <Calendar className="h-4 w-4 opacity-75" />
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">{stats.scheduledInterviews}</div>
            <div className="mt-1 text-xs opacity-75">Next 7 days</div>
          </div>

          <div className="card-pastel bg-pastel-green text-pastel-green-ink border border-green-200/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Pending Offers</span>
              <CheckCircle2 className="h-4 w-4 opacity-75" />
            </div>
            <div className="mt-3 text-4xl font-extrabold tracking-tight">{stats.pendingOffers}</div>
            <div className="mt-1 text-xs opacity-75">Awaiting signature</div>
          </div>
        </section>

        {/* Central Content Split */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-pastel lg:col-span-2 bg-card space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <div>
                <h2 className="text-lg font-bold">Recent Submissions</h2>
                <p className="text-xs text-muted-foreground">Active pipeline candidate flows</p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pastel-green text-pastel-green-ink">
                <TrendingUp className="h-3 w-3" /> Live
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/20 border border-border/30 hover:border-border transition-all">
                <div>
                  <h4 className="text-sm font-semibold">Jane Cooper</h4>
                  <p className="text-xs text-muted-foreground">Senior React Developer · Apex Corp</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pastel-yellow text-pastel-yellow-ink">
                  Sourced
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/20 border border-border/30 hover:border-border transition-all">
                <div>
                  <h4 className="text-sm font-semibold">Robert Fox</h4>
                  <p className="text-xs text-muted-foreground">DevOps Engineer · Acme Corp</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pastel-blue text-pastel-blue-ink">
                  Interviewing
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/20 border border-border/30 hover:border-border transition-all">
                <div>
                  <h4 className="text-sm font-semibold">Cody Fisher</h4>
                  <p className="text-xs text-muted-foreground">Full Stack Architect · TechLabs</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pastel-green text-pastel-green-ink">
                  Offered
                </span>
              </div>
            </div>
          </div>

          <div className="card-pastel bg-primary text-primary-foreground space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold uppercase tracking-wider opacity-75">AI Co-Pilot Matching</h3>
                <Sparkles className="h-5 w-5 text-pastel-pink animate-pulse" />
              </div>
              <p className="text-xl font-bold tracking-tight">Generate Candidate Summaries</p>
              <p className="text-xs opacity-75">
                Automatically verify resumes against active requirements with zero manual overhead.
              </p>
            </div>
            <button className="w-full py-2.5 bg-card text-foreground rounded-2xl text-xs font-semibold hover:opacity-95 transition-all mt-4">
              Launch Copilot
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
