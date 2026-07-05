"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
}

export function UsageMeter({ label, used, limit, unit = "" }: UsageMeterProps) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-violet-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">
          {used}{unit} / {limit === null ? "∞ Unlimited" : `${limit}${unit}`}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        {limit !== null && (
          <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  );
}

export function PlanBadge() {
  const { data } = useQuery({ queryKey: ["workspace-sub"], queryFn: () => api.get("/workspace/subscription").then(r => r.data) });
  const plan = data?.subscription?.plan?.name ?? "FREE";
  const status = data?.subscription?.status ?? "TRIAL";
  const colors: Record<string, string> = {
    FREE: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    STARTER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    PROFESSIONAL: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    ENTERPRISE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  const trialEnds = data?.subscription?.trialEndsAt;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((new Date(trialEnds).getTime() - Date.now()) / 86400000)) : null;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold ${colors[plan] ?? colors.FREE}`}>
      {plan}
      {status === "TRIAL" && daysLeft !== null && (
        <span className="text-amber-400">· {daysLeft}d trial</span>
      )}
    </div>
  );
}
