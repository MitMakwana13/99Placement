"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCandidate } from "@/modules/candidate/hooks/useCandidate";
import { useUpdateCandidate } from "@/modules/candidate/hooks/useUpdateCandidate";
import { useDeleteCandidate } from "@/modules/candidate/hooks/useDeleteCandidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { CandidateForm } from "@/modules/candidate/components/CandidateForm";
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
} from "lucide-react";

type TabType = "overview" | "timeline" | "resume" | "notes" | "documents";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === "string" ? params.id : "";

  // React Query query and mutations
  const { data: candidate, isLoading, error } = useCandidate(id);
  const updateMutation = useUpdateCandidate();
  const deleteMutation = useDeleteCandidate();

  // Tab controls
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notes state simulation
  const [notes, setNotes] = useState<{ id: string; author: string; text: string; date: string }[]>([
    { id: "1", author: "Recruiter Alpha", text: "Excellent communication skills. High interest in the role.", date: "2 hours ago" },
    { id: "2", author: "Technical Interviewer", text: "Strong coding fundamentals. Good understanding of system design.", date: "1 day ago" },
  ]);
  const [newNoteText, setNewNoteText] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setNotes((prev) => [
      {
        id: Math.random().toString(),
        author: "You (Recruiter)",
        text: newNoteText,
        date: "Just now",
      },
      ...prev,
    ]);
    setNewNoteText("");
    toast("Note added successfully!", "success");
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

        <div className="flex gap-2">
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
            <Trash2 className="h-4 w-4" /> Delete Profile
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
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-pastel-pink" />
                <span className="text-foreground font-medium truncate">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-pastel-pink" />
                <span className="text-foreground font-medium">{candidate.phone || "Not provided"}</span>
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

            {/* AI match widget */}
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Fit Rating</span>
                <span className="text-xs bg-pastel-green text-pastel-green-ink px-2.5 py-0.5 rounded-full font-bold border border-green-200/10 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> 94%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Candidate possesses all key frontend architectural capabilities. Highly recommended for Screening review.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tab-driven Content panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab selector bar */}
          <div className="flex border-b border-border/60 overflow-x-auto gap-4">
            {(["overview", "timeline", "resume", "notes", "documents"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 text-xs font-bold capitalize border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeTab === tab
                    ? "border-primary text-foreground font-extrabold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
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
                  {/* Sourced */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-pastel-green border-4 border-card flex items-center justify-center" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-foreground">Sourcing Entry Created</h4>
                        <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-semibold">Done</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Candidate profile onboarded into database via {candidate.source || "portal"} by recruitment supervisor.
                      </p>
                    </div>
                  </div>

                  {/* Screening */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-pastel-blue border-4 border-card flex items-center justify-center animate-pulse" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-foreground">Internal Screen Queue</h4>
                        <span className="text-[9px] bg-pastel-blue text-pastel-blue-ink px-2 py-0.5 rounded-full font-extrabold border border-blue-200/10">In Queue</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scheduled for automated cognitive screening tests and interview validations.
                      </p>
                    </div>
                  </div>

                  {/* Offers */}
                  <div className="relative opacity-60">
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-muted border-4 border-card flex items-center justify-center" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-muted-foreground">Job Offer & Decision</h4>
                      <p className="text-xs text-muted-foreground">Pending subsequent client-side technical panels.</p>
                    </div>
                  </div>
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
                  />
                  <Button type="submit">
                    Add Note
                  </Button>
                </form>

                {/* Notes List */}
                <div className="divide-y divide-border/40">
                  {notes.map((note) => (
                    <div key={note.id} className="py-4 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">{note.author}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {note.date}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{note.text}</p>
                    </div>
                  ))}
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
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer">
                  <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <span className="text-xs font-bold text-foreground">Upload Candidate Attachment</span>
                  <span className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, or RTF (max 5MB)</span>
                </div>

                <div className="divide-y divide-border/40">
                  <div className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4.5 w-4.5 text-pastel-pink" />
                      <div>
                        <p className="font-semibold text-foreground">Resume_{candidate.name.replace(" ", "_")}.pdf</p>
                        <p className="text-[10px] text-muted-foreground">PDF File · 142 KB</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}
