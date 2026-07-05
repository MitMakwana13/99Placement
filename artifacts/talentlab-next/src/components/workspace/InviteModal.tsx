"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/providers/ToastProvider";
import { X } from "lucide-react";

interface Role { id: string; name: string; }

export function InviteModal({ open, onClose, roles }: { open: boolean; onClose: () => void; roles: Role[] }) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const invite = useMutation({
    mutationFn: (data: { email: string; roleId: string }) => api.post("/workspace/invite", data).then(r => r.data),
    onSuccess: () => {
      toast("Invitation sent!", "success");
      qc.invalidateQueries({ queryKey: ["workspace-invites"] });
      setEmail(""); setRoleId(""); onClose();
    },
    onError: (e: any) => toast(e?.response?.data?.error ?? "Failed to send invite", "error"),
  });

  const roleOptions = [
    { value: "", label: "Select a role..." },
    ...roles.map(r => ({ value: r.id, label: r.name }))
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md border border-border/80 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Invite Team Member</CardTitle>
            <CardDescription className="text-xs mt-0.5">They'll receive an email with a 72-hour link</CardDescription>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input id="invite-email" type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              id="invite-role"
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              options={roleOptions}
            />
          </div>
          <Button className="w-full" disabled={!email || !roleId || invite.isPending} onClick={() => invite.mutate({ email, roleId })}>
            {invite.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
