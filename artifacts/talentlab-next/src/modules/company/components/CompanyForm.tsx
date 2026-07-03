"use client";

import React, { useState } from "react";
import { Company, CreateCompanyInput, CompanyType } from "../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface CompanyFormProps {
  onSubmit: (values: CreateCompanyInput) => void;
  initialValues?: Partial<Company>;
  isLoading?: boolean;
}

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "PUBLIC_LIMITED", label: "Public Limited" },
  { value: "LLP", label: "LLP" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "OTHER", label: "Other" },
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "FMCG",
  "Logistics",
  "Media & Entertainment",
  "Consulting",
  "Automotive",
  "Construction",
  "Energy",
  "Hospitality",
  "Other",
];

export function CompanyForm({
  onSubmit,
  initialValues,
  isLoading,
}: CompanyFormProps) {
  const [values, setValues] = useState<CreateCompanyInput>({
    name: initialValues?.name || "",
    industry: initialValues?.industry || "",
    website: initialValues?.website || "",
    gstin: initialValues?.gstin || "",
    pan: initialValues?.pan || "",
    cin: initialValues?.cin || "",
    email: initialValues?.email || "",
    phone: initialValues?.phone || "",
    employeeCount: initialValues?.employeeCount || undefined,
    companyType: initialValues?.companyType || "PRIVATE_LIMITED",
    logoUrl: initialValues?.logoUrl || "",
    description: initialValues?.description || "",
    address: initialValues?.address
      ? {
          addressLine1: initialValues.address.addressLine1 || "",
          addressLine2: initialValues.address.addressLine2 || "",
          city: initialValues.address.city || "",
          state: initialValues.address.state || "",
          postalCode: initialValues.address.postalCode || "",
          country: initialValues.address.country || "India",
        }
      : undefined,
  });

  const [showAddress, setShowAddress] = useState(!!initialValues?.address);

  const set = (field: keyof CreateCompanyInput, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const setAddress = (field: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      address: { ...(prev.address || { addressLine1: "", city: "", state: "", postalCode: "" }), [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Strip empty strings to undefined for optional fields
    const cleaned: CreateCompanyInput = {
      ...values,
      industry: values.industry || undefined,
      website: values.website || undefined,
      gstin: values.gstin || undefined,
      pan: values.pan || undefined,
      cin: values.cin || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      logoUrl: values.logoUrl || undefined,
      description: values.description || undefined,
      address: showAddress && values.address?.addressLine1 ? values.address : undefined,
    };
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

      {/* Section: Basic Info */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1.5">
          Core Information
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. TechCorp India Pvt Ltd"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Industry
            </label>
            <select
              value={values.industry || ""}
              onChange={(e) => set("industry", e.target.value)}
              className="flex h-11 w-full rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              <option value="">Select Industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Company Type
            </label>
            <select
              value={values.companyType}
              onChange={(e) => set("companyType", e.target.value as CompanyType)}
              className="flex h-11 w-full rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              {COMPANY_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Email
            </label>
            <Input
              type="email"
              value={values.email || ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Phone
            </label>
            <Input
              value={values.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Website
            </label>
            <Input
              value={values.website || ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://company.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
              Employee Count
            </label>
            <Input
              type="number"
              value={values.employeeCount || ""}
              onChange={(e) => set("employeeCount", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g. 500"
            />
          </div>
        </div>
      </div>

      {/* Section: Legal Identifiers */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1.5">
          Legal Identifiers
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">GSTIN</label>
            <Input
              value={values.gstin || ""}
              onChange={(e) => set("gstin", e.target.value)}
              placeholder="22AAABB1234C1Z5"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">PAN</label>
            <Input
              value={values.pan || ""}
              onChange={(e) => set("pan", e.target.value)}
              placeholder="AAABB1234C"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">CIN</label>
            <Input
              value={values.cin || ""}
              onChange={(e) => set("cin", e.target.value)}
              placeholder="U12345MH2020PTC123456"
            />
          </div>
        </div>
      </div>

      {/* Section: Description */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">
          Company Description
        </label>
        <textarea
          rows={3}
          value={values.description || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Short overview of this company's core business operations and specialization..."
          className="flex w-full rounded-2xl border border-input bg-card px-4 py-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
        />
      </div>

      {/* Section: Address (toggle) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1.5 flex-1">
            Registered Address
          </h3>
          <button
            type="button"
            onClick={() => setShowAddress(!showAddress)}
            className="text-[10px] font-bold text-primary hover:underline ml-3 cursor-pointer"
          >
            {showAddress ? "Remove" : "+ Add Address"}
          </button>
        </div>
        {showAddress && (
          <div className="grid grid-cols-2 gap-3 p-4 bg-muted/10 border border-border/30 rounded-2xl">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <Input
                value={values.address?.addressLine1 || ""}
                onChange={(e) => setAddress("addressLine1", e.target.value)}
                placeholder="Building, Street, Area"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
                Address Line 2
              </label>
              <Input
                value={values.address?.addressLine2 || ""}
                onChange={(e) => setAddress("addressLine2", e.target.value)}
                placeholder="Floor, Landmark (optional)"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">City</label>
              <Input
                value={values.address?.city || ""}
                onChange={(e) => setAddress("city", e.target.value)}
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">State</label>
              <Input
                value={values.address?.state || ""}
                onChange={(e) => setAddress("state", e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
                Postal Code
              </label>
              <Input
                value={values.address?.postalCode || ""}
                onChange={(e) => setAddress("postalCode", e.target.value)}
                placeholder="400001"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">
                Country
              </label>
              <Input
                value={values.address?.country || "India"}
                onChange={(e) => setAddress("country", e.target.value)}
                placeholder="India"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11 text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all"
        disabled={isLoading}
      >
        {isLoading
          ? "Saving..."
          : initialValues?.id
          ? "Update Company Profile"
          : "Create Company Account"}
      </Button>
    </form>
  );
}
