"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, LoginInputSchema, RegisterTenantInput, RegisterTenantInputSchema } from "@workspace/shared-schemas";
import { useAuth } from "@/providers/AuthProvider";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Key, Mail, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot" | "reset">("login");
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

  // Forgot Password Form state
  const [forgotEmail, setForgotEmail] = useState("");
  
  // Reset Password Form state
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const onLogin = async (data: LoginInput) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await authService.login(data);
      login(res.accessToken, res.user);
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
      await authService.registerTenant(data);
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

  const onForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg("Please enter your email address");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setSuccessMsg("If your email is registered, we have sent password reset instructions.");
      setForgotEmail("");
      setActiveTab("reset"); // Prompt user to enter the reset token
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setErrorMsg("Please fill out all fields");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await authService.resetPassword({ token: resetToken, password: newPassword });
      setSuccessMsg("Your password has been successfully reset. Please log in.");
      setResetToken("");
      setNewPassword("");
      setActiveTab("login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-noise min-h-screen overflow-hidden bg-background px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden rounded-[2.5rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.56))] p-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl lg:flex lg:min-h-[760px] lg:flex-col lg:justify-between dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.82),rgba(15,23,42,0.7))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,174,73,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.12),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(214,174,73,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_35%)]" />
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/6">
              <span className="h-2 w-2 rounded-full bg-primary" />
              99 Placement RMS
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/6">
                  <Image
                    src="/brand/99-placement-logo.png"
                    alt="99 Placement logo"
                    width={104}
                    height={104}
                    className="h-24 w-24 rounded-[1.4rem] object-cover"
                    priority
                  />
                </div>
                <Logo className="h-14 w-auto" />
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.06em] text-foreground">
                  Recruitment software with the clarity of a premium operating system.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">
                  A polished workspace for agencies that want hiring operations to feel calm, precise, and confidently enterprise from the first click.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { value: "3.1x", label: "Faster candidate movement" },
                { value: "99%", label: "Workflow visibility across teams" },
                { value: "< 2m", label: "From login to live pipeline view" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.75rem] border border-white/60 bg-white/66 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between rounded-[1.8rem] border border-white/65 bg-white/72 px-5 py-4 text-sm text-muted-foreground shadow-[0_12px_28px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="font-semibold text-foreground">Designed for disciplined teams</p>
              <p className="mt-1">Minimal friction. Better visibility. Stronger brand trust.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
        </section>

        <Card className="relative z-10 w-full border-white/70 p-2 shadow-modal sm:p-4 dark:border-white/10">
          <CardHeader className="space-y-5 pb-6 text-left">
            <div className="flex items-center gap-4">
              <div className="overflow-hidden rounded-[1.6rem] border border-white/75 bg-white/90 p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/8">
                <Image
                  src="/brand/99-placement-logo.png"
                  alt="99 Placement logo"
                  width={72}
                  height={72}
                  className="h-16 w-16 rounded-[1.25rem] object-cover"
                  priority
                />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                  Welcome back
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Sign in to your 99 Placement workspace
                </CardDescription>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/70 bg-white/68 px-4 py-3 text-xs text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5">
              Built for agencies that want enterprise-grade polish without the usual heavy, outdated admin UI.
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
          {/* Tab Selection */}
          {(activeTab === "login" || activeTab === "register") && (
            <div className="grid grid-cols-2 rounded-[1.4rem] border border-border/70 bg-muted/70 p-1.5">
              <button
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`rounded-[1rem] px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-card text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`rounded-[1rem] px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-card text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Onboard Agency
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-[1.4rem] border border-destructive/18 bg-destructive/8 p-4 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-[1.4rem] border border-primary/18 bg-primary/10 p-4 text-xs text-primary">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login tab */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Input
                    type="email"
                    {...registerLogin("email")}
                    placeholder="you@agency.com"
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-[10px] text-destructive font-medium">{loginErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  type="password"
                  {...registerLogin("password")}
                  placeholder="••••••••"
                />
                {loginErrors.password && (
                  <p className="text-[10px] text-destructive font-medium">{loginErrors.password.message}</p>
                )}
              </div>

              <Button type="submit" isLoading={loading} className="w-full mt-2">
                Sign In
              </Button>
            </form>
          )}

          {/* Agency Onboarding tab */}
          {activeTab === "register" && (
            <form onSubmit={handleTenantSubmit(onRegisterTenant)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Agency Name</label>
                  <Input
                    type="text"
                    {...registerTenant("tenantName")}
                    placeholder="Apex Consulting"
                  />
                  {tenantErrors.tenantName && (
                    <p className="text-[10px] text-destructive font-medium">{tenantErrors.tenantName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain Slug</label>
                  <Input
                    type="text"
                    {...registerTenant("tenantSlug")}
                    placeholder="apex"
                  />
                  {tenantErrors.tenantSlug && (
                    <p className="text-[10px] text-destructive font-medium">{tenantErrors.tenantSlug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Full Name</label>
                <Input
                  type="text"
                  {...registerTenant("adminName")}
                  placeholder="Jane Doe"
                />
                {tenantErrors.adminName && (
                  <p className="text-[10px] text-destructive font-medium">{tenantErrors.adminName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Email</label>
                <Input
                  type="email"
                  {...registerTenant("adminEmail")}
                  placeholder="jane@apex.com"
                />
                {tenantErrors.adminEmail && (
                  <p className="text-[10px] text-destructive font-medium">{tenantErrors.adminEmail.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Password</label>
                <Input
                  type="password"
                  {...registerTenant("adminPassword")}
                  placeholder="••••••••"
                />
                {tenantErrors.adminPassword && (
                  <p className="text-[10px] text-destructive font-medium">{tenantErrors.adminPassword.message}</p>
                )}
              </div>

              <Button type="submit" isLoading={loading} className="w-full mt-2">
                Onboard Workspace
              </Button>
            </form>
          )}

          {/* Forgot Password View */}
          {activeTab === "forgot" && (
            <form onSubmit={onForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="enter your registered email"
                  required
                />
              </div>

              <Button type="submit" isLoading={loading} className="w-full">
                <Mail className="h-4 w-4 mr-2" /> Send Reset Link
              </Button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-all py-1 cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Reset Password View */}
          {activeTab === "reset" && (
            <form onSubmit={onResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reset Token</label>
                <Input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="paste the token sent to your email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" isLoading={loading} className="w-full">
                <Key className="h-4 w-4 mr-2" /> Save New Password
              </Button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-all py-1 cursor-pointer"
              >
                Cancel and return
              </button>
            </form>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
