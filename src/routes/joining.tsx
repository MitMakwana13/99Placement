import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { joiners } from "@/lib/mock-data";

export const Route = createFileRoute("/joining")({
  head: () => ({ meta: [{ title: "Pre & post joining · talentlab" }, { name: "description", content: "Notice-period countdown, reminders and 30/60/90 check-ins." }] }),
  component: JoiningPage,
});

function JoiningPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pre & post joining" subtitle="Notice-period countdowns and 30/60/90-day check-in status." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {joiners.map((j) => {
          const pct = j.noticeTotal ? ((j.noticeTotal - j.noticeLeft) / j.noticeTotal) * 100 : 100;
          const urgent = j.noticeLeft > 0 && j.noticeLeft <= 7;
          const joined = j.noticeTotal === 0;
          const stroke = urgent ? "var(--pastel-pink-ink)" : "var(--pastel-green-ink)";
          const bg = urgent ? "var(--pastel-pink)" : joined ? "var(--pastel-green)" : "var(--pastel-blue)";
          return (
            <div key={j.name} className="card-pastel bg-card flex flex-col items-center text-center">
              <div className="text-base font-semibold">{j.name}</div>
              <div className="text-xs text-muted-foreground">{j.role}</div>

              <div className="relative mt-4 h-32 w-32">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke={bg} strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={stroke} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(pct * Math.PI * 84) / 100} ${Math.PI * 84}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold tabular-nums">{joined ? "✓" : j.noticeLeft}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{joined ? "Joined" : "days left"}</div>
                </div>
              </div>

              {urgent && (
                <Badge className={`mt-3 rounded-full ${tone("pastel-pink")}`}><Bell className="mr-1 h-3 w-3" /> Reminder due</Badge>
              )}

              <div className="mt-4 grid w-full grid-cols-3 gap-2">
                {([
                  ["30d", j.checkins.d30],
                  ["60d", j.checkins.d60],
                  ["90d", j.checkins.d90],
                ] as const).map(([label, done]) => (
                  <div key={label} className={`rounded-xl px-2 py-1.5 text-[11px] font-semibold ${done ? tone("pastel-green") : "bg-muted text-muted-foreground"}`}>
                    <div className="flex items-center justify-center gap-1">
                      {done && <Check className="h-3 w-3" />} {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
