"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Candidate } from "../types";

const candidateFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().or(z.literal("")),
  currentRole: z.string().optional().or(z.literal("")),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative").optional(),
  location: z.string().optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
  source: z.string().default("portal"),
  currentCtc: z.coerce.number().min(0).optional(),
  expectedCtc: z.coerce.number().min(0).optional(),
  noticeDays: z.coerce.number().min(0).optional(),
  summary: z.string().optional().or(z.literal("")),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

interface CandidateFormProps {
  initialValues?: Partial<Candidate>;
  onSubmit: (values: CandidateFormValues) => void;
  isLoading?: boolean;
}

export function CandidateForm({ initialValues, onSubmit, isLoading }: CandidateFormProps) {
  // Convert list or string skills to display cleanly in form field
  const formatInitialSkills = (skills: any) => {
    if (Array.isArray(skills)) return skills.join(", ");
    if (typeof skills === "string") return skills;
    return "";
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      email: initialValues?.email || "",
      phone: initialValues?.phone || "",
      currentRole: initialValues?.currentRole || "",
      experienceYears: initialValues?.experienceYears || undefined,
      location: initialValues?.location || "",
      skills: formatInitialSkills(initialValues?.skills),
      source: initialValues?.source || "portal",
      currentCtc: initialValues?.currentCtc || undefined,
      expectedCtc: initialValues?.expectedCtc || undefined,
      noticeDays: initialValues?.noticeDays || undefined,
      summary: initialValues?.summary || "",
    },
  });

  const sourceOptions = [
    { value: "portal", label: "Internal Portal" },
    { value: "linkedin", label: "LinkedIn Sourced" },
    { value: "referral", label: "Employee Referral" },
    { value: "career_page", label: "Careers Page Application" },
    { value: "agency", label: "External Agency Referral" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
          <Input
            type="text"
            {...register("name")}
            placeholder="E.g. Jane Cooper"
          />
          {errors.name && (
            <p className="text-[10px] text-destructive font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address *</label>
          <Input
            type="email"
            {...register("email")}
            placeholder="jane.cooper@example.com"
          />
          {errors.email && (
            <p className="text-[10px] text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
          <Input
            type="tel"
            {...register("phone")}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* Current Role */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Role</label>
          <Input
            type="text"
            {...register("currentRole")}
            placeholder="E.g. Senior Frontend Engineer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Experience Years */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Years of Experience</label>
          <Input
            type="number"
            {...register("experienceYears")}
            placeholder="E.g. 5"
          />
          {errors.experienceYears && (
            <p className="text-[10px] text-destructive font-medium">{errors.experienceYears.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location / City</label>
          <Input
            type="text"
            {...register("location")}
            placeholder="E.g. San Francisco, CA"
          />
        </div>

        {/* Sourcing Channel */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source Channel</label>
          <Select
            options={sourceOptions}
            {...register("source")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current CTC */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current CTC ($)</label>
          <Input
            type="number"
            {...register("currentCtc")}
            placeholder="E.g. 120000"
          />
        </div>

        {/* Expected CTC */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expected CTC ($)</label>
          <Input
            type="number"
            {...register("expectedCtc")}
            placeholder="E.g. 140000"
          />
        </div>

        {/* Notice Period */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notice Period (Days)</label>
          <Input
            type="number"
            {...register("noticeDays")}
            placeholder="E.g. 30"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Skills (Comma Separated)</label>
        <Input
          type="text"
          {...register("skills")}
          placeholder="React, TypeScript, Next.js, Node.js"
        />
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Professional Summary</label>
        <textarea
          rows={3}
          {...register("summary")}
          placeholder="Short overview highlighting key achievements and skills..."
          className="flex w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
        />
      </div>

      {/* Action triggers */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
        <Button type="submit" isLoading={isLoading} className="px-6">
          Save Profile
        </Button>
      </div>
    </form>
  );
}
