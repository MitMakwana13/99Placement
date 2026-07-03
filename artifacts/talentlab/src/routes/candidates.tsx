import { useMemo, useState } from "react";
import { Filter, Mail, Phone, MapPin, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import {
  useListCandidates,
  useCreateCandidate,
  getListCandidatesQueryKey,
} from "@workspace/api-client-react";
import type { Candidate } from "@workspace/api-client-react";

const sourceTone: Record<string, string> = {
  referral: "pastel-green",
  portal: "pastel-blue",
  social: "pastel-pink",
  internal: "pastel-yellow",
  direct: "pastel-lavender",
};

const allSources = ["referral", "portal", "social", "internal", "direct"] as const;

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, className, children }: { active: boolean; onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active ? className : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

export function CandidatesPage() {
  const queryClient = useQueryClient();
  const { data: candidates = [], isLoading } = useListCandidates({ limit: 200 });
  const createMutation = useCreateCandidate();

  const [query, setQuery] = useState("");
  const [exp, setExp] = useState<[number, number]>([0, 15]);
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [locFilter, setLocFilter] = useState<string[]>([]);
  const [srcFilter, setSrcFilter] = useState<string[]>([]);
  const [active, setActive] = useState<Candidate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", currentRole: "", location: "", experienceYears: "", skills: "", source: "portal", expectedCtc: "", noticeDays: "", summary: "" });

  const allSkills = useMemo(() => Array.from(new Set(candidates.flatMap((c) => c.skills ?? []))).sort(), [candidates]);
  const allLocations = useMemo(() => Array.from(new Set(candidates.map((c) => c.location).filter(Boolean))).sort() as string[], [candidates]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates.filter((c) =>
      (!q || c.name.toLowerCase().includes(q) || (c.currentRole ?? "").toLowerCase().includes(q) || (c.skills ?? []).some((s) => s.toLowerCase().includes(q))) &&
      ((c.experienceYears ?? 0) >= exp[0] && (c.experienceYears ?? 0) <= exp[1]) &&
      (skillFilter.length === 0 || skillFilter.every((s) => (c.skills ?? []).includes(s))) &&
      (locFilter.length === 0 || locFilter.includes(c.location ?? "")) &&
      (srcFilter.length === 0 || srcFilter.includes(c.source))
    );
  }, [candidates, query, exp, skillFilter, locFilter, srcFilter]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          currentRole: form.currentRole || undefined,
          location: form.location || undefined,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
          skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : undefined,
          source: form.source as any,
          expectedCtc: form.expectedCtc ? Number(form.expectedCtc) : undefined,
          noticeDays: form.noticeDays ? Number(form.noticeDays) : undefined,
          summary: form.summary || undefined,
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
          setIsAdding(false);
          setForm({ name: "", email: "", phone: "", currentRole: "", location: "", experienceYears: "", skills: "", source: "portal", expectedCtc: "", noticeDays: "", summary: "" });
          toast.success("Candidate added successfully");
        },
        onError(err: any) {
          toast.error(err?.data?.error ?? "Failed to add candidate");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        subtitle={`${filtered.length} of ${candidates.length} candidates matching your filters.`}
        actions={<Button onClick={() => setIsAdding(true)} className="rounded-full bg-[var(--ink)] text-background"><Plus className="mr-2 h-4 w-4" /> Source Candidate</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card-pastel h-fit bg-card">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" /> <h3 className="font-semibold">Filters</h3>
          </div>
          <Input placeholder="Search name, skill, role…" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full" />

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Experience</span><span>{exp[0]}–{exp[1]} yrs</span>
            </div>
            <Slider value={exp} onValueChange={(v) => setExp([v[0], v[1]] as [number, number])} min={0} max={15} step={1} />
          </div>

          <FilterGroup label="Source">
            {allSources.map((s) => (
              <Pill key={s} active={srcFilter.includes(s)} onClick={() => toggle(srcFilter, s, setSrcFilter)} className={tone(sourceTone[s])}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup label="Location">
            {allLocations.map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                <Checkbox checked={locFilter.includes(l)} onCheckedChange={() => toggle(locFilter, l, setLocFilter)} /> {l}
              </label>
            ))}
          </FilterGroup>

          <FilterGroup label="Skills">
            {allSkills.slice(0, 12).map((s) => (
              <Pill key={s} active={skillFilter.includes(s)} onClick={() => toggle(skillFilter, s, setSkillFilter)} className="bg-[var(--pastel-blue)] text-[var(--ink)]">{s}</Pill>
            ))}
          </FilterGroup>
        </aside>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 content-start">
          {isLoading && <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">Loading candidates…</p>}
          {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">No candidates match your filters.</p>}
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setActive(c)} className="card-pastel bg-card text-left hover:-translate-y-0.5 hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-bold ${tone("pastel-pink")}`}>{c.initials ?? c.name.slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.currentRole}</div>
                </div>
                <Badge className={`ml-auto shrink-0 rounded-full text-[10px] ${tone(sourceTone[c.source] ?? "pastel-blue")}`}>
                  {c.source.charAt(0).toUpperCase() + c.source.slice(1)}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(c.skills ?? []).slice(0, 3).map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{s}</span>)}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                {c.experienceYears != null && <span>{c.experienceYears}y exp</span>}
                {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
                {c.noticeDays != null && <span>{c.noticeDays}d notice</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail sheet */}
      {active && (
        <Dialog open onOpenChange={() => setActive(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold ${tone("pastel-pink")}`}>{active.initials ?? active.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <div>{active.name}</div>
                  <div className="text-sm font-normal text-muted-foreground">{active.currentRole}</div>
                </div>
              </DialogTitle>
              <DialogDescription className="sr-only">Candidate profile</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {active.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{active.email}</div>}
              {active.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{active.phone}</div>}
              {active.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{active.location}</div>}
              {active.summary && <p className="text-muted-foreground border-t pt-3">{active.summary}</p>}
              <div className="flex flex-wrap gap-1 border-t pt-3">
                {(active.skills ?? []).map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s}</span>)}
              </div>
              <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
                {active.experienceYears != null && <div><div className="font-semibold">{active.experienceYears}y</div><div className="text-[10px] text-muted-foreground">Experience</div></div>}
                {active.noticeDays != null && <div><div className="font-semibold">{active.noticeDays}d</div><div className="text-[10px] text-muted-foreground">Notice</div></div>}
                {active.expectedCtc != null && <div><div className="font-semibold">{(active.expectedCtc / 100000).toFixed(1)} L</div><div className="text-[10px] text-muted-foreground">Expected CTC</div></div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add candidate */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Source a Candidate</DialogTitle>
            <DialogDescription>Add a new candidate to the talent pool.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Name *</label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Email *</label>
                <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Phone</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Current Role</label>
                <Input value={form.currentRole} onChange={e => setForm(f => ({ ...f, currentRole: e.target.value }))} placeholder="Senior Engineer" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Location</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Bangalore" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Experience (years)</label>
                <Input type="number" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} placeholder="5" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Notice Period (days)</label>
                <Input type="number" value={form.noticeDays} onChange={e => setForm(f => ({ ...f, noticeDays: e.target.value }))} placeholder="30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Source</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {allSources.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Skills (comma separated)</label>
              <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, TypeScript, Node.js" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Summary</label>
              <textarea rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief candidate summary…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[var(--ink)] text-background">
                {createMutation.isPending ? "Adding…" : "Add Candidate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
