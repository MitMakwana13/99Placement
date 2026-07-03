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
  Sparkles,
} from "lucide-react";
import Link from "next/link";

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
      setTheme("dark");
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
    <div className="min-h-screen flex bg-background text-foreground transition-all duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col p-6 space-y-6 transform md:transform-none md:static transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-xl bg-primary-foreground text-primary">
              <Sparkles className="h-4 w-4 text-pastel-pink" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TalentLab <span className="text-pastel-pink font-light">RMS</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-white shadow-sm"
                    : "text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/40"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-pastel-pink" : ""}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-sidebar-border/40 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-sidebar-accent flex items-center justify-center text-sidebar-primary-foreground font-semibold">
              <User className="h-4.5 w-4.5 text-pastel-pink" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-950/20 font-medium transition-all w-full text-left cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main viewport panels */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header control bar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-muted/40 rounded-xl transition-all cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
              Consultancy Portal / {pathname.replace("/dashboard", "").replace("/", "") || "Home"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted/40 rounded-xl transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Tenant indicator */}
            <div className="hidden md:flex items-center gap-1 bg-muted/40 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/20">
              <span className="w-1.5 h-1.5 rounded-full bg-pastel-green inline-block animate-pulse" />
              <span className="text-muted-foreground">Tenant:</span>
              <span className="font-mono text-foreground font-bold">{user.tenantId.substring(0, 8)}...</span>
            </div>
          </div>
        </header>

        {/* Dynamic page context */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
