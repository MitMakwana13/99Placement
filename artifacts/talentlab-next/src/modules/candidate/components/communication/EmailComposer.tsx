import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/providers/ToastProvider";
import { apiClient } from "@/lib/api-client";
import { Mail, Send } from "lucide-react";

interface EmailComposerProps {
  candidateEmail: string;
  pipelineId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailComposer({ candidateEmail, pipelineId, isOpen, onClose }: EmailComposerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!pipelineId) {
      toast("No active pipeline for this candidate.", "error");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast("Please fill in subject and body.", "error");
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post("/communication/email", {
        to: candidateEmail,
        subject,
        html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
        pipelineId
      });
      toast("Email sent and logged to timeline!", "success");
      setSubject("");
      setBody("");
      onClose();
    } catch (error) {
      toast("Failed to send email.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Compose Email">
      <div className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Send an email directly to {candidateEmail}. This will be logged in the candidate's timeline.
        </p>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject</label>
          <Input 
            placeholder="e.g. Next Steps in your application" 
            value={subject}
            onChange={(e: any) => setSubject(e.target.value)}
            className="rounded-xl h-11"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message Body</label>
          <textarea 
            placeholder="Type your message here..." 
            value={body}
            onChange={(e: any) => setBody(e.target.value)}
            className="flex min-h-[160px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSending} className="rounded-xl h-11">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="rounded-xl h-11 flex items-center gap-2">
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
