"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/providers/ToastProvider";
import { CheckCircle } from "lucide-react";

function AcceptInviteForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const accept = useMutation({
    mutationFn: () => api.post("/workspace/invite/accept", { token, name, password }).then(r => r.data),
    onSuccess: (data) => {
      toast(data.message ?? "Account created!", "success");
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    },
    onError: (e: any) => toast(e?.response?.data?.error ?? "Failed to accept invite", "error"),
  });

  if (!token) return (
    <div className="text-center py-12">
      <p className="text-red-400">Invalid or missing invite token.</p>
    </div>
  );

  if (done) return (
    <Card className="max-w-md mx-auto mt-20 border border-emerald-500/30 bg-emerald-500/5">
      <CardContent className="pt-8 pb-6 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">Welcome aboard!</h2>
        <p className="text-sm text-muted-foreground mt-2">Your account has been created. Redirecting to login...</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md glass-panel shadow-soft border border-border/80 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-enterprise-indigo/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-enterprise-indigo font-black text-lg">99</span>
          </div>
          <CardTitle className="text-xl font-bold">Accept Invitation</CardTitle>
          <CardDescription>Create your 99 Placement account to join the workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd">Password</Label>
            <Input id="pwd" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, include a number" />
          </div>
          <Button
            className="w-full bg-enterprise-indigo hover:bg-enterprise-indigo/90 text-white font-semibold shadow-sm transition-all"
            disabled={!name || password.length < 8 || accept.isPending}
            onClick={() => accept.mutate()}
          >
            {accept.isPending ? "Creating Account..." : "Create Account & Join"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
