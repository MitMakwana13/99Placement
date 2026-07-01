import type { ReactNode } from "react";
import { Search, Bell, Settings, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur md:px-6">
        <SidebarTrigger className="rounded-xl" />
        <div className="relative ml-1 hidden max-w-xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates, requirements, clients…"
            className="h-10 rounded-full border-transparent bg-muted/70 pl-10 text-sm placeholder:text-muted-foreground focus-visible:bg-background"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-full bg-muted/70 text-foreground/70 hover:bg-muted">
            <Bell className="h-4 w-4" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-muted/70 text-foreground/70 hover:bg-muted">
            <Settings className="h-4 w-4" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-[var(--ink)] text-background">
            <UserRound className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const toneMap: Record<string, string> = {
  "pastel-yellow": "bg-[var(--pastel-yellow)] text-[var(--pastel-yellow-ink)]",
  "pastel-pink": "bg-[var(--pastel-pink)] text-[var(--pastel-pink-ink)]",
  "pastel-green": "bg-[var(--pastel-green)] text-[var(--pastel-green-ink)]",
  "pastel-blue": "bg-[var(--pastel-blue)] text-[var(--pastel-blue-ink)]",
  "pastel-lavender": "bg-[var(--pastel-lavender)] text-[var(--ink)]",
  "pastel-peach": "bg-[var(--pastel-peach)] text-[var(--ink)]",
};

export function tone(t: string) {
  return toneMap[t] ?? "bg-muted text-foreground";
}
