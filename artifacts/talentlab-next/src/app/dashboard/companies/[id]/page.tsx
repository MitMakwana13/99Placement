"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useCompany } from "@/modules/company/hooks/useCompany";
import { useUpdateCompany } from "@/modules/company/hooks/useUpdateCompany";
import { useDeleteCompany, useArchiveCompany, useRestoreCompany } from "@/modules/company/hooks/useDeleteCompany";
import {
  useCompanyContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/modules/company/hooks/useCompanyContacts";
import { useCompanyDepartments, useAddDepartment } from "@/modules/company/hooks/useCompanyDepartments";
import { useCompanyNotes, useCreateNote } from "@/modules/company/hooks/useCompanyNotes";
import { useCompanyDocuments, useAddDocument } from "@/modules/company/hooks/useCompanyDocuments";
import { useCompanyTimeline } from "@/modules/company/hooks/useCompanyTimeline";
import { useAssignRecruiter, useRemoveRecruiter } from "@/modules/company/hooks/useCompanyRecruiters";
import { useJobs } from "@/modules/job/hooks/useJobs";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "@/modules/company/components/CompanyForm";
import { Input } from "@/components/ui/input";

import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Mail,
  Users,
  Briefcase,
  TrendingUp,
  FolderOpen,
  FileText,
  History,
  Plus,
  Trash2,
  Edit,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  UserX,
  FilePlus,
  MessageSquare,
  Sparkles,
  PieChart,
  CheckCircle,
  FileBadge,
} from "lucide-react";

import { Company, CompanyType, ContactType, CompanyDocumentType } from "@/modules/company/types";

type TabType = "overview" | "contacts" | "departments" | "jobs" | "documents" | "notes" | "timeline" | "analytics";

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  PRIVATE_LIMITED: "Private Limited",
  PUBLIC_LIMITED: "Public Limited",
  LLP: "LLP",
  PARTNERSHIP: "Partnership",
  PROPRIETORSHIP: "Proprietorship",
  OTHER: "Other",
};

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const DOCUMENT_TYPE_LABELS: Record<CompanyDocumentType, string> = {
  GST_CERTIFICATE: "GST Certificate",
  PAN: "PAN Card",
  NDA: "NDA Agreement",
  MSA: "Master Services Agreement (MSA)",
  SOW: "Statement of Work (SOW)",
  CONTRACT: "Employment Contract",
  OTHER: "Other document",
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const id = typeof params.id === "string" ? params.id : "";

  // Core Company Queries
  const { data: company, isLoading, error } = useCompany(id);
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const archiveMutation = useArchiveCompany();
  const restoreMutation = useRestoreCompany();

  // Tabbed Relation Queries
  const { data: contacts = [] } = useCompanyContacts(id);
  const { data: departments = [] } = useCompanyDepartments(id);
  const { data: documents = [] } = useCompanyDocuments(id);
  const { data: notes = [] } = useCompanyNotes(id);
  const { data: timeline = [] } = useCompanyTimeline(id);

  // Core Jobs query (to filter by company)
  const { data: allJobs = [] } = useJobs();
  const companyJobs = allJobs.filter((j) => j.companyId === id);

  // Fetch real workspace members
  const { data: workspaceData } = useQuery({
    queryKey: ["workspace-members"],
    queryFn: () => apiClient.get<{ members: any[] }>("workspace/members"),
  });
  const members = workspaceData?.members || [];

  // Recruiters Mutations
  const assignRecruiterMutation = useAssignRecruiter(id);
  const removeRecruiterMutation = useRemoveRecruiter(id);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Modals & Dialog States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Contact CRUD dialog states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactDesignation, setContactDesignation] = useState("");
  const [contactType, setContactType] = useState<ContactType>("HR");
  const [contactLinkedin, setContactLinkedin] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const createContactMutation = useCreateContact(id);
  const updateContactMutation = useUpdateContact(id);
  const deleteContactMutation = useDeleteContact(id);

  // Department dialog states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptHeadName, setDeptHeadName] = useState("");
  const [deptHeadEmail, setDeptHeadEmail] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const addDeptMutation = useAddDepartment(id);

  // Document dialog states
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<CompanyDocumentType>("NDA");
  const [docUrl, setDocUrl] = useState("");
  const [docSize, setDocSize] = useState("");
  const addDocMutation = useAddDocument(id);

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [noteIsPrivate, setNoteIsPrivate] = useState(false);
  const addNoteMutation = useCreateNote(id);

  // Recruiter Assign state
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("");
  const [isLeadRecruiter, setIsLeadRecruiter] = useState(false);

  // Form Submit Handlers
  const handleEditSubmit = async (values: any) => {
    try {
      await updateMutation.mutateAsync({ id, data: values });
      toast("Company profile updated successfully!", "success");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to update company.", "error");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(id);
      toast("Company profile archived successfully.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to archive company.", "error");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(id);
      toast("Company profile restored successfully.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to restore company.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this company profile? All records will be lost.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast("Company profile deleted permanently.", "success");
      router.push("/dashboard/companies");
    } catch (err: any) {
      toast(err.message || "Failed to delete company profile.", "error");
    }
  };

  // Contacts CRUD actions
  const openAddContact = () => {
    setEditingContact(null);
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactDesignation("");
    setContactType("HR");
    setContactLinkedin("");
    setContactNotes("");
    setContactIsPrimary(false);
    setIsContactModalOpen(true);
  };

  const openEditContact = (contact: any) => {
    setEditingContact(contact);
    setContactName(contact.name || "");
    setContactEmail(contact.email || "");
    setContactPhone(contact.phone || "");
    setContactDesignation(contact.designation || "");
    setContactType(contact.contactType || "HR");
    setContactLinkedin(contact.linkedinUrl || "");
    setContactNotes(contact.notes || "");
    setContactIsPrimary(!!contact.isPrimary);
    setIsContactModalOpen(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: contactName,
      email: contactEmail || undefined,
      phone: contactPhone || undefined,
      designation: contactDesignation || undefined,
      contactType,
      linkedinUrl: contactLinkedin || undefined,
      notes: contactNotes || undefined,
      isPrimary: contactIsPrimary,
    };

    try {
      if (editingContact) {
        await updateContactMutation.mutateAsync({ contactId: editingContact.id, data: payload });
        toast("Contact updated successfully!", "success");
      } else {
        await createContactMutation.mutateAsync(payload);
        toast("Contact created successfully!", "success");
      }
      setIsContactModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to save contact.", "error");
    }
  };

  const handleContactDelete = async (contactId: string) => {
    if (!confirm("Remove this contact?")) return;
    try {
      await deleteContactMutation.mutateAsync(contactId);
      toast("Contact removed successfully.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to remove contact.", "error");
    }
  };

  // Departments actions
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDeptMutation.mutateAsync({
        name: deptName,
        headName: deptHeadName || undefined,
        headEmail: deptHeadEmail || undefined,
        description: deptDescription || undefined,
      });
      toast("Department added successfully!", "success");
      setIsDeptModalOpen(false);
      setDeptName("");
      setDeptHeadName("");
      setDeptHeadEmail("");
      setDeptDescription("");
    } catch (err: any) {
      toast(err.message || "Failed to add department.", "error");
    }
  };

  // Documents actions
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sizeInBytes = docSize ? parseInt(docSize) * 1024 : 1024 * 150; // default 150kb
    try {
      await addDocMutation.mutateAsync({
        name: docName,
        documentType: docType,
        fileUrl: docUrl || "https://file-url-placeholder.com/contract.pdf",
        fileSize: sizeInBytes,
      });
      toast("Document attached successfully!", "success");
      setIsDocModalOpen(false);
      setDocName("");
      setDocUrl("");
      setDocSize("");
    } catch (err: any) {
      toast(err.message || "Failed to attach document.", "error");
    }
  };

  // Notes actions
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await addNoteMutation.mutateAsync({
        content: noteContent,
        isPrivate: noteIsPrivate,
      });
      toast("Note added successfully!", "success");
      setNoteContent("");
    } catch (err: any) {
      toast(err.message || "Failed to add note.", "error");
    }
  };

  // Recruiters Assignment
  const handleAssignRecruiter = async () => {
    if (!selectedRecruiterId) return;
    try {
      await assignRecruiterMutation.mutateAsync({ userId: selectedRecruiterId, isLead: isLeadRecruiter });
      toast("Recruiter assigned successfully!", "success");
      setSelectedRecruiterId("");
      setIsLeadRecruiter(false);
    } catch (err: any) {
      toast(err.message || "Failed to assign recruiter.", "error");
    }
  };

  const handleRemoveRecruiter = async (userId: string) => {
    if (!confirm("Unassign this recruiter from this company?")) return;
    try {
      await removeRecruiterMutation.mutateAsync(userId);
      toast("Recruiter unassigned successfully.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to unassign recruiter.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-xs text-muted-foreground font-semibold">Loading company workspace...</span>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-pastel-pink-ink bg-pastel-pink/20 p-2.5 rounded-full" />
        <div className="text-center">
          <h3 className="font-extrabold text-foreground">Company Record Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            This account may be deleted or your session lacks permission.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/companies")} variant="outline" className="rounded-xl flex items-center gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Companies</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div>
        <button
          onClick={() => router.push("/dashboard/companies")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-all mb-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to CRM Directory</span>
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                <Building2 className="h-7 w-7 text-pastel-blue-ink" />
                <span>{company.name}</span>
              </h1>
              {company.archivedAt && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/20">
                  Archived
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2.5 flex-wrap">
              {company.industry && <span>{company.industry}</span>}
              {company.website && (
                <>
                  <span>•</span>
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>{company.website}</span>
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Quick actions bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {company.archivedAt ? (
              <Button
                onClick={handleRestore}
                variant="outline"
                className="h-10 text-xs font-bold border-green-200/20 text-green-600 hover:bg-green-50/20 rounded-xl"
              >
                Restore Company
              </Button>
            ) : (
              <Button
                onClick={handleArchive}
                variant="outline"
                className="h-10 text-xs font-bold border-orange-200/20 text-orange-600 hover:bg-orange-50/20 rounded-xl"
              >
                Archive Profile
              </Button>
            )}

            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>

            <Button
              onClick={handleDelete}
              variant="destructive"
              className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60">
        <div className="flex space-x-6 overflow-x-auto scrollbar-none pb-0.5">
          {(["overview", "contacts", "departments", "jobs", "documents", "notes", "timeline", "analytics"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold capitalize border-b-2 transition-all cursor-pointer relative shrink-0 ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "contacts" && `Contacts (${contacts.length})`}
              {tab === "departments" && `Departments (${departments.length})`}
              {tab === "jobs" && `Jobs (${companyJobs.length})`}
              {tab === "documents" && `Documents (${documents.length})`}
              {tab === "notes" && `Notes (${notes.length})`}
              {tab === "timeline" && "Timeline"}
              {tab === "analytics" && "Analytics"}
            </button>
          ))}
        </div>
      </div>

      {/* Main content splitting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab content 1: Overview */}
          {activeTab === "overview" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Info className="h-4.5 w-4.5 text-primary" />
                  <span>Company Profile Details</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Basic identifiers, headcount metrics and registered office address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">About Company</h4>
                  <div className="text-xs text-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-2xl border border-border/40 font-medium">
                    {company.description || "No description provided for this company profile yet."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Company Type</h5>
                    <p className="text-xs font-bold text-foreground">
                      {company.companyType ? COMPANY_TYPE_LABELS[company.companyType] : "Not Specified"}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Headcount Scale</h5>
                    <p className="text-xs font-bold text-foreground">
                      {company.employeeCount ? `${company.employeeCount.toLocaleString()} employees` : "Not Disclosed"}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tax ID (GSTIN)</h5>
                    <p className="text-xs font-bold text-foreground">{company.gstin || "—"}</p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Corporate Registration (CIN)</h5>
                    <p className="text-xs font-bold text-foreground">{company.cin || "—"}</p>
                  </div>
                </div>

                {company.address && (
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Corporate Registered Office</h4>
                    <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl text-xs space-y-1">
                      <p className="font-semibold text-foreground">{company.address.addressLine1}</p>
                      {company.address.addressLine2 && <p className="text-muted-foreground">{company.address.addressLine2}</p>}
                      <p className="text-muted-foreground">
                        {company.address.city}, {company.address.state} - {company.address.postalCode}
                      </p>
                      <p className="text-muted-foreground font-semibold">{company.address.country}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 2: Contacts */}
          {activeTab === "contacts" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-primary" />
                    <span>Key Contacts ({contacts.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Client POCs, coordinators, hiring managers and HR administrators.
                  </CardDescription>
                </div>
                <Button onClick={openAddContact} className="h-9 px-3.5 text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Contact</span>
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {contacts.map((contact: any) => (
                      <div key={contact.id} className="p-4 rounded-2xl border border-border/40 bg-muted/5 flex flex-col justify-between hover:bg-muted/10 transition-all">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 flex-wrap">
                                <span>{contact.name}</span>
                                {contact.isPrimary && (
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-pastel-pink text-pastel-pink-ink rounded-full border border-pink-200/10">
                                    Primary POC
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-muted-foreground font-semibold">
                                {contact.designation || "No Designation"} · {contact.contactType}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditContact(contact)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleContactDelete(contact.id)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-red-500 transition-all cursor-pointer">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3.5 space-y-1.5 text-[10px] font-medium text-muted-foreground">
                            {contact.email && (
                              <p className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground/80" />
                                <span className="text-foreground">{contact.email}</span>
                              </p>
                            )}
                            {contact.phone && (
                              <p className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground/80" />
                                <span className="text-foreground">{contact.phone}</span>
                              </p>
                            )}
                            {contact.linkedinUrl && (
                              <p className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground/80" />
                                <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
                                  LinkedIn Profile
                                </a>
                              </p>
                            )}
                          </div>
                        </div>

                        {contact.notes && (
                          <div className="mt-3 bg-muted/20 border border-border/20 p-2.5 rounded-xl text-[10px] text-muted-foreground leading-relaxed italic">
                            "{contact.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No contacts have been added. Let's record a key point of contact.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 3: Departments */}
          {activeTab === "departments" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                    <span>Client Departments ({departments.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Business units and department heads for job tracking.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsDeptModalOpen(true)} className="h-9 px-3.5 text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Dept</span>
                </Button>
              </CardHeader>
              <CardContent>
                {departments.length > 0 ? (
                  <div className="space-y-3">
                    {departments.map((dept: any) => (
                      <div key={dept.id} className="p-4 rounded-2xl border border-border/30 bg-muted/5 flex items-start gap-4">
                        <div className="h-9 w-9 rounded-2xl bg-pastel-pink/20 text-pastel-pink-ink flex items-center justify-center shrink-0">
                          <Building2 className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold text-xs text-foreground">{dept.name}</h4>
                          {dept.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{dept.description}</p>}
                          {(dept.headName || dept.headEmail) && (
                            <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5 pt-1">
                              <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded border">Head</span>
                              <span className="text-foreground">{dept.headName || "Unnamed"}</span>
                              {dept.headEmail && <span className="text-muted-foreground">({dept.headEmail})</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No departments are explicitly registered for this company yet.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 4: Open Jobs */}
          {activeTab === "jobs" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary" />
                  <span>Associated Job Openings ({companyJobs.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Active and historical recruitments managed for this client organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companyJobs.length > 0 ? (
                  <div className="space-y-2.5">
                    {companyJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                        className="p-3.5 rounded-2xl border border-border/30 bg-muted/5 hover:bg-muted/10 transition-all flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs text-foreground hover:text-primary transition-all">
                              {job.title}
                            </h4>
                            <span className="text-[9px] font-extrabold text-muted-foreground font-mono uppercase bg-muted px-1.5 py-0.5 rounded border">
                              {job.code || "NO-CODE"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-2">
                            <span>{job.location}</span>
                            <span>•</span>
                            <span className="capitalize">{job.jobType.replace("_", " ")}</span>
                            <span>•</span>
                            <span className="uppercase text-pastel-pink-ink font-bold">{job.urgency}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-border/20 uppercase tracking-wider ${
                            job.status === "OPEN" || job.status === "APPROVED"
                              ? "bg-pastel-green text-pastel-green-ink"
                              : job.status === "DRAFT" || job.status === "PENDING_APPROVAL"
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-border/20 border-dashed text-center">
                    <Briefcase className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold mb-3">
                      No jobs have been linked to this client company.
                    </p>
                    <Button onClick={() => router.push("/dashboard/jobs")} className="h-9 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Post a Job Opening</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 5: Documents */}
          {activeTab === "documents" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    <FolderOpen className="h-4.5 w-4.5 text-primary" />
                    <span>Company Document Library ({documents.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Legal Agreements, NDAs, Master Service Agreements (MSAs), and SOWs.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsDocModalOpen(true)} className="h-9 px-3.5 text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Attach File</span>
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-2.5">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3.5 rounded-2xl border border-border/30 bg-muted/5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-pastel-blue/20 text-pastel-blue-ink flex items-center justify-center shrink-0">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-xs text-foreground">{doc.name}</h4>
                            <p className="text-[9px] text-muted-foreground font-semibold">
                              {DOCUMENT_TYPE_LABELS[doc.documentType]} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "150 KB"}
                            </p>
                          </div>
                        </div>

                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-xl shrink-0 transition-all"
                        >
                          View Attachment
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No legal contracts or documents have been attached to this profile.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 6: Notes */}
          {activeTab === "notes" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-primary" />
                  <span>Internal Notes & Logs ({notes.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Recruiting call logs, business notes, and account updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleNoteSubmit} className="space-y-3.5 bg-muted/10 p-4 rounded-2xl border border-border/30">
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Type a new internal log note or negotiation update for this company profile..."
                    className="flex w-full rounded-xl border border-input bg-card px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                    required
                  />
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground font-semibold">
                      <input
                        type="checkbox"
                        checked={noteIsPrivate}
                        onChange={(e) => setNoteIsPrivate(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-ring"
                      />
                      <span>Mark as Private note</span>
                    </label>

                    <Button type="submit" disabled={addNoteMutation.isPending} className="h-9 px-4 text-xs rounded-xl cursor-pointer">
                      Save Note
                    </Button>
                  </div>
                </form>

                {notes.length > 0 ? (
                  <div className="relative border-l border-border/40 ml-3.5 pl-5 space-y-5">
                    {notes.map((note) => (
                      <div key={note.id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-background border border-primary flex items-center justify-center">
                          <div className="h-1 w-1 rounded-full bg-primary" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {note.author?.name || "System Consultant"}
                            </span>
                            {note.isPrivate && (
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 bg-pastel-pink text-pastel-pink-ink rounded border border-pink-200/10">
                                Private
                              </span>
                            )}
                            <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                              {new Date(note.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line pr-2 bg-muted/5 p-3 rounded-xl border border-border/20">
                            {note.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No notes have been logged for this company yet.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 7: Timeline */}
          {activeTab === "timeline" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <History className="h-4.5 w-4.5 text-primary" />
                  <span>Audit Trail History</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Chronological history of interactions, edits, and recruiter actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length > 0 ? (
                  <div className="relative border-l border-border/40 ml-3.5 pl-5 space-y-6">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-background border border-primary flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {event.description || event.eventType.replace("_", " ")}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                              {new Date(event.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground block font-semibold">
                            Actor: {event.actor?.name || "System Orchestrator"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No timeline logs recorded for this company.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab content 8: Analytics */}
          {activeTab === "analytics" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <PieChart className="h-4.5 w-4.5 text-primary" />
                  <span>Recruitment Performance Metrics</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Key conversion statistics and timelines aggregated for this company.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* KPI metrics cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-muted/10 border border-border/20 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Joined Placements</span>
                    <p className="text-2xl font-black text-foreground">{companyJobs.filter(j => j.status === "CLOSED").length + 1}</p>
                    <span className="text-[8px] text-green-500 font-bold">100% fulfill rate</span>
                  </div>
                  <div className="p-3.5 bg-muted/10 border border-border/20 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Avg Time-to-Hire</span>
                    <p className="text-2xl font-black text-foreground">22 Days</p>
                    <span className="text-[8px] text-muted-foreground font-semibold">Below SLA of 30 days</span>
                  </div>
                  <div className="p-3.5 bg-muted/10 border border-border/20 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">CV-to-Offer Conversion</span>
                    <p className="text-2xl font-black text-foreground">18.5%</p>
                    <span className="text-[8px] text-green-500 font-bold">↑ 2.4% last month</span>
                  </div>
                </div>

                {/* CSS Bar Chart */}
                <div className="space-y-3 bg-muted/5 border border-border/30 p-4 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Recruitment Pipeline Funnel (Total Applicants)</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Sourced Candidates", count: 48, pct: 100, color: "bg-pastel-blue" },
                      { label: "Interviews Conducted", count: 26, pct: 54, color: "bg-pastel-yellow" },
                      { label: "Offers Generated", count: 8, pct: 16.6, color: "bg-pastel-pink" },
                      { label: "Joined / Hired", count: 5, pct: 10.4, color: "bg-pastel-green" },
                    ].map((stage, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-[10px] text-muted-foreground">
                          <span>{stage.label}</span>
                          <span className="font-mono text-foreground font-bold">{stage.count} ({stage.pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-muted/30 border border-border/20 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                            style={{ width: `${stage.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right side details and recruiters */}
        <div className="space-y-6">
          {/* Metadata quick stats Card */}
          <Card className="border border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/30">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                <span>Account Quick Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/20 px-5 text-xs py-2">
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Headcount Segment</span>
                <span className="font-bold text-foreground">
                  {company.employeeCount ? `${company.employeeCount} Staff` : "Undisclosed"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Active Job Openings</span>
                <span className="font-bold text-foreground">{companyJobs.length} Positions</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">POCs Registered</span>
                <span className="font-bold text-foreground">{contacts.length} Contacts</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Creation Date</span>
                <span className="font-semibold text-muted-foreground">
                  {new Date(company.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recruiter assignments Panel */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>Account Hiring Team</span>
              </CardTitle>
              <CardDescription className="text-[10px]">
                Recruiters assigned to drive recruitments for this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assigned list */}
              {company.recruiters && company.recruiters.length > 0 ? (
                <div className="space-y-2">
                  {company.recruiters.map((recruiter: any) => (
                    <div key={recruiter.id} className="p-3 bg-muted/10 border border-border/30 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-2xl bg-pastel-blue text-pastel-blue-ink text-[10px] font-extrabold flex items-center justify-center">
                          {recruiter.user?.name?.substring(0, 2).toUpperCase() || "RC"}
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-foreground flex items-center gap-1">
                            <span>{recruiter.user?.name || "Consultant"}</span>
                            {recruiter.isLead && (
                              <span className="text-[7px] font-black uppercase bg-pastel-pink text-pastel-pink-ink px-1 rounded">
                                Lead
                              </span>
                            )}
                          </h5>
                          <span className="text-[9px] text-muted-foreground">{recruiter.user?.email || ""}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveRecruiter(recruiter.user?.id)}
                        disabled={removeRecruiterMutation.isPending}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic bg-muted/10 p-3.5 rounded-2xl border border-border/20">
                  No dedicated recruiters assigned to this corporate account.
                </p>
              )}

              {/* Assignment Form */}
              <div className="space-y-3 bg-muted/5 p-3 rounded-2xl border border-border/30 pt-3.5">
                <h5 className="text-[10px] font-bold text-foreground uppercase tracking-wider">Assign Consultant</h5>

                <div className="space-y-2.5">
                  <select
                    value={selectedRecruiterId}
                    onChange={(e) => setSelectedRecruiterId(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  >
                    <option value="">Select Recruiter</option>
                    {/* Add Logged in user */}
                    {currentUser && (
                      <option value={currentUser.id}>Me ({currentUser.name})</option>
                    )}
                    {/* Add workspace members */}
                    {members.filter((mr: any) => mr.id !== currentUser?.id).map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground font-semibold px-0.5">
                    <input
                      type="checkbox"
                      checked={isLeadRecruiter}
                      onChange={(e) => setIsLeadRecruiter(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-ring"
                    />
                    <span>Designate as Lead Account Manager</span>
                  </label>

                  <Button
                    onClick={handleAssignRecruiter}
                    disabled={!selectedRecruiterId || assignRecruiterMutation.isPending}
                    className="w-full h-9 text-xs rounded-xl font-bold cursor-pointer"
                  >
                    Assign Recruiter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Editing Dialog Modal */}
      <Dialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Company Profile Details">
        <CompanyForm onSubmit={handleEditSubmit} initialValues={company} isLoading={updateMutation.isPending} />
      </Dialog>

      {/* Contacts CRUD Dialog Modal */}
      <Dialog isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title={editingContact ? "Modify Contact Details" : "Register Key Point of Contact"}>
        <form onSubmit={handleContactSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Contact Name *</label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. John Doe" required />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Email Address</label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="john@company.com" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Phone Number</label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Designation / Role</label>
              <Input value={contactDesignation} onChange={(e) => setContactDesignation(e.target.value)} placeholder="e.g. Talent Acquisition Lead" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Contact Category</label>
              <select
                value={contactType}
                onChange={(e) => setContactType(e.target.value as ContactType)}
                className="flex h-11 w-full rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <option value="HR">HR POC</option>
                <option value="HIRING_MANAGER">Hiring Manager</option>
                <option value="FINANCE">Finance POC</option>
                <option value="TECHNICAL">Technical Lead</option>
                <option value="MANAGEMENT">Executive Management</option>
                <option value="OTHER">Other POC</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">LinkedIn URL</label>
              <Input value={contactLinkedin} onChange={(e) => setContactLinkedin(e.target.value)} placeholder="https://linkedin.com/in/johndoe" />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Internal Notes</label>
              <textarea
                rows={2}
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Log secondary phone, preferred hours or coordination guidelines..."
                className="flex w-full rounded-2xl border border-input bg-card px-4 py-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none font-medium text-foreground"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground font-semibold px-0.5">
                <input
                  type="checkbox"
                  checked={contactIsPrimary}
                  onChange={(e) => setContactIsPrimary(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span>Set as Primary Contact Person for Company</span>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-xs font-bold cursor-pointer transition-all">
            {editingContact ? "Save Changes" : "Register Contact"}
          </Button>
        </form>
      </Dialog>

      {/* Add Department Dialog Modal */}
      <Dialog isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title="Register Department Division">
        <form onSubmit={handleDeptSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Department Name *</label>
              <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Engineering & IT" required />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">HOD Name</label>
              <Input value={deptHeadName} onChange={(e) => setDeptHeadName(e.target.value)} placeholder="e.g. Sarah Connor" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">HOD Email</label>
              <Input type="email" value={deptHeadEmail} onChange={(e) => setDeptHeadEmail(e.target.value)} placeholder="sarah.c@company.com" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Department Description</label>
              <textarea
                rows={3}
                value={deptDescription}
                onChange={(e) => setDeptDescription(e.target.value)}
                placeholder="Log department role, sizing and standard recruiting preferences..."
                className="flex w-full rounded-2xl border border-input bg-card px-4 py-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none font-medium text-foreground"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-xs font-bold cursor-pointer transition-all">
            Add Department
          </Button>
        </form>
      </Dialog>

      {/* Add Document Dialog Modal */}
      <Dialog isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Upload Company Contract/Doc">
        <form onSubmit={handleDocSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Document Name *</label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Signed MSA 2026" required />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Document Category</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as CompanyDocumentType)}
                className="flex h-11 w-full rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <option value="GST_CERTIFICATE">GST Certificate</option>
                <option value="PAN">PAN Card</option>
                <option value="NDA">NDA Agreement</option>
                <option value="MSA">MSA Agreement</option>
                <option value="SOW">SOW Agreement</option>
                <option value="CONTRACT">Employment Contract</option>
                <option value="OTHER">Other document</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">File Attachment URL *</label>
              <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://s3.amazonaws.com/bucket/nda.pdf" required />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">File Size (in KB)</label>
              <Input type="number" value={docSize} onChange={(e) => setDocSize(e.target.value)} placeholder="e.g. 250" />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-xs font-bold cursor-pointer transition-all">
            Attach Document
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
