"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCandidate } from "@/modules/candidate/hooks/useCandidate";
import { useUpdateCandidate } from "@/modules/candidate/hooks/useUpdateCandidate";
import { useDeleteCandidate } from "@/modules/candidate/hooks/useDeleteCandidate";
import { candidateService } from "@/services/candidate";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { CandidateForm } from "@/modules/candidate/components/CandidateForm";
import { EmailComposer } from "@/modules/candidate/components/communication/EmailComposer";
import { WhatsAppComposer } from "@/modules/candidate/components/communication/WhatsAppComposer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/providers/ToastProvider";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Edit,
  Trash2,
  FileText,
  MessageSquare,
  History,
  Info,
  Clock,
  Award,
  Zap,
  Share2,
  Link,
  UserCheck,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

type TabType = "overview" | "timeline" | "resume" | "notes" | "documents" | "ai";

const ALLOCATION_STATUSES = [
  { value: "AVAILABLE", label: "Available", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "ALLOCATED", label: "Allocated", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { value: "SELECTED", label: "Selected", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { value: "OFFER_RELEASED", label: "Offer Released", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "JOINED", label: "Joined", color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "BLACKLISTED", label: "Blacklisted", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === "string" ? params.id : "";

  // React Query query and mutations
  const { data: candidate, isLoading, error } = useCandidate(id);
  const updateMutation = useUpdateCandidate();
  const deleteMutation = useDeleteCandidate();

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab controls
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [newNoteText, setNewNoteText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Timeline State
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Allocation status
  const [allocationStatus, setAllocationStatus] = useState("AVAILABLE");
  const [updatingAllocation, setUpdatingAllocation] = useState(false);

  // Share link
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);

  // Communication Modals
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Fetch AI analysis + allocation on candidate load
  const [pipelineId, setPipelineId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    // Fetch allocation status
    apiClient.get<any>(`candidates/${id}/allocation`)
      .then((r) => { if (r.data?.status) setAllocationStatus(r.data.status); })
      .catch(() => {});
  }, [id]);

  React.useEffect(() => {
    if (activeTab === "timeline" && id) {
      setIsTimelineLoading(true);
      apiClient.get<any>(`candidates/${id}/timeline`)
        .then((r) => {
          if (r.data?.data) setTimelineEvents(r.data.data);
        })
        .catch(() => {
          toast("Failed to load timeline events", "error");
        })
        .finally(() => setIsTimelineLoading(false));
    }
  }, [activeTab, id]);

  async function handleUpdateAllocation(status: string) {
    setUpdatingAllocation(true);
    try {
      await apiClient.patch<any>(`candidates/${id}/allocation`, { status });
      setAllocationStatus(status);
      toast(`Status updated to ${status.replace(/_/g, " ")}`, "success");
    } catch (err: any) {
      toast("Failed to update status", "error");
    } finally {
      setUpdatingAllocation(false);
    }
  }

  async function handleGenerateAiInsights(pid: string) {
    setAiLoading(true);
    setAiError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const [screenRes, matchRes, summaryRes, questionsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/ai/screening-score`, { method: "POST", headers, body: JSON.stringify({ pipelineId: pid }) }),
        fetch(`${API_BASE}/ai/match-score`, { method: "POST", headers, body: JSON.stringify({ pipelineId: pid }) }),
        fetch(`${API_BASE}/ai/generate-summary/${id}`, { method: "POST", headers, body: JSON.stringify({ pipelineId: pid }) }),
        fetch(`${API_BASE}/ai/interview-questions`, { method: "POST", headers, body: JSON.stringify({ pipelineId: pid, interviewType: "HR" }) }),
      ]);

      const analysis: any = {};
      if (screenRes.status === "fulfilled" && screenRes.value.ok) analysis.screeningScore = await screenRes.value.json();
      if (matchRes.status === "fulfilled" && matchRes.value.ok) analysis.matchScore = await matchRes.value.json();
      if (summaryRes.status === "fulfilled" && summaryRes.value.ok) analysis.summary = (await summaryRes.value.json()).summary;
      if (questionsRes.status === "fulfilled" && questionsRes.value.ok) analysis.interviewQuestions = (await questionsRes.value.json()).questions;

      setAiAnalysis(analysis);
      toast("AI Insights generated!", "success");
    } catch (err: any) {
      setAiError("Failed to generate AI insights. Check your AI_API_KEY configuration.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleShareCandidate(pid: string) {
    setGeneratingShare(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch(`${API_BASE}/share/candidate/${pid}`, { method: "POST", headers, body: JSON.stringify({ expiryHours: 72 }) });
      if (!r.ok) throw new Error("Failed to generate share link");
      const { shareUrl: url } = await r.json();
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast("Share link copied to clipboard!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to create share link", "error");
    } finally {
      setGeneratingShare(false);
    }
  }

  // Mutation to add notes via backend
  const addNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      return candidateService.addNote(id, text, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", id] });
      setNewNoteText("");
      toast("Note added successfully!", "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to add note.", "error");
    },
  });

  // Mutation to upload files and store document meta
  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await apiClient.post<any>("upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFile = uploadRes.data;

      return candidateService.addDocument(id, {
        name: uploadedFile.name,
        documentType: "RESUME",
        fileUrl: uploadedFile.url,
        fileKey: uploadedFile.key,
        fileSize: uploadedFile.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", id] });
      toast("Document attached successfully!", "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to upload document.", "error");
    },
    onSettled: () => {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNoteMutation.mutate(newNoteText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocMutation.mutate(file);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await updateMutation.mutateAsync({ id, data: values });
      toast("Candidate profile updated successfully!", "success");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to update candidate profile.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this candidate profile?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast("Candidate profile deleted successfully.", "success");
      router.push("/dashboard/candidates");
    } catch (err: any) {
      toast(err.message || "Failed to delete candidate profile.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-xs text-muted-foreground font-semibold">Loading profile information...</span>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="text-center py-12 max-w-sm mx-auto space-y-4">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full inline-block">
          <Info className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Failed to retrieve profile</h3>
        <p className="text-xs text-muted-foreground">The candidate profile you are searching for might have been deleted.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/candidates")}>
          Back to list
        </Button>
      </div>
    );
  }

  // Format comma separated skills to array
  const skillsArray = typeof candidate.skills === "string"
    ? candidate.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : Array.isArray(candidate.skills)
    ? candidate.skills
    : [];

  return (
    <div className="space-y-8">
      {/* Back button and action controllers header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/candidates")}
            className="p-2 hover:bg-muted/40 rounded-xl transition-all cursor-pointer border border-border"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {candidate.name}
              </h1>
              <span className="text-[10px] font-extrabold uppercase bg-pastel-pink text-pastel-pink-ink px-2.5 py-0.5 rounded-full border border-pink-200/10">
                {(candidate.source || "portal").replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Candidate Reference: <span className="font-mono text-xs">{candidate.id}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Allocation Status Dropdown */}
          <div className="relative">
            <select
              value={allocationStatus}
              onChange={(e) => handleUpdateAllocation(e.target.value)}
              disabled={updatingAllocation}
              className="h-11 px-3 pr-8 rounded-2xl text-xs font-semibold border border-border bg-background text-foreground cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ALLOCATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <UserCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-11 px-4.5 rounded-2xl cursor-pointer"
            onClick={() => pipelineId ? handleShareCandidate(pipelineId) : toast("No active pipeline found for this candidate", "error")}
            disabled={generatingShare}
          >
            <Share2 className="h-4 w-4" /> {generatingShare ? "Generating..." : "Share Candidate"}
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-11 px-4.5 rounded-2xl cursor-pointer"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
          <Button
            variant="destructive"
            className="flex items-center gap-1.5 h-11 px-4.5 rounded-2xl cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </header>

      {/* Main layout splitting profile summary and tabs panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card Summary Block */}
        <Card className="lg:col-span-1 border border-border/80 shadow-sm p-2">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border/40">
              <div className="h-16 w-16 rounded-3xl bg-pastel-pink/35 text-pastel-pink-ink font-extrabold flex items-center justify-center text-xl select-none">
                {candidate.initials || candidate.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{candidate.name}</h3>
                <p className="text-xs text-muted-foreground font-semibold">{candidate.currentRole || "No Role Listed"}</p>
              </div>
            </div>

            {/* Quick Contact Specs */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-pastel-pink" />
                  <span className="text-foreground font-medium truncate">{candidate.email}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                  const pid = pipelineId ?? (candidate as any)?.pipelines?.[0]?.id ?? (candidate as any)?.pipelineId;
                  setPipelineId(pid);
                  setIsEmailModalOpen(true);
                }}>
                  <Mail className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-pastel-pink" />
                  <span className="text-foreground font-medium">{candidate.phone || "Not provided"}</span>
                </div>
                {candidate.phone && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                    const pid = pipelineId ?? (candidate as any)?.pipelines?.[0]?.id ?? (candidate as any)?.pipelineId;
                    setPipelineId(pid);
                    setIsWhatsAppModalOpen(true);
                  }}>
                    <MessageSquare className="h-3 w-3 text-emerald-500" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-pastel-pink" />
                <span className="text-foreground font-medium">{candidate.location || "Remote"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-pastel-pink" />
                <span className="text-foreground font-medium">Added: {new Date(candidate.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* AI match widget — live data */}
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Fit Rating</span>
                <span className="text-xs bg-pastel-green text-pastel-green-ink px-2.5 py-0.5 rounded-full font-bold border border-green-200/10 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {aiAnalysis?.matchScore?.matchPercentage != null
                    ? `${aiAnalysis.matchScore.matchPercentage}%`
                    : aiAnalysis?.screeningScore?.overall != null
                    ? `${aiAnalysis.screeningScore.overall * 10}%`
                    : "Run AI"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {aiAnalysis?.screeningScore?.reasoning
                  ? aiAnalysis.screeningScore.reasoning.slice(0, 120) + "..."
                  : "Click AI Insights tab to generate a real-time AI analysis for this candidate."}
              </p>
              {!aiAnalysis && (
                <button
                  onClick={() => { setActiveTab("ai"); }}
                  className="text-[10px] text-primary font-semibold hover:underline"
                >Generate AI Insights →</button>
              )}
            </div>

            {/* Allocation Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Allocation</span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                ALLOCATION_STATUSES.find((s) => s.value === allocationStatus)?.color ?? "bg-gray-500/20 text-gray-400"
              }`}>
                {ALLOCATION_STATUSES.find((s) => s.value === allocationStatus)?.label ?? allocationStatus}
              </span>
            </div>

            {/* Share Link */}
            {shareUrl && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-[10px] text-blue-400 font-semibold mb-1 flex items-center gap-1"><Link className="h-3 w-3" /> Share Link Copied!</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{shareUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tab-driven Content panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab selector bar */}
          <div className="flex border-b border-border/60 overflow-x-auto gap-4">
            {(["overview", "timeline", "resume", "notes", "documents", "ai"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 text-xs font-bold capitalize border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeTab === tab
                    ? "border-primary text-foreground font-extrabold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                } ${tab === "ai" ? "flex items-center gap-1" : ""}`}
              >
                {tab === "ai" && <Zap className="h-3 w-3 text-violet-400" />}
                {tab === "ai" ? "AI Insights" : tab}
              </button>
            ))}
          </div>

          {/* Tab contexts */}
          {activeTab === "overview" && (
            <Card className="border border-border/80 shadow-sm p-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Profile Overview</CardTitle>
                <CardDescription>Professional candidate overview and salary metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary block */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Candidate Summary</h4>
                  <p className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-4 rounded-2xl border border-border/40">
                    {candidate.summary || "No professional summary provided. Update candidate profile to include resume metadata."}
                  </p>
                </div>

                {/* Info grids */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border/40 py-5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Experience</span>
                    <p className="text-sm font-semibold text-foreground">
                      {candidate.experienceYears !== null ? `${candidate.experienceYears} Years` : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Salary (Current / Expecting)</span>
                    <p className="text-sm font-semibold text-foreground">
                      {candidate.currentCtc ? `$${candidate.currentCtc.toLocaleString()}` : "N/A"} / {candidate.expectedCtc ? `$${candidate.expectedCtc.toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notice period</span>
                    <p className="text-sm font-semibold text-foreground">
                      {candidate.noticeDays !== null ? `${candidate.noticeDays} Days` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Skills array list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Skill Credentials</h4>
                  {skillsArray.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-bold bg-muted/60 border border-border/40 px-3 py-1.5 rounded-xl text-foreground/80 hover:text-foreground transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No specific skills listed.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "timeline" && (
            <Card className="border border-border/80 shadow-sm p-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Hiring Timeline</CardTitle>
                <CardDescription>Visual tracker of candidate screening and progression history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l border-border/80 ml-3 space-y-8 py-2">
                  {isTimelineLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Loading timeline...</div>
                  ) : timelineEvents.length > 0 ? (
                    timelineEvents.map((event, idx) => {
                      const isCommunication = event.eventType.startsWith("COMMUNICATION_");
                      return (
                        <div key={event.id || idx} className="relative">
                          <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full ${isCommunication ? "bg-emerald-500" : "bg-pastel-blue"} border-4 border-card flex items-center justify-center`} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-foreground">{event.title}</h4>
                              <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-semibold">
                                {new Date(event.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">No timeline events found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "resume" && (
            <Card className="border border-border/80 shadow-sm p-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Cognitive Resume Viewer</CardTitle>
                <CardDescription>Simulation of parsed resume content and skills matching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-border/60 bg-muted/10 rounded-2xl p-6 space-y-6 font-sans">
                  {/* Resume Header */}
                  <div className="border-b border-border/40 pb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-extrabold text-foreground">{candidate.name}</h3>
                      <p className="text-xs text-muted-foreground">{candidate.currentRole || "Professional Candidate"}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-0.5">
                      <p>{candidate.email}</p>
                      <p>{candidate.phone || "No phone listed"}</p>
                    </div>
                  </div>

                  {/* Resume Summary */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-pastel-pink flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Professional Summary
                    </h4>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {candidate.summary || "Highly skilled professional specializing in architecture design, development cycles, and team mentoring. Proven experience delivering stable codebase releases and system optimizations."}
                    </p>
                  </div>

                  {/* Experience Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-pastel-pink flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Work History
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="border-l-2 border-border pl-4 space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span>Senior Software Engineer</span>
                          <span className="text-muted-foreground">2021 — Present</span>
                        </div>
                        <p className="text-muted-foreground">Apex Software Systems</p>
                        <p className="text-foreground/70 mt-1">Lead frontend development for SaaS dashboard portal. Optimize build times by 40% using next-gen bundlers and strict code structures.</p>
                      </div>
                      <div className="border-l-2 border-border pl-4 space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span>Software Developer</span>
                          <span className="text-muted-foreground">2019 — 2021</span>
                        </div>
                        <p className="text-muted-foreground">Acme Technologies Ltd</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notes" && (
            <Card className="border border-border/80 shadow-sm p-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Recruiter Notes</CardTitle>
                <CardDescription>Add remarks and reviews for candidate evaluation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Note input form */}
                <form onSubmit={handleAddNote} className="flex gap-3">
                  <Input
                    type="text"
                    value={newNoteText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNoteText(e.target.value)}
                    placeholder="E.g. Candidate showed strong knowledge of React Query..."
                    className="flex-1"
                    disabled={addNoteMutation.isPending}
                  />
                  <Button type="submit" disabled={addNoteMutation.isPending}>
                    {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                  </Button>
                </form>

                {/* Notes List */}
                <div className="divide-y divide-border/40">
                  {(candidate.notes || []).length > 0 ? (
                    (candidate.notes || []).map((note: any) => (
                      <div key={note.id} className="py-4 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-foreground">
                            {note.author?.name || "System Recruiter"}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(note.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No internal notes recorded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "documents" && (
            <Card className="border border-border/80 shadow-sm p-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Candidate Documents</CardTitle>
                <CardDescription>Access recruiter files and uploaded resumes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.rtf,image/jpeg,image/png"
                />

                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                      <span className="text-xs font-bold text-foreground">Uploading file...</span>
                    </div>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
                      <span className="text-xs font-bold text-foreground">Upload Candidate Attachment</span>
                      <span className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, or RTF (max 5MB)</span>
                    </>
                  )}
                </div>

                <div className="divide-y divide-border/40">
                  {(candidate.documents || []).length > 0 ? (
                    (candidate.documents || []).map((doc: any) => (
                      <div key={doc.id} className="py-3 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4.5 w-4.5 text-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.documentType} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "Unknown size"}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl text-xs font-bold border border-border bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          View / Download
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No documents uploaded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── AI Insights Tab ─────────────────────────────────────── */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              {!aiAnalysis && !aiLoading && (
                <Card className="border border-violet-500/20 bg-violet-500/5 shadow-sm p-2">
                  <CardContent className="pt-6 text-center py-10">
                    <Zap className="h-10 w-10 text-violet-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">Generate AI Insights</h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                      AI will analyze this candidate and generate a screening score, job match %, interview questions, and professional summary.
                    </p>
                    {aiError && <p className="text-xs text-red-400 mb-3">{aiError}</p>}
                    <button
                      onClick={() => {
                        const pid = pipelineId ?? (candidate as any)?.pipelines?.[0]?.id ?? (candidate as any)?.pipelineId;
                        if (pid) { setPipelineId(pid); handleGenerateAiInsights(pid); }
                        else setAiError("No pipeline found. Assign this candidate to a job first.");
                      }}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" /> Generate AI Insights
                    </button>
                  </CardContent>
                </Card>
              )}
              {aiLoading && (
                <Card className="border border-border/80 shadow-sm p-2">
                  <CardContent className="pt-6 flex flex-col items-center py-10">
                    <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mb-4" />
                    <p className="text-sm font-semibold text-foreground">Running AI Analysis...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take up to 15 seconds</p>
                  </CardContent>
                </Card>
              )}
              {aiAnalysis && (
                <>
                  {aiAnalysis.screeningScore && (
                    <Card className="border border-border/80 shadow-sm p-2">
                      <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-400" /> AI Screening Score
                          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border font-semibold ${aiAnalysis.screeningScore.recommendation === "SHORTLIST" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : aiAnalysis.screeningScore.recommendation === "REJECT" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>{aiAnalysis.screeningScore.recommendation}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-3 mb-4">
                          {([["Communication", aiAnalysis.screeningScore.communication], ["Experience", aiAnalysis.screeningScore.experience], ["Skills", aiAnalysis.screeningScore.skills], ["Education", aiAnalysis.screeningScore.education], ["Overall", aiAnalysis.screeningScore.overall]] as [string, number][]).map(([label, value]) => (
                            <div key={label} className="text-center">
                              <div className="text-2xl font-extrabold text-violet-400">{value}<span className="text-sm text-muted-foreground">/10</span></div>
                              <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
                              <div className="w-full bg-muted rounded-full h-1.5 mt-2"><div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${(value ?? 0) * 10}%` }} /></div>
                            </div>
                          ))}
                        </div>
                        {aiAnalysis.screeningScore.reasoning && <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 italic">"{aiAnalysis.screeningScore.reasoning}"</p>}
                      </CardContent>
                    </Card>
                  )}
                  {aiAnalysis.matchScore && (
                    <Card className="border border-border/80 shadow-sm p-2">
                      <CardHeader><CardTitle className="text-base font-bold">🎯 Job Match Score</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6 mb-6">
                          <div className="text-5xl font-extrabold text-emerald-400">{aiAnalysis.matchScore.matchPercentage}%</div>
                          <div className="flex-1"><div className="w-full bg-muted rounded-full h-3"><div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-3 rounded-full" style={{ width: `${aiAnalysis.matchScore.matchPercentage}%` }} /></div></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                          {([["Skill Fit", aiAnalysis.matchScore.skillMatch], ["Experience", aiAnalysis.matchScore.experienceMatch], ["Location", aiAnalysis.matchScore.locationMatch], ["Salary", aiAnalysis.matchScore.salaryMatch], ["Education", aiAnalysis.matchScore.educationMatch]] as [string, number][]).map(([label, value]) => (
                            <div key={label} className="text-center p-3 rounded-xl bg-muted/40 border border-border/40">
                              <div className="text-xl font-extrabold text-emerald-400">{value}%</div>
                              <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{label}</div>
                              <div className="w-full bg-muted rounded-full h-1 mt-2"><div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${(value ?? 0)}%` }} /></div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10"><p className="text-emerald-400 font-bold mb-2">✅ Matched Skills</p><div className="flex flex-wrap gap-1">{aiAnalysis.matchScore.matchedSkills?.map((s: string) => <span key={s} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-md font-semibold border border-emerald-500/20">{s}</span>)}</div></div>
                          <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10"><p className="text-red-400 font-bold mb-2">⚠️ Missing Skills</p><div className="flex flex-wrap gap-1">{aiAnalysis.matchScore.missingSkills?.map((s: string) => <span key={s} className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded-md font-semibold border border-red-500/20">{s}</span>)}</div></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {aiAnalysis.summary && typeof aiAnalysis.summary === "object" && (
                    <Card className="border border-border/80 shadow-sm p-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-2">📝 AI Executive Summary</CardTitle>
                          <CardDescription>Comprehensive candidate analysis</CardDescription>
                        </div>
                        {aiAnalysis.summary.confidenceScore && (
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground block font-bold mb-1">Confidence Score</span>
                            <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-extrabold border border-violet-500/30">{aiAnalysis.summary.confidenceScore}%</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm leading-relaxed text-foreground/90">
                          {aiAnalysis.summary.executiveSummary}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2"><Sparkles className="h-3 w-3" /> Strengths</h4>
                            <ul className="space-y-2">
                              {aiAnalysis.summary.strengths?.map((s: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-emerald-500 mt-0.5">•</span> {s}</li>
                              ))}
                            </ul>
                          </div>
                          {/* Weaknesses / Risks */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2"><ShieldAlert className="h-3 w-3" /> Risks & Weaknesses</h4>
                            <ul className="space-y-2">
                              {aiAnalysis.summary.riskFactors?.length > 0 ? (
                                aiAnalysis.summary.riskFactors.map((r: string, i: number) => (
                                  <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-amber-500 mt-0.5">•</span> {r}</li>
                                ))
                              ) : aiAnalysis.summary.weaknesses?.map((w: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-amber-500 mt-0.5">•</span> {w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {aiAnalysis.summary.interviewTips?.length > 0 && (
                          <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">💡 Interview Tips</h4>
                            <ul className="space-y-1.5">
                              {aiAnalysis.summary.interviewTips.map((tip: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-blue-400 font-bold shrink-0">{i + 1}.</span> {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {aiAnalysis.summary.hiringRecommendation && (
                          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verdict</span>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                              aiAnalysis.summary.hiringRecommendation === "STRONG_HIRE" || aiAnalysis.summary.hiringRecommendation === "HIRE" 
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                : aiAnalysis.summary.hiringRecommendation === "REJECT" 
                                ? "bg-red-500/20 text-red-400 border-red-500/30" 
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}>{aiAnalysis.summary.hiringRecommendation.replace("_", " ")}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {aiAnalysis.summary && typeof aiAnalysis.summary === "string" && (
                    <Card className="border border-border/80 shadow-sm p-2">
                      <CardHeader><CardTitle className="text-base font-bold">📝 AI Generated Summary</CardTitle></CardHeader>
                      <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.summary}</p></CardContent>
                    </Card>
                  )}
                  {aiAnalysis.interviewQuestions?.length > 0 && (
                    <Card className="border border-border/80 shadow-sm p-2">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">💬 Interview Questions</CardTitle>
                        <CardDescription>AI-tailored questions for this candidate</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-3">
                          {aiAnalysis.interviewQuestions.map((q: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm"><span className="text-violet-400 font-bold shrink-0">{i + 1}.</span><span className="text-muted-foreground leading-relaxed">{q}</span></li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  )}
                  <button onClick={() => pipelineId && handleGenerateAiInsights(pipelineId)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Zap className="h-3 w-3" /> Regenerate</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Candidate Dialog Modal */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Candidate Profile"
      >
        <CandidateForm
          initialValues={candidate}
          onSubmit={handleEditSubmit}
          isLoading={updateMutation.isPending}
        />
      </Dialog>

      {/* Communication Modals */}
      <EmailComposer
        candidateEmail={candidate.email}
        pipelineId={pipelineId}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
      <WhatsAppComposer
        candidatePhone={candidate.phone}
        pipelineId={pipelineId}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />
    </div>
  );
}
