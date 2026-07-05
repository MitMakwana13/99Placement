"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, FileText, UserPlus, Briefcase, Settings, ArrowRight, User } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useCandidates } from "@/modules/candidate/hooks/useCandidates";
import { useJobs } from "@/modules/job/hooks/useJobs";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  const { data: candidates = [] } = useCandidates({ limit: 10 });
  const { data: jobs = [] } = useJobs();

  // Global hotkey to open the command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/50 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Command Dialog */}
      <div className="relative w-full max-w-xl shadow-2xl rounded-2xl overflow-hidden glass-panel border border-border/80 animate-in fade-in zoom-in-95 duration-200">
        <Command
          className="flex flex-col h-full bg-transparent"
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-border/40 px-4">
            <Search className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
            <Command.Input
              className="flex h-14 w-full bg-transparent outline-none placeholder:text-muted-foreground text-[15px]"
              placeholder="Type a command or search..."
              autoFocus
            />
            <div className="flex items-center gap-1">
              <kbd className="inline-flex h-6 items-center gap-1 rounded bg-muted/50 border border-border/50 px-2 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">esc</span>
              </kbd>
            </div>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
              No results found. Try searching for candidates or jobs.
            </Command.Empty>

            <Command.Group heading="General" className="text-xs font-semibold text-muted-foreground px-2 py-2 [&_[cmdk-group-items]]:mt-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/candidates"))}
                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer select-none text-sm text-foreground hover:bg-muted aria-selected:bg-muted aria-selected:text-primary transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pastel-pink/20 text-pastel-pink-ink">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span>View Candidates</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/jobs"))}
                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer select-none text-sm text-foreground hover:bg-muted aria-selected:bg-muted aria-selected:text-primary transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pastel-blue/20 text-pastel-blue-ink">
                  <Briefcase className="h-4 w-4" />
                </div>
                <span>Manage Jobs</span>
              </Command.Item>
            </Command.Group>

            {candidates.length > 0 && (
              <>
                <Command.Separator className="h-px bg-border/40 my-1" />
                <Command.Group heading="Candidates" className="text-xs font-semibold text-muted-foreground px-2 py-2 [&_[cmdk-group-items]]:mt-2">
                  {candidates.slice(0, 5).map((c) => (
                    <Command.Item
                      key={c.id}
                      onSelect={() => runCommand(() => router.push(`/dashboard/candidates/${c.id}`))}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer select-none text-sm text-foreground hover:bg-muted aria-selected:bg-muted aria-selected:text-primary transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">{c.currentRole || c.email}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            )}

            {jobs.length > 0 && (
              <>
                <Command.Separator className="h-px bg-border/40 my-1" />
                <Command.Group heading="Jobs" className="text-xs font-semibold text-muted-foreground px-2 py-2 [&_[cmdk-group-items]]:mt-2">
                  {jobs.slice(0, 5).map((j) => (
                    <Command.Item
                      key={j.id}
                      onSelect={() => runCommand(() => router.push(`/dashboard/jobs/${j.id}`))}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer select-none text-sm text-foreground hover:bg-muted aria-selected:bg-muted aria-selected:text-primary transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{j.title}</span>
                        <span className="text-[10px] text-muted-foreground">{j.code || j.location}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            )}

            <Command.Separator className="h-px bg-border/40 my-1" />

            <Command.Group heading="Settings" className="text-xs font-semibold text-muted-foreground px-2 py-2 [&_[cmdk-group-items]]:mt-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer select-none text-sm text-foreground hover:bg-muted aria-selected:bg-muted aria-selected:text-primary transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Settings className="h-4 w-4" />
                </div>
                <span>Workspace Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
