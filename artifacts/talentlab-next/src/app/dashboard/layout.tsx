"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useUiStore } from "@/store/uiStore";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  GitPullRequest,
  ClipboardCheck,
  GraduationCap,
  CalendarDays,
  FileSignature,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  User,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { CopilotChat } from "@/components/CopilotChat";
import { CommandPalette } from "@/components/ui/command-palette";
import { AnimatePresence, motion } from "framer-motion";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Candidates", href: "/dashboard/candidates", icon: Users },
  { name: "Companies", href: "/dashboard/companies", icon: Building2 },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Pipeline", href: "/dashboard/pipeline", icon: GitPullRequest },
  { name: "Screening", href: "/dashboard/screening", icon: ClipboardCheck },
  { name: "Assessment", href: "/dashboard/assessment", icon: GraduationCap },
  { name: "Interviews", href: "/dashboard/interviews", icon: CalendarDays },
  { name: "Offers", href: "/dashboard/offers", icon: FileSignature },
  { name: "Joining", href: "/dashboard/joining", icon: UserCheck },
  { name: "Workflows", href: "/dashboard/workflows", icon: Settings },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, theme, toggleTheme, setTheme } = useUiStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Sync theme class with document element on mount
  useEffect(() => {
    const cachedTheme = localStorage.getItem("rms_theme") as "light" | "dark" | null;
    if (cachedTheme) {
      setTheme(cachedTheme);
    } else {
      setTheme("light");
    }
  }, [setTheme]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="app-noise min-h-screen flex bg-background text-foreground transition-all duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/18 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col p-6 space-y-6 transform md:transform-none md:static transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
      >
        <div className="glass-panel flex items-center justify-between rounded-[1.8rem] px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-1 shadow-[0_8px_20px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/8">
              <Image
                src="/brand/99-placement-logo.png"
                alt="99 Placement brand"
                width={36}
                height={36}
                className="h-9 w-9 rounded-[0.85rem] object-cover"
                priority
              />
            </div>
            <div className="space-y-0.5">
              <Logo className="h-6 w-auto" />
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Recruitment OS</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden rounded-xl p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-[1.8rem] border border-sidebar-border/70 bg-sidebar-accent/72 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
          <p className="mt-2 text-base font-semibold tracking-[-0.04em] text-foreground">99 Placement</p>
          <p className="mt-1 text-sm text-muted-foreground">Enterprise recruiting, refined for day-to-day speed.</p>
        </div>

        {/* Sidebar Nav list */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 rounded-2xl px-4 py-3 font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-card/92 text-foreground shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-sidebar-border/50 pt-4 space-y-3">
          <div className="glass-panel flex items-center gap-3 rounded-[1.6rem] px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-primary-foreground font-semibold">
              <User className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-left font-medium text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 cursor-pointer dark:hover:bg-rose-950/20"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main viewport panels */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header control bar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border/80 bg-background/72 px-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="rounded-2xl border border-border/70 bg-card/80 p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all hover:bg-muted/50 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">99 Placement</p>
              <p className="text-sm font-semibold tracking-[-0.03em] text-foreground">
                {pathname.replace("/dashboard", "").replace("/", "") || "Home"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/82 px-4 py-2 text-sm text-muted-foreground shadow-[0_10px_22px_rgba(15,23,42,0.04)] md:flex">
              <Search className="h-4 w-4" />
              <span>Search, jump, or run commands</span>
              <span className="rounded-md border border-border/80 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">⌘K</span>
            </div>
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="rounded-2xl border border-border/70 bg-card/82 p-2.5 text-muted-foreground shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all hover:bg-muted/50 hover:text-foreground cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Tenant indicator */}
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/82 px-4 py-2 text-xs font-semibold shadow-[0_10px_22px_rgba(15,23,42,0.04)] lg:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Workspace:</span>
              <span className="font-semibold text-foreground">99 Placement</span>
            </div>
          </div>
        </header>

        {/* Dynamic page context with seamless page transitions */}
        <main className="relative flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />

      {/* AI Copilot floating widget */}
      <CopilotChat />
    </div>
  );
}
