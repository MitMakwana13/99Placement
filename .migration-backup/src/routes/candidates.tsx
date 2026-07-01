import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Mail, Phone, MapPin, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { type Candidate } from "@/lib/mock-data";
import { getCandidates, addCandidate } from "@/lib/api";

export const Route = createFileRoute("/candidates")({
  head: () => ({ meta: [{ title: "Candidates · talentlab" }, { name: "description", content: "Searchable, filterable candidate database with rich profiles." }] }),
  component: CandidatesPage,
});

const sourceTone: Record<Candidate["source"], string> = {
  Referral: "pastel-green",
  Portal: "pastel-blue",
  Social: "pastel-pink",
  Internal: "pastel-yellow",
};

const allSources: Candidate["source"][] = ["Referral", "Portal", "Social", "Internal"];

function CandidatesPage() {
  const queryClient = useQueryClient();
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: getCandidates,
  });

  const [query, setQuery] = useState("");
  const [exp, setExp] = useState<[number, number]>([0, 15]);
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [locFilter, setLocFilter] = useState<string[]>([]);
  const [srcFilter, setSrcFilter] = useState<Candidate["source"][]>([]);
  const [active, setActive] = useState<Candidate | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const allSkills = useMemo(() => Array.from(new Set(candidates.flatMap((c) => c.skills))).sort(), [candidates]);
  const allLocations = useMemo(() => Array.from(new Set(candidates.map((c) => c.location))).sort(), [candidates]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates.filter((c) =>
      (!q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.skills.some((s) => s.toLowerCase().includes(q))) &&
      c.experience >= exp[0] && c.experience <= exp[1] &&
      (skillFilter.length === 0 || skillFilter.every((s) => c.skills.includes(s))) &&
      (locFilter.length === 0 || locFilter.includes(c.location)) &&
      (srcFilter.length === 0 || srcFilter.includes(c.source))
    );
  }, [candidates, query, exp, skillFilter, locFilter, srcFilter]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

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
              <Pill key={s} active={srcFilter.includes(s)} onClick={() => toggle(srcFilter, s, setSrcFilter)} className={tone(sourceTone[s])}>{s}</Pill>
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
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map((s) => (
                <Pill key={s} active={skillFilter.includes(s)} onClick={() => toggle(skillFilter, s, setSkillFilter)} className="bg-muted">{s}</Pill>
              ))}
            </div>
          </FilterGroup>
        </aside>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">Loading candidates from Supabase...</div>
          ) : (
            <>
              {filtered.map((c) => (
                <button key={c.id} onClick={() => setActive(c)} className="card-pastel bg-card text-left transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-pink")}`}>{c.initials}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-semibold leading-tight">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.role}</div>
                        </div>
                        <Badge className={`rounded-full text-[10px] ${tone(sourceTone[c.source])}`}>{c.source}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{c.experience} yrs</span> · <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s}</span>
                    ))}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="card-pastel col-span-full bg-muted/30 text-center text-sm text-muted-foreground">No candidates match your filters.</div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-pink")}`}>{active.initials}</span>
                  <div>
                    <DialogTitle>{active.name}</DialogTitle>
                    <DialogDescription>{active.role} · {active.experience} yrs · {active.location}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="card-pastel bg-muted/40"><div className="text-[10px] font-bold uppercase text-muted-foreground">Email</div><div className="mt-1 inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {active.email}</div></div>
                <div className="card-pastel bg-muted/40"><div className="text-[10px] font-bold uppercase text-muted-foreground">Phone</div><div className="mt-1 inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {active.phone}</div></div>
              </div>
              <div className="card-pastel bg-card">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resume summary</h4>
                <p className="mt-2 text-sm">{active.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.skills.map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s}</span>)}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Journey</h4>
                <ol className="space-y-2">
                  {active.history.map((h, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 text-sm">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pastel-green)] text-[10px] font-bold text-[var(--pastel-green-ink)]">{i + 1}</span>
                      <span className="flex-1">{h.req}</span>
                      <span className="text-xs text-muted-foreground">{h.stage}</span>
                      <span className="text-xs text-muted-foreground">{h.date}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <AddCandidateDialog open={isAdding} onOpenChange={setIsAdding} onSuccess={() => { setIsAdding(false); queryClient.invalidateQueries({ queryKey: ["candidates"] }); }} />
    </div>
  );
}

function AddCandidateDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", role: "", email: "", location: "", source: "Portal" as Candidate["source"], experience: 0 });
  
  const addMutation = useMutation({
    mutationFn: (data: Omit<Candidate, "id" | "history">) => addCandidate(data),
    onSuccess: onSuccess,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      ...formData,
      initials: formData.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase(),
      skills: ["New Skill"],
      stage: "sourced",
      noticeDays: 30,
      expectedCtc: 0,
      phone: "",
      summary: "Manually sourced via portal.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Source New Candidate</DialogTitle>
          <DialogDescription>Add a candidate directly to the database.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Name</label>
            <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Role</label>
            <Input required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Email</label>
            <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending} className="bg-[var(--ink)] text-background">{addMutation.isPending ? "Adding..." : "Add Candidate"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Pill({ active, onClick, className = "", children }: { active: boolean; onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active ? className + " ring-2 ring-[var(--ink)]/70" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
      {children}
    </button>
  );
}
