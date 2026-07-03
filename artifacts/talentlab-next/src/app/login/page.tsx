"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, LoginInputSchema, RegisterTenantInput, RegisterTenantInputSchema } from "@workspace/shared-schemas";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
  });

  // Onboard Tenant Form
  const {
    register: registerTenant,
    handleSubmit: handleTenantSubmit,
    formState: { errors: tenantErrors },
    reset: resetTenantForm,
  } = useForm<RegisterTenantInput>({
    resolver: zodResolver(RegisterTenantInputSchema),
  });

  const onLogin = async (data: LoginInput) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Login failed");
      }
      login(resData.data.token, resData.data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterTenant = async (data: RegisterTenantInput) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/v1/auth/register-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Onboarding failed");
      }
      setSuccessMsg("Consultancy registered successfully! You can now log in.");
      resetTenantForm();
      setActiveTab("login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            TalentLab <span className="text-pastel-pink-ink dark:text-pastel-pink font-light">RMS</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "login"
              ? "Access your recruitment dashboard"
              : "Register your agency workspace"}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border">
          <button
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "login"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            User Login
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "register"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Onboard Agency
          </button>
        </div>

        {/* Messaging Feedback */}
        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl text-xs border border-red-100 dark:border-red-950">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs border border-emerald-100 dark:border-emerald-950">
            {successMsg}
          </div>
        )}

        {/* Tabs Content */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
              <input
                type="email"
                {...registerLogin("email")}
                placeholder="you@agency.com"
                className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
              />
              {loginErrors.email && (
                <p className="text-[10px] text-red-500 font-medium">{loginErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Password</label>
              <input
                type="password"
                {...registerLogin("password")}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
              />
              {loginErrors.password && (
                <p className="text-[10px] text-red-500 font-medium">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-2xl shadow hover:opacity-90 disabled:opacity-50 transition-all text-sm mt-2"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTenantSubmit(onRegisterTenant)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Agency Name</label>
                <input
                  type="text"
                  {...registerTenant("tenantName")}
                  placeholder="Apex Consulting"
                  className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
                />
                {tenantErrors.tenantName && (
                  <p className="text-[10px] text-red-500 font-medium">{tenantErrors.tenantName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Domain Slug</label>
                <input
                  type="text"
                  {...registerTenant("tenantSlug")}
                  placeholder="apex"
                  className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
                />
                {tenantErrors.tenantSlug && (
                  <p className="text-[10px] text-red-500 font-medium">{tenantErrors.tenantSlug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Full Name</label>
              <input
                type="text"
                {...registerTenant("adminName")}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
              />
              {tenantErrors.adminName && (
                <p className="text-[10px] text-red-500 font-medium">{tenantErrors.adminName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Email</label>
              <input
                type="email"
                {...registerTenant("adminEmail")}
                placeholder="jane@apex.com"
                className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
              />
              {tenantErrors.adminEmail && (
                <p className="text-[10px] text-red-500 font-medium">{tenantErrors.adminEmail.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Admin Password</label>
              <input
                type="password"
                {...registerTenant("adminPassword")}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
              />
              {tenantErrors.adminPassword && (
                <p className="text-[10px] text-red-500 font-medium">{tenantErrors.adminPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-2xl shadow hover:opacity-90 disabled:opacity-50 transition-all text-sm mt-2"
            >
              {loading ? "Registering Agency..." : "Onboard Workspace"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
