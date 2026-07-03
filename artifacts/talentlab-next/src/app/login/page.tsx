"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, LoginInputSchema, RegisterTenantInput, RegisterTenantInputSchema } from "@workspace/shared-schemas";
import { useAuth } from "@/providers/AuthProvider";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Key, Mail, ShieldAlert } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pastel-pink/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pastel-blue/10 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border border-border shadow-2xl relative z-10 p-2 sm:p-4">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5 text-pastel-pink" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
            TalentLab <span className="text-pastel-pink font-light">RMS</span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {activeTab === "login" && "Access your recruitment dashboard"}
            {activeTab === "register" && "Register your agency workspace"}
            {activeTab === "forgot" && "Reset your portal access"}
            {activeTab === "reset" && "Create a secure new password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab Selection */}
          {(activeTab === "login" || activeTab === "register") && (
            <div className="flex border-b border-border/60">
              <button
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Onboard Agency
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-4 bg-destructive/10 text-destructive rounded-2xl text-xs border border-destructive/20">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-4 bg-pastel-green text-pastel-green-ink rounded-2xl text-xs border border-pastel-green-ink/10">
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
                    className="text-xs text-muted-foreground hover:text-primary transition-all cursor-pointer"
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
  );
}
