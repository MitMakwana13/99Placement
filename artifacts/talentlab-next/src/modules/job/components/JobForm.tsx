"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCompanies } from "@/modules/company/hooks/useCompanies";
import { Job } from "../types";

const jobFormSchema = z
  .object({
    companyId: z.string().uuid("Please select a hiring company"),
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    code: z.string().max(50).optional().or(z.literal("")),
    description: z.string().max(5000).optional().or(z.literal("")),
    location: z.string().min(2, "Location must be at least 2 characters").max(200),
    jobType: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).default("full_time"),
    urgency: z.enum(["CRITICAL", "HIGH", "NORMAL"]).default("NORMAL"),
    salaryMin: z.coerce.number().min(0).optional(),
    salaryMax: z.coerce.number().min(0).optional(),
    minExperience: z.coerce.number().min(0).optional(),
    maxExperience: z.coerce.number().min(0).optional(),
    openingsCount: z.coerce.number().int().positive("Must have at least 1 opening").default(1),
  })
  .refine(
    (d) => !(d.salaryMin !== undefined && d.salaryMax !== undefined && d.salaryMin > d.salaryMax),
    { message: "Min salary cannot exceed max salary", path: ["salaryMin"] }
  )
  .refine(
    (d) => !(d.minExperience !== undefined && d.maxExperience !== undefined && d.minExperience > d.maxExperience),
    { message: "Min experience cannot exceed max experience", path: ["minExperience"] }
  );

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  initialValues?: Partial<Job>;
  onSubmit: (values: JobFormValues) => void;
  isLoading?: boolean;
}

export function JobForm({ initialValues, onSubmit, isLoading }: JobFormProps) {
  const { data: companiesResult, isLoading: isLoadingCompanies } = useCompanies();
  const companies = companiesResult?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      companyId: initialValues?.companyId || "",
      title: initialValues?.title || "",
      code: initialValues?.code || "",
      description: initialValues?.description || "",
      location: initialValues?.location || "",
      jobType: initialValues?.jobType || "full_time",
      urgency: initialValues?.urgency || "NORMAL",
      salaryMin: initialValues?.salaryMin || undefined,
      salaryMax: initialValues?.salaryMax || undefined,
      minExperience: initialValues?.minExperience || undefined,
      maxExperience: initialValues?.maxExperience || undefined,
      openingsCount: initialValues?.openingsCount || 1,
    },
  });

  const jobTypeOptions = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
  ];

  const urgencyOptions = [
    { value: "NORMAL", label: "Normal Urgency" },
    { value: "HIGH", label: "High Priority" },
    { value: "CRITICAL", label: "Critical Priority" },
  ];

  const companyOptions = [
    { value: "", label: "Select Company..." },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company select dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hiring Company *</label>
          <Select
            options={companyOptions}
            disabled={isLoadingCompanies}
            {...register("companyId")}
          />
          {errors.companyId && (
            <p className="text-[10px] text-destructive font-medium">{errors.companyId.message}</p>
          )}
        </div>

        {/* Job Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Title *</label>
          <Input
            type="text"
            {...register("title")}
            placeholder="E.g. Principal Architect"
          />
          {errors.title && (
            <p className="text-[10px] text-destructive font-medium">{errors.title.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Job Code */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Code</label>
          <Input
            type="text"
            {...register("code")}
            placeholder="E.g. ENG-2026-04"
          />
          {errors.code && (
            <p className="text-[10px] text-destructive font-medium">{errors.code.message}</p>
          )}
        </div>

        {/* Job Location */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location / City *</label>
          <Input
            type="text"
            {...register("location")}
            placeholder="E.g. Bangalore, India (Hybrid)"
          />
          {errors.location && (
            <p className="text-[10px] text-destructive font-medium">{errors.location.message}</p>
          )}
        </div>

        {/* Openings count */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Openings Count</label>
          <Input
            type="number"
            {...register("openingsCount")}
            placeholder="1"
          />
          {errors.openingsCount && (
            <p className="text-[10px] text-destructive font-medium">{errors.openingsCount.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Job Type select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Type</label>
          <Select
            options={jobTypeOptions}
            {...register("jobType")}
          />
        </div>

        {/* Sourcing urgency priority */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Urgency Priority</label>
          <Select
            options={urgencyOptions}
            {...register("urgency")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Experience Bounds */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Min Exp (Yrs)</label>
          <Input
            type="number"
            {...register("minExperience")}
            placeholder="0"
          />
          {errors.minExperience && (
            <p className="text-[10px] text-destructive font-medium">{errors.minExperience.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Max Exp (Yrs)</label>
          <Input
            type="number"
            {...register("maxExperience")}
            placeholder="12"
          />
        </div>

        {/* Salary bounds */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Min Salary ($)</label>
          <Input
            type="number"
            {...register("salaryMin")}
            placeholder="80000"
          />
          {errors.salaryMin && (
            <p className="text-[10px] text-destructive font-medium">{errors.salaryMin.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Max Salary ($)</label>
          <Input
            type="number"
            {...register("salaryMax")}
            placeholder="150000"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Description</label>
        <textarea
          rows={4}
          {...register("description")}
          placeholder="Brief job description and responsibilities..."
          className="flex w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
        <Button type="submit" isLoading={isLoading} className="px-6">
          Publish Job Posting
        </Button>
      </div>
    </form>
  );
}
