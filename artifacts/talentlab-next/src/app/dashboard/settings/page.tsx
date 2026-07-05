"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UsageMeter } from "@/components/workspace/UsageMeter";
import { InviteModal } from "@/components/workspace/InviteModal";
import { useToast } from "@/providers/ToastProvider";
import {
  Settings, Palette, Mail, Zap, Bell, Users, CreditCard,
  Trash2, UserPlus, Shield, Building2, Globe, Clock
} from "lucide-react";

type Tab = "general" | "branding" | "email" | "ai" | "notifications" | "team" | "billing";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "General",       icon: Building2 },
  { id: "branding",      label: "Branding",       icon: Palette },
  { id: "email",         label: "Email",          icon: Mail },
  { id: "ai",            label: "AI",             icon: Zap },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "team",          label: "Team",           icon: Users },
  { id: "billing",       label: "Billing",        icon: CreditCard },
];

export default function WorkspaceSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [inviteOpen, setInviteOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: ws } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => api.get("/workspace").then(r => r.data),
  });

  const { data: subData } = useQuery({
    queryKey: ["workspace-sub"],
    queryFn: () => api.get("/workspace/subscription").then(r => r.data),
  });

  const { data: usageData } = useQuery({
    queryKey: ["workspace-usage"],
    queryFn: () => api.get("/workspace/usage").then(r => r.data),
  });

  const { data: membersData } = useQuery({
    queryKey: ["workspace-members"],
    queryFn: () => api.get("/workspace/members").then(r => r.data),
    enabled: activeTab === "team",
  });

  const { data: invitesData } = useQuery({
    queryKey: ["workspace-invites"],
    queryFn: () => api.get("/workspace/invites").then(r => r.data),
    enabled: activeTab === "team",
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/rbac/roles").then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.patch("/workspace/settings", data).then(r => r.data),
    onSuccess: () => { toast("Settings saved!", "success"); qc.invalidateQueries({ queryKey: ["workspace"] }); },
    onError: (e: any) => toast(e?.response?.data?.error ?? "Save failed", "error"),
  });

  const revokeInvite = useMutation({
    mutationFn: (id: string) => api.delete(`/workspace/invites/${id}`).then(r => r.data),
    onSuccess: () => { toast("Invite revoked", "success"); qc.invalidateQueries({ queryKey: ["workspace-invites"] }); },
  });

  const removeMember = useMutation({
    mutationFn: (id: string) => api.delete(`/workspace/members/${id}`).then(r => r.data),
    onSuccess: () => { toast("Member removed", "success"); qc.invalidateQueries({ queryKey: ["workspace-members"] }); },
    onError: (e: any) => toast(e?.response?.data?.error ?? "Failed to remove member", "error"),
  });

  const settings = ws?.settings ?? {};
  const plan = subData?.subscription?.plan;
  const usage = usageData?.usage;
  const members = membersData?.members ?? [];
  const invites = invitesData?.invites ?? [];
  const roles = rolesData?.roles ?? [];

  const [form, setForm] = useState<Record<string, any>>({});
  const f = (k: string) => form[k] ?? settings[k] ?? "";
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const save = () => saveMutation.mutate({ ...settings, ...form });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your workspace, team, billing, and integrations.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-violet-500/15 text-violet-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* ── GENERAL ── */}
          {activeTab === "general" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Company Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Company Name</Label><Input value={f("companyName")} onChange={e => set("companyName", e.target.value)} placeholder="99 Placement" /></div>
                  <div className="space-y-1.5"><Label>Company Website</Label><Input value={f("companyWebsite")} onChange={e => set("companyWebsite", e.target.value)} placeholder="https://99placement.com" /></div>
                  <div className="space-y-1.5"><Label>Phone</Label><Input value={f("companyPhone")} onChange={e => set("companyPhone", e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Select
                      value={f("timezone") || "Asia/Kolkata"}
                      onChange={e => set("timezone", e.target.value)}
                      options={["Asia/Kolkata", "UTC", "America/New_York", "Europe/London", "Asia/Dubai"].map(tz => ({ value: tz, label: tz }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select
                      value={f("currency") || "INR"}
                      onChange={e => set("currency", e.target.value)}
                      options={["INR", "USD", "EUR", "GBP", "AED"].map(c => ({ value: c, label: c }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Language</Label>
                    <Select
                      value={f("language") || "en"}
                      onChange={e => set("language", e.target.value)}
                      options={[
                        { value: "en", label: "English" },
                        { value: "hi", label: "Hindi" },
                        { value: "gu", label: "Gujarati" }
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Address</Label><Input value={f("companyAddress")} onChange={e => set("companyAddress", e.target.value)} placeholder="Office address" /></div>
                <Button onClick={save} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Changes"}</Button>
              </CardContent>
            </Card>
          )}

          {/* ── BRANDING ── */}
          {activeTab === "branding" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Brand & Theme</CardTitle><CardDescription>Customize the look of your workspace</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Logo URL</Label><Input value={f("logoUrl")} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." /></div>
                  <div className="space-y-1.5"><Label>Favicon URL</Label><Input value={f("faviconUrl")} onChange={e => set("faviconUrl", e.target.value)} placeholder="https://..." /></div>
                  <div className="space-y-1.5">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={f("primaryColor") || "#7c3aed"} onChange={e => set("primaryColor", e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                      <Input value={f("primaryColor") || "#7c3aed"} onChange={e => set("primaryColor", e.target.value)} className="flex-1" />
                    </div>
                  </div>
                </div>
                <Button onClick={save} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Branding"}</Button>
              </CardContent>
            </Card>
          )}

          {/* ── EMAIL ── */}
          {activeTab === "email" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Email Configuration</CardTitle><CardDescription>Outbound email sender settings</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>From Name</Label><Input value={f("emailFromName")} onChange={e => set("emailFromName", e.target.value)} placeholder="99 Placement" /></div>
                  <div className="space-y-1.5"><Label>From Address</Label><Input value={f("emailFromAddress")} onChange={e => set("emailFromAddress", e.target.value)} placeholder="noreply@99placement.com" /></div>
                  <div className="space-y-1.5"><Label>Reply-To</Label><Input value={f("emailReplyTo")} onChange={e => set("emailReplyTo", e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label>Email Signature (HTML)</Label><textarea value={f("emailSignature")} onChange={e => set("emailSignature", e.target.value)} className="w-full h-24 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm resize-none" placeholder="<p>Best regards,<br>99 Placement Team</p>" /></div>
                <Button onClick={save} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Email Config"}</Button>
              </CardContent>
            </Card>
          )}

          {/* ── AI ── */}
          {activeTab === "ai" && (
            <Card>
              <CardHeader><CardTitle className="text-base">AI Configuration</CardTitle><CardDescription>Configure AI provider for this workspace</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>AI Provider</Label>
                    <Select
                      value={f("aiProvider") || "openai"}
                      onChange={e => set("aiProvider", e.target.value)}
                      options={[
                        { value: "openai", label: "OpenAI" },
                        { value: "gemini", label: "Google Gemini" },
                        { value: "anthropic", label: "Anthropic Claude" },
                        { value: "openrouter", label: "OpenRouter" },
                        { value: "custom", label: "Custom / Self-hosted" }
                      ]}
                    />
                  </div>
                  <div className="space-y-1.5"><Label>Model</Label><Input value={f("aiModel")} onChange={e => set("aiModel", e.target.value)} placeholder="gpt-4o-mini" /></div>
                  <div className="col-span-2 space-y-1.5"><Label>Custom Base URL (optional)</Label><Input value={f("aiBaseUrl")} onChange={e => set("aiBaseUrl", e.target.value)} placeholder="https://api.openai.com/v1" /></div>
                </div>
                <div className="space-y-1.5">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="sk-... (stored securely)" onChange={e => set("_aiApiKey", e.target.value)} />
                    <Button variant="outline" onClick={() => api.post("/workspace/settings/ai-key", { apiKey: form["_aiApiKey"] }).then(() => toast("API key saved!", "success")).catch(() => toast("Failed to save key", "error"))}>
                      Save Key
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Key is encrypted at rest. You can update it anytime.</p>
                </div>
                <Button onClick={save} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save AI Config"}</Button>
              </CardContent>
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {([
                  ["notifyOnNewCandidate", "New Candidate Added"],
                  ["notifyOnStageChange", "Candidate Stage Changed"],
                  ["notifyOnOfferRelease", "Offer Letter Released"],
                  ["notifyOnAssessment", "Assessment Completed"],
                  ["notifyOnJoining", "Candidate Joining Confirmed"],
                ] as [string, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">Send email notification to workspace admins</p>
                    </div>
                    <Switch
                      checked={f(key) !== false && (form[key] ?? settings[key] ?? true)}
                      onCheckedChange={v => set(key, v)}
                    />
                  </div>
                ))}
                <Button onClick={save} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Preferences"}</Button>
              </CardContent>
            </Card>
          )}

          {/* ── TEAM ── */}
          {activeTab === "team" && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Team Members</CardTitle>
                    <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Invite</Button>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/40">
                    {members.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{m.role?.name}</Badge>
                          <button onClick={() => removeMember.mutate(m.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {invites.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm text-muted-foreground">Pending Invites</CardTitle></CardHeader>
                  <CardContent>
                    <div className="divide-y divide-border/40">
                      {invites.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <p className="text-sm text-foreground">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                          </div>
                          <button onClick={() => revokeInvite.mutate(inv.id)} className="text-xs text-red-400 hover:text-red-300">Revoke</button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} roles={roles} />
            </>
          )}

          {/* ── BILLING ── */}
          {activeTab === "billing" && (
            <>
              <Card className="border-violet-500/20 bg-violet-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-400" />
                    Current Plan: <span className="text-violet-400">{plan?.displayName ?? "Free"}</span>
                  </CardTitle>
                  <CardDescription>
                    {subData?.subscription?.status === "TRIAL" ? (
                      <span className="text-amber-400">Trial active · Ends {new Date(subData.subscription.trialEndsAt).toLocaleDateString()}</span>
                    ) : subData?.subscription?.status}
                  </CardDescription>
                </CardHeader>
              </Card>

              {usage && plan && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Monthly Usage</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <UsageMeter label="AI Credits" used={usage.aiCredits.used} limit={usage.aiCredits.limit} />
                    <UsageMeter label="Resume Parses" used={usage.resumeParses.used} limit={usage.resumeParses.limit} />
                    <UsageMeter label="AI Matches" used={usage.aiMatches.used} limit={usage.aiMatches.limit} />
                    <UsageMeter label="Emails Sent" used={usage.emailsSent.used} limit={usage.emailsSent.limit} />
                    <UsageMeter label="Storage" used={usage.storageMb.used} limit={usage.storageMb.limit} unit=" MB" />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-sm">Available Plans</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {(subData?.plans ?? []).map((p: any) => (
                      <div key={p.id} className={`p-4 rounded-xl border ${plan?.name === p.name ? "border-violet-500/50 bg-violet-500/10" : "border-border/60"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm text-foreground">{p.displayName}</p>
                          {plan?.name === p.name && <Badge className="bg-violet-500 text-white text-[10px]">Current</Badge>}
                        </div>
                        <p className="text-xl font-extrabold text-foreground">
                          {p.priceMonthly === 0 ? (p.name === "ENTERPRISE" ? "Custom" : "Free") : `₹${Number(p.priceMonthly).toLocaleString("en-IN")}`}
                          {p.priceMonthly > 0 && <span className="text-xs text-muted-foreground">/mo</span>}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <li>{p.maxRecruiters ?? "∞"} Recruiters</li>
                          <li>{p.maxCandidates ?? "∞"} Candidates</li>
                          <li>{p.maxAiCreditsMonthly ?? "∞"} AI Credits/mo</li>
                        </ul>
                        {plan?.name !== p.name && (
                          <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                            {p.name === "ENTERPRISE" ? "Contact Us" : "Upgrade"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
